package repositories

import (
	"dms/app/facades"
	"dms/app/models"
)

type AuditRepository interface {
	Create(log *models.AuditLog) error
	List(filters map[string]any) ([]models.AuditLog, int64, error)
}

type auditRepository struct{}

func NewAuditRepository() AuditRepository {
	return &auditRepository{}
}

func (r *auditRepository) Create(log *models.AuditLog) error {
	return facades.Orm().Query().Create(log)
}

func (r *auditRepository) List(filters map[string]any) ([]models.AuditLog, int64, error) {
	query := facades.Orm().Query().Model(&models.AuditLog{})

	if v, ok := filters["company_id"].(string); ok && v != "" {
		query = query.Where("company_id = ?", v)
	}
	if v, ok := filters["office_id"].(string); ok && v != "" {
		query = query.Where("office_id = ?", v)
	}
	if v, ok := filters["user_id"].(string); ok && v != "" {
		query = query.Where("user_id = ?", v)
	}
	if v, ok := filters["action"].(string); ok && v != "" {
		query = query.Where("action = ?", v)
	}
	if v, ok := filters["entity_type"].(string); ok && v != "" {
		query = query.Where("entity_type = ?", v)
	}
	if v, ok := filters["entity_id"].(string); ok && v != "" {
		query = query.Where("entity_id = ?", v)
	}
	if v, ok := filters["date_from"].(string); ok && v != "" {
		query = query.Where("created_at >= ?", v)
	}
	if v, ok := filters["date_to"].(string); ok && v != "" {
		query = query.Where("created_at <= ?", v)
	}

	// Scope filtering
	if v, ok := filters["scope_company_ids"].([]string); ok && len(v) > 0 {
		ids := make([]any, len(v))
		for i, id := range v {
			ids[i] = id
		}
		query = query.WhereIn("company_id", ids)
	}
	if v, ok := filters["scope_office_ids"].([]string); ok && len(v) > 0 {
		ids := make([]any, len(v))
		for i, id := range v {
			ids[i] = id
		}
		query = query.WhereIn("office_id", ids)
	}

	// Count total
	countQuery := facades.Orm().Query().Model(&models.AuditLog{})

	if v, ok := filters["company_id"].(string); ok && v != "" {
		countQuery = countQuery.Where("company_id = ?", v)
	}
	if v, ok := filters["office_id"].(string); ok && v != "" {
		countQuery = countQuery.Where("office_id = ?", v)
	}
	if v, ok := filters["user_id"].(string); ok && v != "" {
		countQuery = countQuery.Where("user_id = ?", v)
	}
	if v, ok := filters["action"].(string); ok && v != "" {
		countQuery = countQuery.Where("action = ?", v)
	}
	if v, ok := filters["entity_type"].(string); ok && v != "" {
		countQuery = countQuery.Where("entity_type = ?", v)
	}
	if v, ok := filters["entity_id"].(string); ok && v != "" {
		countQuery = countQuery.Where("entity_id = ?", v)
	}
	if v, ok := filters["date_from"].(string); ok && v != "" {
		countQuery = countQuery.Where("created_at >= ?", v)
	}
	if v, ok := filters["date_to"].(string); ok && v != "" {
		countQuery = countQuery.Where("created_at <= ?", v)
	}
	if v, ok := filters["scope_company_ids"].([]string); ok && len(v) > 0 {
		ids := make([]any, len(v))
		for i, id := range v {
			ids[i] = id
		}
		countQuery = countQuery.WhereIn("company_id", ids)
	}
	if v, ok := filters["scope_office_ids"].([]string); ok && len(v) > 0 {
		ids := make([]any, len(v))
		for i, id := range v {
			ids[i] = id
		}
		countQuery = countQuery.WhereIn("office_id", ids)
	}

	total, err := countQuery.Count()
	if err != nil {
		return nil, 0, err
	}

	// Sorting
	sortBy := "created_at"
	if v, ok := filters["sort_by"].(string); ok && v != "" {
		sortBy = v
	}
	sortDir := "desc"
	if v, ok := filters["sort_dir"].(string); ok && v != "" {
		sortDir = v
	}
	query = query.Order(sortBy + " " + sortDir)

	// Pagination
	page := 1
	if v, ok := filters["page"].(int); ok && v > 0 {
		page = v
	}
	perPage := 50
	if v, ok := filters["per_page"].(int); ok && v > 0 {
		perPage = v
	}
	offset := (page - 1) * perPage
	query = query.Offset(offset).Limit(perPage)

	var logs []models.AuditLog
	if err := query.Get(&logs); err != nil {
		return nil, 0, err
	}

	return logs, total, nil
}
