package repositories

import (
	"fmt"

	"dms/app/facades"
	"dms/app/models"
)

type TemplateRepository interface {
	List(filters map[string]any) ([]models.DocumentTemplate, int64, error)
	FindByID(id string) (*models.DocumentTemplate, error)
	FindByIDWithRelations(id string) (*models.DocumentTemplate, error)
	FindByCodeAndCompany(code, companyID string) (*models.DocumentTemplate, error)
	Create(t *models.DocumentTemplate) error
	Update(t *models.DocumentTemplate) error
	Delete(id string) error

	// Tag operations
	ListTags(templateID string) ([]models.TemplateTag, error)
	FindTagByID(id string) (*models.TemplateTag, error)
	CreateTag(tag *models.TemplateTag) error
	UpdateTag(tag *models.TemplateTag) error
	DeleteTag(id string) error
	BulkUpsertTags(templateID string, tags []models.TemplateTag) error
}

type templateRepository struct{}

func NewTemplateRepository() TemplateRepository {
	return &templateRepository{}
}

func (r *templateRepository) List(filters map[string]any) ([]models.DocumentTemplate, int64, error) {
	page, perPage := paginationFromFilters(filters)
	offset := (page - 1) * perPage

	q := facades.Orm().Query()

	if v, ok := filters["company_id"].(string); ok && v != "" {
		q = q.Where("company_id = ?", v)
	}
	if v, ok := filters["document_type_id"].(string); ok && v != "" {
		q = q.Where("document_type_id = ?", v)
	}
	if v, ok := filters["category_id"].(string); ok && v != "" {
		q = q.Where("category_id = ?", v)
	}
	if v, ok := filters["status"].(string); ok && v != "" {
		q = q.Where("status = ?", v)
	}
	if v, ok := filters["is_active"].(string); ok && v != "" {
		q = q.Where("is_active = ?", v == "true" || v == "1")
	}
	if search, ok := filters["search"].(string); ok && search != "" {
		like := "%" + search + "%"
		q = q.Where("name ILIKE ? OR code ILIKE ?", like, like)
	}

	count, err := q.Model(&models.DocumentTemplate{}).Count()
	if err != nil {
		return nil, 0, err
	}

	sortBy := "created_at"
	sortDir := "desc"
	if v, ok := filters["sort_by"].(string); ok && v != "" {
		allowed := map[string]bool{"name": true, "code": true, "status": true, "version": true, "created_at": true, "updated_at": true}
		if allowed[v] {
			sortBy = v
		}
	}
	if v, ok := filters["sort_dir"].(string); ok && v == "asc" {
		sortDir = "asc"
	}

	var items []models.DocumentTemplate
	if err := q.
		With("DocumentType").
		With("Category").
		Order(fmt.Sprintf("%s %s", sortBy, sortDir)).
		Offset(offset).
		Limit(perPage).
		Get(&items); err != nil {
		return nil, 0, err
	}

	return items, count, nil
}

func (r *templateRepository) FindByID(id string) (*models.DocumentTemplate, error) {
	var t models.DocumentTemplate
	if err := facades.Orm().Query().Where("id = ?", id).First(&t); err != nil {
		return nil, err
	}
	if t.ID == "" {
		return nil, nil
	}
	return &t, nil
}

func (r *templateRepository) FindByIDWithRelations(id string) (*models.DocumentTemplate, error) {
	var t models.DocumentTemplate
	if err := facades.Orm().Query().
		With("DocumentType").
		With("Category").
		With("Tags").
		Where("id = ?", id).
		First(&t); err != nil {
		return nil, err
	}
	if t.ID == "" {
		return nil, nil
	}
	return &t, nil
}

func (r *templateRepository) FindByCodeAndCompany(code, companyID string) (*models.DocumentTemplate, error) {
	var t models.DocumentTemplate
	if err := facades.Orm().Query().
		Where("code = ? AND company_id = ?", code, companyID).
		First(&t); err != nil {
		return nil, err
	}
	if t.ID == "" {
		return nil, nil
	}
	return &t, nil
}

func (r *templateRepository) Create(t *models.DocumentTemplate) error {
	return facades.Orm().Query().Create(t)
}

func (r *templateRepository) Update(t *models.DocumentTemplate) error {
	return facades.Orm().Query().Save(t)
}

func (r *templateRepository) Delete(id string) error {
	_, err := facades.Orm().Query().Where("id = ?", id).Delete(&models.DocumentTemplate{})
	return err
}

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------

func (r *templateRepository) ListTags(templateID string) ([]models.TemplateTag, error) {
	var tags []models.TemplateTag
	if err := facades.Orm().Query().
		Where("template_id = ?", templateID).
		Order("group_order asc, field_order asc").
		Get(&tags); err != nil {
		return nil, err
	}
	return tags, nil
}

func (r *templateRepository) FindTagByID(id string) (*models.TemplateTag, error) {
	var tag models.TemplateTag
	if err := facades.Orm().Query().Where("id = ?", id).First(&tag); err != nil {
		return nil, err
	}
	return &tag, nil
}

func (r *templateRepository) CreateTag(tag *models.TemplateTag) error {
	return facades.Orm().Query().Create(tag)
}

func (r *templateRepository) UpdateTag(tag *models.TemplateTag) error {
	return facades.Orm().Query().Save(tag)
}

func (r *templateRepository) DeleteTag(id string) error {
	_, err := facades.Orm().Query().Where("id = ?", id).Delete(&models.TemplateTag{})
	return err
}

func (r *templateRepository) BulkUpsertTags(templateID string, tags []models.TemplateTag) error {
	// Delete existing tags for this template, then recreate
	_, err := facades.Orm().Query().Where("template_id = ?", templateID).Delete(&models.TemplateTag{})
	if err != nil {
		return err
	}

	for i := range tags {
		tags[i].TemplateID = templateID
		tags[i].ID = "" // let DB generate new UUIDs
		if err := facades.Orm().Query().Create(&tags[i]); err != nil {
			return err
		}
	}
	return nil
}
