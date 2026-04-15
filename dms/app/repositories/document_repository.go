package repositories

import (
	"fmt"
	"strings"
	"time"

	"dms/app/facades"
	"dms/app/models"
)

type DocumentRepository interface {
	List(filters map[string]any) ([]models.Document, int64, error)
	FindByID(id string) (*models.Document, error)
	FindByIDWithRelations(id string) (*models.Document, error)
	FindByNumber(companyID, documentNumber string) (*models.Document, error)
	FindByOnlyOfficeKey(key string) (*models.Document, error)
	Create(doc *models.Document) error
	Update(doc *models.Document) error
	Delete(id string) error

	// Version operations
	ListVersions(documentID string) ([]models.DocumentVersion, error)
	CreateVersion(version *models.DocumentVersion) error
	FindVersionByNumber(documentID string, versionNumber int) (*models.DocumentVersion, error)
	FindVersionByID(versionID string) (*models.DocumentVersion, error)
	GetLatestVersionNumber(documentID string) (int, error)
}

type documentRepository struct{}

func NewDocumentRepository() DocumentRepository {
	return &documentRepository{}
}

func (r *documentRepository) List(filters map[string]any) ([]models.Document, int64, error) {
	page, perPage := paginationFromFilters(filters)
	offset := (page - 1) * perPage

	q := facades.Orm().Query().Where("deleted_at IS NULL")

	// Company scope
	if v, ok := filters["company_id"].(string); ok && v != "" {
		q = q.Where("company_id = ?", v)
	}

	// Office scope
	if v, ok := filters["office_id"].(string); ok && v != "" {
		q = q.Where("office_id = ?", v)
	}

	// Department scope
	if v, ok := filters["department_id"].(string); ok && v != "" {
		q = q.Where("department_id = ?", v)
	}

	// Section filter
	if v, ok := filters["section_id"].(string); ok && v != "" {
		q = q.Where("section_id = ?", v)
	}

	// Document type filter
	if v, ok := filters["document_type_id"].(string); ok && v != "" {
		q = q.Where("document_type_id = ?", v)
	}

	// Category filter
	if v, ok := filters["category_id"].(string); ok && v != "" {
		q = q.Where("category_id = ?", v)
	}

	// Status filter (comma-separated)
	if v, ok := filters["status"].(string); ok && v != "" {
		statuses := strings.Split(v, ",")
		for i := range statuses {
			statuses[i] = strings.TrimSpace(statuses[i])
		}
		q = q.WhereIn("status", castToAnySlice(statuses))
	}

	// Priority filter
	if v, ok := filters["priority"].(string); ok && v != "" {
		q = q.Where("priority = ?", v)
	}

	// Confidentiality filter
	if v, ok := filters["confidentiality"].(string); ok && v != "" {
		q = q.Where("confidentiality = ?", v)
	}

	// Created by filter
	if v, ok := filters["created_by"].(string); ok && v != "" {
		q = q.Where("created_by = ?", v)
	}

	// From module filter
	if v, ok := filters["from_module"].(string); ok && v != "" {
		q = q.Where("from_module = ?", v)
	}

	// Date range filters
	if v, ok := filters["date_from"].(string); ok && v != "" {
		q = q.Where("created_at >= ?", v)
	}
	if v, ok := filters["date_to"].(string); ok && v != "" {
		q = q.Where("created_at <= ?", v)
	}

	// Search filter (title, document_number, description)
	if search, ok := filters["search"].(string); ok && search != "" {
		like := "%" + search + "%"
		q = q.Where("title ILIKE ? OR document_number ILIKE ? OR description ILIKE ?", like, like, like)
	}

	// Data scope filters
	if ids, ok := filters["scope_company_ids"].([]string); ok && len(ids) > 0 {
		q = q.WhereIn("company_id", castToAnySlice(ids))
	}
	if ids, ok := filters["scope_office_ids"].([]string); ok && len(ids) > 0 {
		q = q.WhereIn("office_id", castToAnySlice(ids))
	}

	// Count total
	count, err := q.Model(&models.Document{}).Count()
	if err != nil {
		return nil, 0, err
	}

	// Sorting
	sortBy := "created_at"
	sortDir := "desc"
	if v, ok := filters["sort_by"].(string); ok && v != "" {
		allowed := map[string]bool{
			"created_at":      true,
			"updated_at":      true,
			"document_number": true,
			"title":           true,
			"status":          true,
		}
		if allowed[v] {
			sortBy = v
		}
	}
	if v, ok := filters["sort_dir"].(string); ok && v == "asc" {
		sortDir = "asc"
	}

	var items []models.Document
	if err := q.
		With("DocumentType").
		With("Category").
		With("Creator").
		Order(fmt.Sprintf("%s %s", sortBy, sortDir)).
		Offset(offset).
		Limit(perPage).
		Get(&items); err != nil {
		return nil, 0, err
	}

	return items, count, nil
}

