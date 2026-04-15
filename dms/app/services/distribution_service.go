package services

import (
	"errors"
	"time"

	"github.com/goravel/framework/contracts/http"

	"dms/app/models"
	"dms/app/repositories"
	"dms/app/types"
)

type DistributionService struct {
	repo         repositories.DistributionRepository
	documentRepo repositories.DocumentRepository
	auditService AuditService
}

func NewDistributionService() *DistributionService {
	return &DistributionService{
		repo:         repositories.NewDistributionRepository(),
		documentRepo: repositories.NewDocumentRepository(),
		auditService: NewAuditService(),
	}
}

// List returns distributions for a document with pagination
func (s *DistributionService) List(documentID string, ctx http.Context) ([]models.DocumentDistribution, map[string]any, error) {
	// Verify document exists
	doc, err := s.documentRepo.FindByID(documentID)
	if err != nil {
		return nil, nil, err
	}
	if doc == nil {
		return nil, nil, errors.New("document not found")
	}

	filters := buildFilters(ctx, []string{
		"status", "distribution_type", "recipient_type",
		"sort_by", "sort_dir",
	})

	items, total, err := s.repo.List(documentID, filters)
	if err != nil {
		return nil, nil, err
	}

	return items, paginationMeta(filters, total), nil
}

// Create creates a single distribution
func (s *DistributionService) Create(documentID string, ctx http.Context) (*models.DocumentDistribution, error) {
	user := types.GetCurrentUser(ctx)
	if user == nil {
		return nil, errors.New("unauthorized")
	}

	// Verify document exists and is distributable
	doc, err := s.documentRepo.FindByID(documentID)
	if err != nil {
		return nil, err
	}
	if doc == nil {
		return nil, errors.New("document not found")
	}

	// Only allow distribution of approved/final documents
	if doc.Status != "approved" && doc.Status != "final" {
		return nil, errors.New("document must be approved or final to distribute")
	}

	data := ctx.Request().All()

	distributionType, ok := data["distribution_type"].(string)
	if !ok || distributionType == "" {
		return nil, errors.New("distribution_type is required")
	}

	recipientType, ok := data["recipient_type"].(string)
	if !ok || recipientType == "" {
		return nil, errors.New("recipient_type is required")
	}

	// Get next copy number for controlled distribution
	var copyNumber *string
	if distributionType == "controlled" {
		cn, err := s.repo.GetNextCopyNumber(documentID)
		if err != nil {
			return nil, errors.New("failed to generate copy number")
		}
		copyNumber = &cn
	}

	dist := models.DocumentDistribution{
		DocumentID:       documentID,
		VersionNumber:    doc.CurrentVersion,
		CopyNumber:       copyNumber,
		DistributionType: distributionType,
		RecipientType:    recipientType,
		Status:           "pending",
		DistributedBy:    user.ID,
	}

	// Set recipient based on type
	if recipientType == "user" || recipientType == "department" {
		if recipientID, ok := data["recipient_id"].(string); ok && recipientID != "" {
			dist.RecipientID = &recipientID
		} else {
			return nil, errors.New("recipient_id is required for user/department recipients")
		}
	} else if recipientType == "external" {
		if recipientName, ok := data["recipient_name"].(string); ok && recipientName != "" {
			dist.RecipientName = &recipientName
		} else {
			return nil, errors.New("recipient_name is required for external recipients")
		}
		if recipientEmail, ok := data["recipient_email"].(string); ok && recipientEmail != "" {
			dist.RecipientEmail = &recipientEmail
		}
	}

	// Optional notes
	if notes, ok := data["notes"].(string); ok && notes != "" {
		dist.Notes = &notes
	}

	if err := s.repo.Create(&dist); err != nil {
		return nil, err
	}

	// Log audit
	s.auditService.Log(ctx, AuditLogOptions{
		Action:      "create",
		EntityType:  "distribution",
		EntityID:    dist.ID,
		Description: "Created document distribution",
		NewValues:   dist,
	})

	return s.repo.FindByIDWithRelations(dist.ID)
}

