package services

import (
	"errors"

	"github.com/goravel/framework/contracts/http"

	"dms/app/models"
	"dms/app/repositories"
)

type DocumentTypeService struct {
	typeRepo repositories.DocumentTypeRepository
	catRepo  repositories.DocumentCategoryRepository
}

func NewDocumentTypeService() *DocumentTypeService {
	return &DocumentTypeService{
		typeRepo: repositories.NewDocumentTypeRepository(),
		catRepo:  repositories.NewDocumentCategoryRepository(),
	}
}

// ---------------------------------------------------------------------------
// Document Types
// ---------------------------------------------------------------------------

func (s *DocumentTypeService) ListTypes(ctx http.Context) ([]models.DocumentType, map[string]any, error) {
	filters := buildFilters(ctx, []string{"search", "is_active"})
	items, total, err := s.typeRepo.List(filters)
	if err != nil {
		return nil, nil, err
	}
	return items, paginationMeta(filters, total), nil
}

func (s *DocumentTypeService) GetType(id string) (*models.DocumentType, error) {
	return s.typeRepo.FindByID(id)
}

func (s *DocumentTypeService) CreateType(dt *models.DocumentType) error {
	existing, _ := s.typeRepo.FindByCode(dt.Code)
	if existing != nil {
		return errors.New("document type code already exists")
	}
	return s.typeRepo.Create(dt)
}

func (s *DocumentTypeService) UpdateType(id string, data map[string]any) (*models.DocumentType, error) {
	dt, err := s.typeRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("document type not found")
	}

	if code, ok := data["code"].(string); ok && code != dt.Code {
		existing, _ := s.typeRepo.FindByCode(code)
		if existing != nil {
			return nil, errors.New("document type code already exists")
		}
		dt.Code = code
	}
	if v, ok := data["name"].(string); ok {
		dt.Name = v
	}
	if v, ok := data["description"].(string); ok {
		dt.Description = &v
	}
	if v, ok := data["icon"].(string); ok {
		dt.Icon = &v
	}
	if v, ok := data["sort_order"].(float64); ok {
		dt.SortOrder = int(v)
	}
	if v, ok := data["is_active"].(bool); ok {
		dt.IsActive = v
	}

	if err := s.typeRepo.Update(dt); err != nil {
		return nil, err
	}
	return dt, nil
}

// ---------------------------------------------------------------------------
// Document Categories
// ---------------------------------------------------------------------------

func (s *DocumentTypeService) ListCategories(ctx http.Context) ([]models.DocumentCategory, map[string]any, error) {
	filters := buildFilters(ctx, []string{"company_id", "parent_id", "is_active", "search"})
	items, total, err := s.catRepo.List(filters)
	if err != nil {
		return nil, nil, err
	}
	return items, paginationMeta(filters, total), nil
}

func (s *DocumentTypeService) GetCategory(id string) (*models.DocumentCategory, error) {
	return s.catRepo.FindByID(id)
}

func (s *DocumentTypeService) CreateCategory(cat *models.DocumentCategory) error {
	existing, _ := s.catRepo.FindByCompanyAndCode(cat.CompanyID, cat.Code)
	if existing != nil {
		return errors.New("category code already exists for this company")
	}
	if cat.ParentID != nil && *cat.ParentID != "" {
		if _, err := s.catRepo.FindByID(*cat.ParentID); err != nil {
			return errors.New("parent category not found")
		}
	}
	return s.catRepo.Create(cat)
}

func (s *DocumentTypeService) UpdateCategory(id string, data map[string]any) (*models.DocumentCategory, error) {
	cat, err := s.catRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("category not found")
	}

	if code, ok := data["code"].(string); ok && code != cat.Code {
		companyID := cat.CompanyID
		if v, ok := data["company_id"].(string); ok {
			companyID = v
		}
		existing, _ := s.catRepo.FindByCompanyAndCode(companyID, code)
		if existing != nil {
			return nil, errors.New("category code already exists for this company")
		}
		cat.Code = code
	}
	if v, ok := data["company_id"].(string); ok {
		cat.CompanyID = v
	}
	if v, ok := data["name"].(string); ok {
		cat.Name = v
	}
	if v, ok := data["description"].(string); ok {
		cat.Description = &v
	}
	if v, ok := data["color"].(string); ok {
		cat.Color = &v
	}
	if v, ok := data["icon"].(string); ok {
		cat.Icon = &v
	}
	if v, ok := data["parent_id"].(string); ok {
		if v != "" {
			if _, err := s.catRepo.FindByID(v); err != nil {
				return nil, errors.New("parent category not found")
			}
		}
		cat.ParentID = &v
	}
	if v, ok := data["sort_order"].(float64); ok {
		cat.SortOrder = int(v)
	}
	if v, ok := data["is_active"].(bool); ok {
		cat.IsActive = v
	}

	if err := s.catRepo.Update(cat); err != nil {
		return nil, err
	}
	return cat, nil
}

func (s *DocumentTypeService) DeleteCategory(id string) error {
	if _, err := s.catRepo.FindByID(id); err != nil {
		return errors.New("category not found")
	}
	return s.catRepo.Delete(id)
}