func (r *documentRepository) FindByID(id string) (*models.Document, error) {
	var doc models.Document
	if err := facades.Orm().Query().
		Where("id = ? AND deleted_at IS NULL", id).
		First(&doc); err != nil {
		return nil, err
	}
	if doc.ID == "" {
		return nil, nil
	}
	return &doc, nil
}

func (r *documentRepository) FindByIDWithRelations(id string) (*models.Document, error) {
	var doc models.Document
	if err := facades.Orm().Query().
		With("Company").
		With("Office").
		With("Department").
		With("Section").
		With("DocumentType").
		With("Category").
		With("Template").
		With("Creator").
		Where("id = ? AND deleted_at IS NULL", id).
		First(&doc); err != nil {
		return nil, err
	}
	if doc.ID == "" {
		return nil, nil
	}
	return &doc, nil
}

func (r *documentRepository) FindByNumber(companyID, documentNumber string) (*models.Document, error) {
	var doc models.Document
	if err := facades.Orm().Query().
		Where("company_id = ? AND document_number = ? AND deleted_at IS NULL", companyID, documentNumber).
		First(&doc); err != nil {
		return nil, err
	}
	if doc.ID == "" {
		return nil, nil
	}
	return &doc, nil
}

func (r *documentRepository) FindByOnlyOfficeKey(key string) (*models.Document, error) {
	var doc models.Document
	if err := facades.Orm().Query().
		Where("onlyoffice_key = ?", key).
		WhereNull("deleted_at").
		First(&doc); err != nil {
		return nil, err
	}
	if doc.ID == "" {
		return nil, nil
	}
	return &doc, nil
}

func (r *documentRepository) Create(doc *models.Document) error {
	return facades.Orm().Query().Create(doc)
}

func (r *documentRepository) Update(doc *models.Document) error {
	return facades.Orm().Query().Save(doc)
}

func (r *documentRepository) Delete(id string) error {
	now := time.Now()
	_, err := facades.Orm().Query().
		Model(&models.Document{}).
		Where("id = ?", id).
		Update("deleted_at", now)
	return err
}

// ---------------------------------------------------------------------------
// Versions
// ---------------------------------------------------------------------------

func (r *documentRepository) ListVersions(documentID string) ([]models.DocumentVersion, error) {
	var versions []models.DocumentVersion
	if err := facades.Orm().Query().
		With("Creator").
		Where("document_id = ?", documentID).
		Order("version_number desc").
		Get(&versions); err != nil {
		return nil, err
	}
	return versions, nil
}

func (r *documentRepository) CreateVersion(version *models.DocumentVersion) error {
	return facades.Orm().Query().Create(version)
}

func (r *documentRepository) FindVersionByNumber(documentID string, versionNumber int) (*models.DocumentVersion, error) {
	var version models.DocumentVersion
	if err := facades.Orm().Query().
		With("Creator").
		Where("document_id = ? AND version_number = ?", documentID, versionNumber).
		First(&version); err != nil {
		return nil, err
	}
	if version.ID == "" {
		return nil, nil
	}
	return &version, nil
}

func (r *documentRepository) FindVersionByID(versionID string) (*models.DocumentVersion, error) {
	var version models.DocumentVersion
	if err := facades.Orm().Query().
		With("Creator").
		Where("id = ?", versionID).
		First(&version); err != nil {
		return nil, err
	}
	if version.ID == "" {
		return nil, nil
	}
	return &version, nil
}

func (r *documentRepository) GetLatestVersionNumber(documentID string) (int, error) {
	var version models.DocumentVersion
	if err := facades.Orm().Query().
		Where("document_id = ?", documentID).
		Order("version_number desc").
		First(&version); err != nil {
		return 0, err
	}
	if version.ID == "" {
		return 0, nil
	}
	return version.VersionNumber, nil
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

func castToAnySlice(strs []string) []any {
	result := make([]any, len(strs))
	for i, s := range strs {
		result[i] = s
	}
	return result
}