// BulkDistribute distributes a document to multiple recipients
func (s *DistributionService) BulkDistribute(documentID string, ctx http.Context) ([]models.DocumentDistribution, error) {
	user := types.GetCurrentUser(ctx)
	if user == nil {
		return nil, errors.New("unauthorized")
	}

	// Verify document exists and is distributable
	doc, err := s.documentRepo.FindByID(documentID)
	if err != nil {
		return nil, err
	}
	if doc == nil {
		return nil, errors.New("document not found")
	}

	if doc.Status != "approved" && doc.Status != "final" {
		return nil, errors.New("document must be approved or final to distribute")
	}

	data := ctx.Request().All()

	distributionType, ok := data["distribution_type"].(string)
	if !ok || distributionType == "" {
		return nil, errors.New("distribution_type is required")
	}

	recipientType, ok := data["recipient_type"].(string)
	if !ok || recipientType == "" {
		return nil, errors.New("recipient_type is required")
	}

	// Get recipient IDs
	var recipientIDs []string
	if rawIDs, ok := data["recipient_ids"].([]any); ok {
		for _, id := range rawIDs {
			if strID, ok := id.(string); ok && strID != "" {
				recipientIDs = append(recipientIDs, strID)
			}
		}
	}

	if len(recipientIDs) == 0 {
		return nil, errors.New("recipient_ids is required and must not be empty")
	}

	// Get starting copy number
	existingCount, err := s.repo.CountByDocument(documentID)
	if err != nil {
		return nil, errors.New("failed to get existing distribution count")
	}

	var notes *string
	if n, ok := data["notes"].(string); ok && n != "" {
		notes = &n
	}

	// Create distributions for each recipient
	var dists []models.DocumentDistribution
	for i, recipientID := range recipientIDs {
		var copyNumber *string
		if distributionType == "controlled" {
			cn := generateCopyNumber(int(existingCount) + i + 1)
			copyNumber = &cn
		}

		dist := models.DocumentDistribution{
			DocumentID:       documentID,
			VersionNumber:    doc.CurrentVersion,
			CopyNumber:       copyNumber,
			DistributionType: distributionType,
			RecipientType:    recipientType,
			RecipientID:      &recipientID,
			Status:           "pending",
			DistributedBy:    user.ID,
			Notes:            notes,
		}
		dists = append(dists, dist)
	}

	if err := s.repo.BulkCreate(dists); err != nil {
		return nil, err
	}

	// Log audit
	s.auditService.Log(ctx, AuditLogOptions{
		Action:      "bulk_distribute",
		EntityType:  "distribution",
		EntityID:    documentID,
		Description: "Bulk distributed document to multiple recipients",
		NewValues: map[string]any{
			"count":         len(recipientIDs),
			"recipient_ids": recipientIDs,
		},
	})

	// Fetch created distributions with relations
	filters := map[string]any{"page": 1, "per_page": len(recipientIDs)}
	items, _, err := s.repo.List(documentID, filters)
	if err != nil {
		return dists, nil
	}

	return items, nil
}

// MarkDistributed marks a distribution as distributed
func (s *DistributionService) MarkDistributed(id string, ctx http.Context) (*models.DocumentDistribution, error) {
	user := types.GetCurrentUser(ctx)
	if user == nil {
		return nil, errors.New("unauthorized")
	}

	dist, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if dist == nil {
		return nil, errors.New("distribution not found")
	}

	if dist.Status != "pending" {
		return nil, errors.New("distribution is not in pending status")
	}

	now := time.Now()
	dist.Status = "distributed"
	dist.DistributedAt = &now

	if err := s.repo.Update(dist); err != nil {
		return nil, err
	}

	// Log audit
	s.auditService.Log(ctx, AuditLogOptions{
		Action:      "distribute",
		EntityType:  "distribution",
		EntityID:    dist.ID,
		Description: "Marked distribution as distributed",
	})

	return s.repo.FindByIDWithRelations(dist.ID)
}

