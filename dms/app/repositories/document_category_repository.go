package repositories

import (
	"dms/app/facades"
	"dms/app/models"
)

type DocumentCategoryRepository interface {
	List(filters map[string]any) ([]models.DocumentCategory, int64, error)
	FindByID(id string) (*models.DocumentCategory, error)
	FindByCompanyAndCode(companyID, code string) (*models.DocumentCategory, error)
	Create(cat *models.DocumentCategory) error
	Update(cat *models.DocumentCategory) error
	Delete(id string) error
}

type documentCategoryRepository struct{}

func NewDocumentCategoryRepository() DocumentCategoryRepository {
	return &documentCategoryRepository{}
}

func (r *documentCategoryRepository) FindByID(id string) (*models.DocumentCategory, error) {
	var cat models.DocumentCategory
	if err := facades.Orm().Query().Where("id = ? AND deleted_at IS NULL", id).First(&cat); err != nil {
		return nil, err
	}
	return &cat, nil
}

func (r *documentCategoryRepository) FindByCompanyAndCode(companyID, code string) (*models.DocumentCategory, error) {
	var cat models.DocumentCategory
	if err := facades.Orm().Query().Where("company_id = ? AND code = ? AND deleted_at IS NULL", companyID, code).First(&cat); err != nil {
		return nil, err
	}
	if cat.ID == "" {
		return nil, nil
	}
	return &cat, nil
}

func (r *documentCategoryRepository) List(filters map[string]any) ([]models.DocumentCategory, int64, error) {
	page, perPage := paginationFromFilters(filters)
	offset := (page - 1) * perPage

	q := facades.Orm().Query().Where("deleted_at IS NULL")

	if companyID, ok := filters["company_id"].(string); ok && companyID != "" {
		q = q.Where("company_id = ?", companyID)
	}
	if parentID, ok := filters["parent_id"].(string); ok && parentID != "" {
		q = q.Where("parent_id = ?", parentID)
	}
	if isActive, ok := filters["is_active"].(string); ok && isActive != "" {
		q = q.Where("is_active = ?", isActive == "true" || isActive == "1")
	}
	if search, ok := filters["search"].(string); ok && search != "" {
		q = q.Where("name ILIKE ? OR code ILIKE ?", "%"+search+"%", "%"+search+"%")
	}
	if companyIDs, ok := filters["scope_company_ids"].([]string); ok && len(companyIDs) > 0 {
		q = q.Where("company_id IN ?", companyIDs)
	}

	count, err := q.Model(&models.DocumentCategory{}).Count()
	if err != nil {
		return nil, 0, err
	}

	var items []models.DocumentCategory
	if err := q.Order("sort_order asc, created_at desc").Offset(offset).Limit(perPage).Get(&items); err != nil {
		return nil, 0, err
	}

	return items, count, nil
}

func (r *documentCategoryRepository) Create(cat *models.DocumentCategory) error {
	return facades.Orm().Query().Create(cat)
}

func (r *documentCategoryRepository) Update(cat *models.DocumentCategory) error {
	return facades.Orm().Query().Save(cat)
}

func (r *documentCategoryRepository) Delete(id string) error {
	// Soft delete: set deleted_at
	_, err := facades.Orm().Query().Model(&models.DocumentCategory{}).Where("id = ?", id).Update("deleted_at", "NOW()")
	return err
}
