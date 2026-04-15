package repositories

import (
	"fmt"
	"strings"
	"time"

	"dms/app/facades"
	"dms/app/models"
)

type DistributionRepository interface {
	List(documentID string, filters map[string]any) ([]models.DocumentDistribution, int64, error)
	ListByRecipient(userID string, filters map[string]any) ([]models.DocumentDistribution, int64, error)
	FindByID(id string) (*models.DocumentDistribution, error)
	FindByIDWithRelations(id string) (*models.DocumentDistribution, error)
	Create(dist *models.DocumentDistribution) error
	Update(dist *models.DocumentDistribution) error
	BulkCreate(dists []models.DocumentDistribution) error
	CreateAcknowledgement(ack *models.DistributionAcknowledgement) error
	FindAcknowledgement(distributionID, userID string) (*models.DistributionAcknowledgement, error)
	GetNextCopyNumber(documentID string) (string, error)
	CountByDocument(documentID string) (int64, error)
}

type distributionRepository struct{}

func NewDistributionRepository() DistributionRepository {
	return &distributionRepository{}
}

func (r *distributionRepository) List(documentID string, filters map[string]any) ([]models.DocumentDistribution, int64, error) {
	page, perPage := paginationFromFilters(filters)
	offset := (page - 1) * perPage

	q := facades.Orm().Query().Where("document_id = ?", documentID)

	// Status filter
	if v, ok := filters["status"].(string); ok && v != "" {
		statuses := strings.Split(v, ",")
		for i := range statuses {
			statuses[i] = strings.TrimSpace(statuses[i])
		}
		q = q.WhereIn("status", castToAnySlice(statuses))
	}

	// Distribution type filter
	if v, ok := filters["distribution_type"].(string); ok && v != "" {
		q = q.Where("distribution_type = ?", v)
	}

	// Recipient type filter
	if v, ok := filters["recipient_type"].(string); ok && v != "" {
		q = q.Where("recipient_type = ?", v)
	}

	// Count total
	count, err := q.Model(&models.DocumentDistribution{}).Count()
	if err != nil {
		return nil, 0, err
	}

	// Sorting
	sortBy := "created_at"
	sortDir := "desc"
	if v, ok := filters["sort_by"].(string); ok && v != "" {
		allowed := map[string]bool{
			"created_at":     true,
			"distributed_at": true,
			"status":         true,
			"copy_number":    true,
		}
		if allowed[v] {
			sortBy = v
		}
	}
	if v, ok := filters["sort_dir"].(string); ok && v == "asc" {
		sortDir = "asc"
	}

	var items []models.DocumentDistribution
	if err := q.
		With("Document").
		With("Distributor").
		With("Recipient").
		With("Receiver").
		Order(fmt.Sprintf("%s %s", sortBy, sortDir)).
		Offset(offset).
		Limit(perPage).
		Get(&items); err != nil {
		return nil, 0, err
	}

	return items, count, nil
}

func (r *distributionRepository) ListByRecipient(userID string, filters map[string]any) ([]models.DocumentDistribution, int64, error) {
	page, perPage := paginationFromFilters(filters)
	offset := (page - 1) * perPage

	q := facades.Orm().Query().Where("recipient_id = ?", userID)

	// Status filter
	if v, ok := filters["status"].(string); ok && v != "" {
		statuses := strings.Split(v, ",")
		for i := range statuses {
			statuses[i] = strings.TrimSpace(statuses[i])
		}
		q = q.WhereIn("status", castToAnySlice(statuses))
	}

	// Distribution type filter
	if v, ok := filters["distribution_type"].(string); ok && v != "" {
		q = q.Where("distribution_type = ?", v)
	}

	// Count total
	count, err := q.Model(&models.DocumentDistribution{}).Count()
	if err != nil {
		return nil, 0, err
	}

	// Sorting
	sortBy := "created_at"
	sortDir := "desc"
	if v, ok := filters["sort_by"].(string); ok && v != "" {
		allowed := map[string]bool{
			"created_at":     true,
			"distributed_at": true,
			"status":         true,
		}
		if allowed[v] {
			sortBy = v
		}
	}
	if v, ok := filters["sort_dir"].(string); ok && v == "asc" {
		sortDir = "asc"
	}

	var items []models.DocumentDistribution
	if err := q.
		With("Document").
		With("Distributor").
		With("Recipient").
		Order(fmt.Sprintf("%s %s", sortBy, sortDir)).
		Offset(offset).
		Limit(perPage).
		Get(&items); err != nil {
		return nil, 0, err
	}

	return items, count, nil
}

func (r *distributionRepository) FindByID(id string) (*models.DocumentDistribution, error) {
	var dist models.DocumentDistribution
	if err := facades.Orm().Query().
		Where("id = ?", id).
		First(&dist); err != nil {
		return nil, err
	}
	if dist.ID == "" {
		return nil, nil
	}
	return &dist, nil
}

func (r *distributionRepository) FindByIDWithRelations(id string) (*models.DocumentDistribution, error) {
	var dist models.DocumentDistribution
	if err := facades.Orm().Query().
		With("Document").
		With("Distributor").
		With("Recipient").
		With("Receiver").
		With("Acknowledgements", func(q any) {
			if query, ok := q.(interface{ With(string, ...func(any)) any }); ok {
				query.With("User")
			}
		}).
		Where("id = ?", id).
		First(&dist); err != nil {
		return nil, err
	}
	if dist.ID == "" {
		return nil, nil
	}
	return &dist, nil
}

func (r *distributionRepository) Create(dist *models.DocumentDistribution) error {
	dist.CreatedAt = time.Now()
	dist.UpdatedAt = time.Now()
	return facades.Orm().Query().Create(dist)
}

func (r *distributionRepository) Update(dist *models.DocumentDistribution) error {
	dist.UpdatedAt = time.Now()
	return facades.Orm().Query().Save(dist)
}

func (r *distributionRepository) BulkCreate(dists []models.DocumentDistribution) error {
	now := time.Now()
	for i := range dists {
		dists[i].CreatedAt = now
		dists[i].UpdatedAt = now
	}
	return facades.Orm().Query().Create(&dists)
}

func (r *distributionRepository) CreateAcknowledgement(ack *models.DistributionAcknowledgement) error {
	ack.AcknowledgedAt = time.Now()
	return facades.Orm().Query().Create(ack)
}

func (r *distributionRepository) FindAcknowledgement(distributionID, userID string) (*models.DistributionAcknowledgement, error) {
	var ack models.DistributionAcknowledgement
	if err := facades.Orm().Query().
		Where("distribution_id = ? AND user_id = ?", distributionID, userID).
		First(&ack); err != nil {
		return nil, err
	}
	if ack.ID == "" {
		return nil, nil
	}
	return &ack, nil
}

func (r *distributionRepository) GetNextCopyNumber(documentID string) (string, error) {
	count, err := r.CountByDocument(documentID)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("COPY-%03d", count+1), nil
}

func (r *distributionRepository) CountByDocument(documentID string) (int64, error) {
	return facades.Orm().Query().
		Model(&models.DocumentDistribution{}).
		Where("document_id = ?", documentID).
		Count()
}