// Acknowledge records an acknowledgement for a distribution
func (s *DistributionService) Acknowledge(id string, ctx http.Context) (*models.DistributionAcknowledgement, error) {
	user := types.GetCurrentUser(ctx)
	if user == nil {
		return nil, errors.New("unauthorized")
	}

	dist, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if dist == nil {
		return nil, errors.New("distribution not found")
	}

	// Verify user is the recipient
	if dist.RecipientID == nil || *dist.RecipientID != user.ID {
		return nil, errors.New("you are not the recipient of this distribution")
	}

	// Check if already acknowledged
	existingAck, err := s.repo.FindAcknowledgement(id, user.ID)
	if err != nil {
		return nil, err
	}
	if existingAck != nil {
		return nil, errors.New("you have already acknowledged this distribution")
	}

	// Get IP and User-Agent
	ip := ctx.Request().Ip()
	userAgent := ctx.Request().Header("User-Agent")

	var notes *string
	if n := ctx.Request().Input("notes"); n != "" {
		notes = &n
	}

	ack := models.DistributionAcknowledgement{
		DistributionID: id,
		UserID:         user.ID,
		IPAddress:      &ip,
		UserAgent:      &userAgent,
		Notes:          notes,
	}

	if err := s.repo.CreateAcknowledgement(&ack); err != nil {
		return nil, err
	}

	// Update distribution status to received
	now := time.Now()
	dist.Status = "received"
	dist.ReceivedAt = &now
	dist.ReceivedBy = &user.ID

	if err := s.repo.Update(dist); err != nil {
		return nil, err
	}

	// Log audit
	s.auditService.Log(ctx, AuditLogOptions{
		Action:      "acknowledge",
		EntityType:  "distribution",
		EntityID:    dist.ID,
		Description: "Acknowledged document distribution",
	})

	return &ack, nil
}

// Cancel cancels a pending distribution
func (s *DistributionService) Cancel(id string, ctx http.Context) error {
	user := types.GetCurrentUser(ctx)
	if user == nil {
		return errors.New("unauthorized")
	}

	dist, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}
	if dist == nil {
		return errors.New("distribution not found")
	}

	if dist.Status != "pending" {
		return errors.New("only pending distributions can be cancelled")
	}

	dist.Status = "cancelled"

	if err := s.repo.Update(dist); err != nil {
		return err
	}

	// Log audit
	s.auditService.Log(ctx, AuditLogOptions{
		Action:      "cancel",
		EntityType:  "distribution",
		EntityID:    dist.ID,
		Description: "Cancelled document distribution",
	})

	return nil
}

// GetMyDistributions returns distributions for the current user (inbox)
func (s *DistributionService) GetMyDistributions(ctx http.Context) ([]models.DocumentDistribution, map[string]any, error) {
	user := types.GetCurrentUser(ctx)
	if user == nil {
		return nil, nil, errors.New("unauthorized")
	}

	filters := buildFilters(ctx, []string{
		"status", "distribution_type",
		"sort_by", "sort_dir",
	})

	items, total, err := s.repo.ListByRecipient(user.ID, filters)
	if err != nil {
		return nil, nil, err
	}

	return items, paginationMeta(filters, total), nil
}

// GetByID returns a single distribution by ID
func (s *DistributionService) GetByID(id string) (*models.DocumentDistribution, error) {
	dist, err := s.repo.FindByIDWithRelations(id)
	if err != nil {
		return nil, err
	}
	if dist == nil {
		return nil, errors.New("distribution not found")
	}
	return dist, nil
}

// Helper function to generate copy number
func generateCopyNumber(n int) string {
	return "COPY-" + padLeft(n, 3)
}

func padLeft(n int, width int) string {
	s := ""
	for i := 0; i < width; i++ {
		s += "0"
	}
	str := s + itoa(n)
	return str[len(str)-width:]
}

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	var result string
	for n > 0 {
		result = string(rune('0'+n%10)) + result
		n /= 10
	}
	return result
}
