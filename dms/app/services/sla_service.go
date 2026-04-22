package services

import (
	"math"
	"time"

	"dms/app/facades"
	"dms/app/models"
)

type SLAService struct{}

func NewSLAService() *SLAService {
	return &SLAService{}
}

// SLADashboardStats holds aggregated SLA statistics
type SLADashboardStats struct {
	TotalActive      int64   `json:"total_active"`
	OnTrack          int64   `json:"on_track"`
	AtRisk           int64   `json:"at_risk"`
	Breached         int64   `json:"breached"`
	AvgCompletionHrs float64 `json:"avg_completion_hours"`
	ComplianceRate   float64 `json:"compliance_rate"`
	TotalCompleted   int64   `json:"total_completed"`
	CompletedOnTime  int64   `json:"completed_on_time"`
}

// SLABreachedItem represents a step that has breached or is at risk
type SLABreachedItem struct {
	StepInstanceID string     `json:"step_instance_id"`
	StepName       string     `json:"step_name"`
	StepOrder      int        `json:"step_order"`
	DocumentID     string     `json:"document_id"`
	DocumentTitle  string     `json:"document_title"`
	DocumentNumber string     `json:"document_number"`
	WorkflowName   string     `json:"workflow_name"`
	AssigneeName   string     `json:"assignee_name"`
	Deadline       *time.Time `json:"deadline"`
	ActivatedAt    *time.Time `json:"activated_at"`
	OverdueHours   float64    `json:"overdue_hours"`
	Status         string     `json:"status"` // breached, at_risk
	Escalated      bool       `json:"escalated"`
}

// GetDashboardStats returns SLA statistics
func (s *SLAService) GetDashboardStats() (*SLADashboardStats, error) {
	stats := &SLADashboardStats{}
	now := time.Now()
	riskThreshold := now.Add(24 * time.Hour)

	// Count active steps with deadlines
	count, err := facades.Orm().Query().
		Model(&models.WorkflowStepInstance{}).
		Where("status = 'active' AND deadline IS NOT NULL").
		Count()
	if err != nil {
		return nil, err
	}
	stats.TotalActive = count

	// On track: deadline > riskThreshold (safe margin > 24h)
	count, err = facades.Orm().Query().
		Model(&models.WorkflowStepInstance{}).
		Where("status = 'active' AND deadline IS NOT NULL AND deadline > ?", riskThreshold).
		Count()
	if err != nil {
		return nil, err
	}
	stats.OnTrack = count

	// At risk: deadline within 24h but not yet breached
	count, err = facades.Orm().Query().
		Model(&models.WorkflowStepInstance{}).
		Where("status = 'active' AND deadline IS NOT NULL AND deadline <= ? AND deadline > ?", riskThreshold, now).
		Count()
	if err != nil {
		return nil, err
	}
	stats.AtRisk = count

	// Breached: deadline already passed
	count, err = facades.Orm().Query().
		Model(&models.WorkflowStepInstance{}).
		Where("status = 'active' AND deadline IS NOT NULL AND deadline < ?", now).
		Count()
	if err != nil {
		return nil, err
	}
	stats.Breached = count

	// Completed steps stats (for compliance rate)
	count, err = facades.Orm().Query().
		Model(&models.WorkflowStepInstance{}).
		Where("status IN ('approved', 'rejected') AND completed_at IS NOT NULL AND deadline IS NOT NULL").
		Count()
	if err != nil {
		return nil, err
	}
	stats.TotalCompleted = count

	// Completed on time
	count, err = facades.Orm().Query().
		Model(&models.WorkflowStepInstance{}).
		Where("status IN ('approved', 'rejected') AND completed_at IS NOT NULL AND deadline IS NOT NULL AND completed_at <= deadline").
		Count()
	if err != nil {
		return nil, err
	}
	stats.CompletedOnTime = count

	if stats.TotalCompleted > 0 {
		stats.ComplianceRate = math.Round(float64(stats.CompletedOnTime)/float64(stats.TotalCompleted)*10000) / 100
	}

	// Average completion hours
	var avgResult struct {
		AvgHours *float64
	}
	err = facades.Orm().Query().Raw(
		"SELECT AVG(EXTRACT(EPOCH FROM (completed_at - activated_at)) / 3600) as avg_hours FROM workflow_step_instances WHERE status IN ('approved', 'rejected') AND completed_at IS NOT NULL AND activated_at IS NOT NULL",
	).Scan(&avgResult)
	if err == nil && avgResult.AvgHours != nil {
		stats.AvgCompletionHrs = math.Round(*avgResult.AvgHours*100) / 100
	}

	return stats, nil
}

// GetBreachedSteps returns steps that have breached SLA or are at risk
func (s *SLAService) GetBreachedSteps(includeAtRisk bool) ([]SLABreachedItem, error) {
	now := time.Now()
	riskThreshold := now.Add(24 * time.Hour)

	var threshold time.Time
	if includeAtRisk {
		threshold = riskThreshold
	} else {
		threshold = now
	}

	query := `
		SELECT 
			wsi.id as step_instance_id,
			ws.name as step_name,
			wsi.step_order,
			d.id as document_id,
			d.title as document_title,
			d.document_number,
			w.name as workflow_name,
			COALESCE(u.name, 'Tidak diketahui') as assignee_name,
			wsi.deadline,
			wsi.activated_at,
			wsi.escalated
		FROM workflow_step_instances wsi
		JOIN workflow_instances wi ON wi.id = wsi.workflow_instance_id
		JOIN workflow_steps ws ON ws.id = wsi.workflow_step_id
		JOIN documents d ON d.id = wi.document_id
		JOIN workflows w ON w.id = wi.workflow_id
		LEFT JOIN users u ON u.id = ws.assignee_user_id
		WHERE wsi.status = 'active' AND wsi.deadline IS NOT NULL AND wsi.deadline <= $1
		ORDER BY wsi.deadline ASC
	`

	type rawRow struct {
		StepInstanceID string
		StepName       string
		StepOrder      int
		DocumentID     string
		DocumentTitle  string
		DocumentNumber string
		WorkflowName   string
		AssigneeName   string
		Deadline       *time.Time
		ActivatedAt    *time.Time
		Escalated      bool
	}

	var rows []rawRow
	if err := facades.Orm().Query().Raw(query, threshold).Scan(&rows); err != nil {
		return nil, err
	}

	var items []SLABreachedItem
	for _, r := range rows {
		item := SLABreachedItem{
			StepInstanceID: r.StepInstanceID,
			StepName:       r.StepName,
			StepOrder:      r.StepOrder,
			DocumentID:     r.DocumentID,
			DocumentTitle:  r.DocumentTitle,
			DocumentNumber: r.DocumentNumber,
			WorkflowName:   r.WorkflowName,
			AssigneeName:   r.AssigneeName,
			Deadline:       r.Deadline,
			ActivatedAt:    r.ActivatedAt,
			Escalated:      r.Escalated,
		}

		if r.Deadline != nil {
			if r.Deadline.Before(now) {
				item.Status = "breached"
				item.OverdueHours = math.Round(now.Sub(*r.Deadline).Hours()*100) / 100
			} else {
				item.Status = "at_risk"
				item.OverdueHours = 0
			}
		}

		items = append(items, item)
	}

	return items, nil
}
