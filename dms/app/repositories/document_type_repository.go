package repositories

import (
	"dms/app/facades"
	"dms/app/models"
)

type DocumentTypeRepository interface {
	List(filters map[string]any) ([]models.DocumentType, int64, error)
	FindByID(id string) (*models.DocumentType, error)
	FindByCode(code string) (*models.DocumentType, error)
	Create(dt *models.DocumentType) error
	Update(dt *models.DocumentType) error
	Delete(id string) error
}

type documentTypeRepository struct{}

func NewDocumentTypeRepository() DocumentTypeRepository {
	return &documentTypeRepository{}
}

func (r *documentTypeRepository) FindByID(id string) (*models.DocumentType, error) {
	var dt models.DocumentType
	if err := facades.Orm().Query().Where("id = ?", id).First(&dt); err != nil {
		return nil, err
	}
	return &dt, nil
}

func (r *documentTypeRepository) FindByCode(code string) (*models.DocumentType, error) {
	var dt models.DocumentType
	if err := facades.Orm().Query().Where("code = ?", code).First(&dt); err != nil {
		return nil, err
	}
	return &dt, nil
}

func (r *documentTypeRepository) List(filters map[string]any) ([]models.DocumentType, int64, error) {
	page, perPage := paginationFromFilters(filters)
	offset := (page - 1) * perPage

	q := facades.Orm().Query()

	if search, ok := filters["search"].(string); ok && search != "" {
		q = q.Where("name ILIKE ? OR code ILIKE ?", "%"+search+"%", "%"+search+"%")
	}
	if isActive, ok := filters["is_active"].(string); ok && isActive != "" {
		q = q.Where("is_active = ?", isActive == "true" || isActive == "1")
	}

	count, err := q.Model(&models.DocumentType{}).Count()
	if err != nil {
		return nil, 0, err
	}

	var items []models.DocumentType
	if err := q.Order("sort_order asc, created_at desc").Offset(offset).Limit(perPage).Get(&items); err != nil {
		return nil, 0, err
	}

	return items, count, nil
}

func (r *documentTypeRepository) Create(dt *models.DocumentType) error {
	return facades.Orm().Query().Create(dt)
}

func (r *documentTypeRepository) Update(dt *models.DocumentType) error {
	return facades.Orm().Query().Save(dt)
}

func (r *documentTypeRepository) Delete(id string) error {
	_, err := facades.Orm().Query().Where("id = ?", id).Delete(&models.DocumentType{})
	return err
}
