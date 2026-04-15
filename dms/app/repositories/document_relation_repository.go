package repositories

import (
	"dms/app/facades"
	"dms/app/models"
)

type DocumentRelationRepository interface {
	ListByDocumentID(documentID string) ([]models.DocumentRelation, error)
	ListInbound(documentID string) ([]models.DocumentRelation, error)
	Create(relation *models.DocumentRelation) error
	FindByID(id string) (*models.DocumentRelation, error)
	Delete(id string) error
}

type documentRelationRepository struct{}

func NewDocumentRelationRepository() DocumentRelationRepository {
	return &documentRelationRepository{}
}

// ListByDocumentID returns outbound relations (this doc → others)
func (r *documentRelationRepository) ListByDocumentID(documentID string) ([]models.DocumentRelation, error) {
	var items []models.DocumentRelation
	if err := facades.Orm().Query().
		With("RelatedDocument").
		With("Creator").
		Where("document_id", documentID).
		Order("created_at desc").
		Get(&items); err != nil {
		return nil, err
	}
	return items, nil
}

// ListInbound returns inbound relations (others → this doc)
func (r *documentRelationRepository) ListInbound(documentID string) ([]models.DocumentRelation, error) {
	var items []models.DocumentRelation
	if err := facades.Orm().Query().
		With("Document").
		With("Creator").
		Where("related_document_id", documentID).
		Order("created_at desc").
		Get(&items); err != nil {
		return nil, err
	}
	return items, nil
}

func (r *documentRelationRepository) Create(relation *models.DocumentRelation) error {
	return facades.Orm().Query().Create(relation)
}

func (r *documentRelationRepository) FindByID(id string) (*models.DocumentRelation, error) {
	var rel models.DocumentRelation
	if err := facades.Orm().Query().Where("id", id).First(&rel); err != nil {
		return nil, err
	}
	return &rel, nil
}

func (r *documentRelationRepository) Delete(id string) error {
	_, err := facades.Orm().Query().Where("id", id).Delete(&models.DocumentRelation{})
	return err
}
