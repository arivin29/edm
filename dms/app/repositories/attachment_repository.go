package repositories

import (
	"time"

	"dms/app/facades"
	"dms/app/models"
)

type AttachmentRepository interface {
	ListByEntity(entityType string, entityID string) ([]models.FileStorage, error)
	FindByID(id string) (*models.FileStorage, error)
	Create(attachment *models.FileStorage) error
	Delete(id string) error
	CountByEntity(entityType string, entityID string) (int64, error)
	UpdateOCRText(id string, ocrText string) error
}

type attachmentRepository struct{}

func NewAttachmentRepository() AttachmentRepository {
	return &attachmentRepository{}
}

func (r *attachmentRepository) ListByEntity(entityType string, entityID string) ([]models.FileStorage, error) {
	var items []models.FileStorage
	if err := facades.Orm().Query().
		Where("entity_type = ? AND entity_id = ? AND deleted_at IS NULL", entityType, entityID).
		With("Uploader").
		Order("created_at desc").
		Get(&items); err != nil {
		return nil, err
	}
	return items, nil
}

func (r *attachmentRepository) FindByID(id string) (*models.FileStorage, error) {
	var item models.FileStorage
	if err := facades.Orm().Query().
		Where("id = ? AND deleted_at IS NULL", id).
		First(&item); err != nil {
		return nil, err
	}
	if item.ID == "" {
		return nil, nil
	}
	return &item, nil
}

func (r *attachmentRepository) Create(attachment *models.FileStorage) error {
	return facades.Orm().Query().Create(attachment)
}

func (r *attachmentRepository) Delete(id string) error {
	now := time.Now()
	_, err := facades.Orm().Query().
		Model(&models.FileStorage{}).
		Where("id = ?", id).
		Update("deleted_at", now)
	return err
}

func (r *attachmentRepository) CountByEntity(entityType string, entityID string) (int64, error) {
	count, err := facades.Orm().Query().
		Model(&models.FileStorage{}).
		Where("entity_type = ? AND entity_id = ? AND deleted_at IS NULL", entityType, entityID).
		Count()
	return count, err
}

func (r *attachmentRepository) UpdateOCRText(id string, ocrText string) error {
	_, err := facades.Orm().Query().
		Model(&models.FileStorage{}).
		Where("id = ?", id).
		Update("ocr_text", ocrText)
	return err
}
