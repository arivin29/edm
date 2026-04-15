package services

import (
	"errors"
	"math"
	"strconv"

	"github.com/goravel/framework/contracts/http"

	"dms/app/models"
	"dms/app/repositories"
)

type OrganizationService struct {
	orgRepo repositories.OrganizationRepository
}

func NewOrganizationService() *OrganizationService {
	return &OrganizationService{
		orgRepo: repositories.NewOrganizationRepository(),
	}
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type PaginatedResult struct {
	Items      any   `json:"data"`
	Page       int   `json:"page"`
	PerPage    int   `json:"per_page"`
	Total      int64 `json:"total"`
	TotalPages int   `json:"total_pages"`
}

func buildFilters(ctx http.Context, keys []string) map[string]any {
	filters := map[string]any{}

	for _, k := range keys {
		if v := ctx.Request().Input(k); v != "" {
			filters[k] = v
		}
	}

	if p := ctx.Request().Input("page"); p != "" {
		if pi, err := strconv.Atoi(p); err == nil {
			filters["page"] = pi
		}
	}
	if pp := ctx.Request().Input("per_page"); pp != "" {
		if ppi, err := strconv.Atoi(pp); err == nil {
			filters["per_page"] = ppi
		}
	}

	// Inject data-scope values from context
	if v := ctx.Value("scope_company_ids"); v != nil {
		if ids, ok := v.([]string); ok {
			filters["scope_company_ids"] = ids
		}
	}
	if v := ctx.Value("scope_office_ids"); v != nil {
		if ids, ok := v.([]string); ok {
			filters["scope_office_ids"] = ids
		}
	}

	return filters
}

func paginationMeta(filters map[string]any, total int64) map[string]any {
	page := 1
	perPage := 20
	if v, ok := filters["page"].(int); ok && v > 0 {
		page = v
	}
	if v, ok := filters["per_page"].(int); ok && v > 0 {
		perPage = v
	}
	totalPages := int(math.Ceil(float64(total) / float64(perPage)))
	return map[string]any{
		"page":        page,
		"per_page":    perPage,
		"total":       total,
		"total_pages": totalPages,
	}
}

// ---------------------------------------------------------------------------
// Company
// ---------------------------------------------------------------------------

func (s *OrganizationService) ListCompanies(ctx http.Context) ([]models.Company, map[string]any, error) {
	filters := buildFilters(ctx, []string{"search", "is_active"})
	items, total, err := s.orgRepo.ListCompanies(filters)
	if err != nil {
		return nil, nil, err
	}
	return items, paginationMeta(filters, total), nil
}

func (s *OrganizationService) GetCompany(id string) (*models.Company, error) {
	return s.orgRepo.FindCompanyByID(id)
}

func (s *OrganizationService) CreateCompany(company *models.Company) error {
	existing, _ := s.orgRepo.FindCompanyByCode(company.Code)
	if existing != nil {
		return errors.New("company code already exists")
	}
	return s.orgRepo.CreateCompany(company)
}

func (s *OrganizationService) UpdateCompany(id string, data map[string]any) (*models.Company, error) {
	company, err := s.orgRepo.FindCompanyByID(id)
	if err != nil {
		return nil, errors.New("company not found")
	}

	if code, ok := data["code"].(string); ok && code != company.Code {
		existing, _ := s.orgRepo.FindCompanyByCode(code)
		if existing != nil {
			return nil, errors.New("company code already exists")
		}
		company.Code = code
	}

	if name, ok := data["name"].(string); ok {
		company.Name = name
	}
	if v, ok := data["logo_path"].(string); ok {
		company.LogoPath = &v
	}
	if v, ok := data["address"].(string); ok {
		company.Address = &v
	}
	if v, ok := data["phone"].(string); ok {
		company.Phone = &v
	}
	if v, ok := data["email"].(string); ok {
		company.Email = &v
	}
	if v, ok := data["website"].(string); ok {
		company.Website = &v
	}
	if v, ok := data["npwp"].(string); ok {
		company.NPWP = &v
	}
	if v, ok := data["is_active"].(bool); ok {
		company.IsActive = v
	}

	if err := s.orgRepo.UpdateCompany(company); err != nil {
		return nil, err
	}
	return company, nil
}

func (s *OrganizationService) DeleteCompany(id string) error {
	if _, err := s.orgRepo.FindCompanyByID(id); err != nil {
		return errors.New("company not found")
	}
	return s.orgRepo.DeleteCompany(id)
}

// ---------------------------------------------------------------------------
// Office
// ---------------------------------------------------------------------------

func (s *OrganizationService) ListOffices(ctx http.Context) ([]models.Office, map[string]any, error) {
	filters := buildFilters(ctx, []string{"company_id", "type", "is_active", "search"})
	items, total, err := s.orgRepo.ListOffices(filters)
	if err != nil {
		return nil, nil, err
	}
	return items, paginationMeta(filters, total), nil
}

func (s *OrganizationService) GetOffice(id string) (*models.Office, error) {
	return s.orgRepo.FindOfficeByID(id)
}

func (s *OrganizationService) CreateOffice(office *models.Office) error {
	if _, err := s.orgRepo.FindCompanyByID(office.CompanyID); err != nil {
		return errors.New("company not found")
	}
	return s.orgRepo.CreateOffice(office)
}

func (s *OrganizationService) UpdateOffice(id string, data map[string]any) (*models.Office, error) {
	office, err := s.orgRepo.FindOfficeByID(id)
	if err != nil {
		return nil, errors.New("office not found")
	}

	if companyID, ok := data["company_id"].(string); ok {
		if _, err := s.orgRepo.FindCompanyByID(companyID); err != nil {
			return nil, errors.New("company not found")
		}
		office.CompanyID = companyID
	}
	if v, ok := data["name"].(string); ok {
		office.Name = v
	}
	if v, ok := data["code"].(string); ok {
		office.Code = v
	}
	if v, ok := data["type"].(string); ok {
		office.Type = v
	}
	if v, ok := data["address"].(string); ok {
		office.Address = &v
	}
	if v, ok := data["city"].(string); ok {
		office.City = &v
	}
	if v, ok := data["province"].(string); ok {
		office.Province = &v
	}
	if v, ok := data["postal_code"].(string); ok {
		office.PostalCode = &v
	}
	if v, ok := data["phone"].(string); ok {
		office.Phone = &v
	}
	if v, ok := data["email"].(string); ok {
		office.Email = &v
	}
	if v, ok := data["is_default"].(bool); ok {
		office.IsDefault = v
	}
	if v, ok := data["is_active"].(bool); ok {
		office.IsActive = v
	}

	if err := s.orgRepo.UpdateOffice(office); err != nil {
		return nil, err
	}
	return office, nil
}

func (s *OrganizationService) DeleteOffice(id string) error {
	if _, err := s.orgRepo.FindOfficeByID(id); err != nil {
		return errors.New("office not found")
	}
	return s.orgRepo.DeleteOffice(id)
}

func (s *OrganizationService) ListDepartmentsByOffice(officeID string) ([]models.Department, error) {
	if _, err := s.orgRepo.FindOfficeByID(officeID); err != nil {
		return nil, errors.New("office not found")
	}
	return s.orgRepo.ListDepartmentsByOfficeID(officeID)
}

// ---------------------------------------------------------------------------
// Department
// ---------------------------------------------------------------------------

func (s *OrganizationService) ListDepartments(ctx http.Context) ([]models.Department, map[string]any, error) {
	filters := buildFilters(ctx, []string{"office_id", "parent_id", "is_active", "search"})
	items, total, err := s.orgRepo.ListDepartments(filters)
	if err != nil {
		return nil, nil, err
	}
	return items, paginationMeta(filters, total), nil
}

func (s *OrganizationService) GetDepartment(id string) (*models.Department, error) {
	return s.orgRepo.FindDepartmentByID(id)
}

func (s *OrganizationService) CreateDepartment(dept *models.Department) error {
	if _, err := s.orgRepo.FindOfficeByID(dept.OfficeID); err != nil {
		return errors.New("office not found")
	}
	if dept.ParentID != nil {
		if _, err := s.orgRepo.FindDepartmentByID(*dept.ParentID); err != nil {
			return errors.New("parent department not found")
		}
	}
	return s.orgRepo.CreateDepartment(dept)
}

func (s *OrganizationService) UpdateDepartment(id string, data map[string]any) (*models.Department, error) {
	dept, err := s.orgRepo.FindDepartmentByID(id)
	if err != nil {
		return nil, errors.New("department not found")
	}

	if officeID, ok := data["office_id"].(string); ok {
		if _, err := s.orgRepo.FindOfficeByID(officeID); err != nil {
			return nil, errors.New("office not found")
		}
		dept.OfficeID = officeID
	}
	if v, ok := data["name"].(string); ok {
		dept.Name = v
	}
	if v, ok := data["code"].(string); ok {
		dept.Code = v
	}
	if v, ok := data["parent_id"].(string); ok {
		if _, err := s.orgRepo.FindDepartmentByID(v); err != nil {
			return nil, errors.New("parent department not found")
		}
		dept.ParentID = &v
	}
	if v, ok := data["head_user_id"].(string); ok {
		dept.HeadUserID = &v
	}
	if v, ok := data["sort_order"].(float64); ok {
		dept.SortOrder = int(v)
	}
	if v, ok := data["is_active"].(bool); ok {
		dept.IsActive = v
	}

	if err := s.orgRepo.UpdateDepartment(dept); err != nil {
		return nil, err
	}
	return dept, nil
}

func (s *OrganizationService) DeleteDepartment(id string) error {
	if _, err := s.orgRepo.FindDepartmentByID(id); err != nil {
		return errors.New("department not found")
	}
	return s.orgRepo.DeleteDepartment(id)
}

func (s *OrganizationService) ListSectionsByDepartment(deptID string) ([]models.Section, error) {
	if _, err := s.orgRepo.FindDepartmentByID(deptID); err != nil {
		return nil, errors.New("department not found")
	}
	return s.orgRepo.ListSectionsByDepartmentID(deptID)
}

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

func (s *OrganizationService) ListSections(ctx http.Context) ([]models.Section, map[string]any, error) {
	filters := buildFilters(ctx, []string{"department_id", "is_active", "search"})
	items, total, err := s.orgRepo.ListSections(filters)
	if err != nil {
		return nil, nil, err
	}
	return items, paginationMeta(filters, total), nil
}

func (s *OrganizationService) GetSection(id string) (*models.Section, error) {
	return s.orgRepo.FindSectionByID(id)
}

func (s *OrganizationService) CreateSection(section *models.Section) error {
	if _, err := s.orgRepo.FindDepartmentByID(section.DepartmentID); err != nil {
		return errors.New("department not found")
	}
	return s.orgRepo.CreateSection(section)
}

func (s *OrganizationService) UpdateSection(id string, data map[string]any) (*models.Section, error) {
	section, err := s.orgRepo.FindSectionByID(id)
	if err != nil {
		return nil, errors.New("section not found")
	}

	if deptID, ok := data["department_id"].(string); ok {
		if _, err := s.orgRepo.FindDepartmentByID(deptID); err != nil {
			return nil, errors.New("department not found")
		}
		section.DepartmentID = deptID
	}
	if v, ok := data["name"].(string); ok {
		section.Name = v
	}
	if v, ok := data["code"].(string); ok {
		section.Code = v
	}
	if v, ok := data["head_user_id"].(string); ok {
		section.HeadUserID = &v
	}
	if v, ok := data["sort_order"].(float64); ok {
		section.SortOrder = int(v)
	}
	if v, ok := data["is_active"].(bool); ok {
		section.IsActive = v
	}

	if err := s.orgRepo.UpdateSection(section); err != nil {
		return nil, err
	}
	return section, nil
}

func (s *OrganizationService) DeleteSection(id string) error {
	if _, err := s.orgRepo.FindSectionByID(id); err != nil {
		return errors.New("section not found")
	}
	return s.orgRepo.DeleteSection(id)
}

// ---------------------------------------------------------------------------
// Position
// ---------------------------------------------------------------------------

func (s *OrganizationService) ListPositions(ctx http.Context) ([]models.Position, map[string]any, error) {
	filters := buildFilters(ctx, []string{"company_id", "is_active", "search", "sort_by"})
	items, total, err := s.orgRepo.ListPositions(filters)
	if err != nil {
		return nil, nil, err
	}
	return items, paginationMeta(filters, total), nil
}

func (s *OrganizationService) GetPosition(id string) (*models.Position, error) {
	return s.orgRepo.FindPositionByID(id)
}

func (s *OrganizationService) CreatePosition(position *models.Position) error {
	if _, err := s.orgRepo.FindCompanyByID(position.CompanyID); err != nil {
		return errors.New("company not found")
	}
	return s.orgRepo.CreatePosition(position)
}

func (s *OrganizationService) UpdatePosition(id string, data map[string]any) (*models.Position, error) {
	position, err := s.orgRepo.FindPositionByID(id)
	if err != nil {
		return nil, errors.New("position not found")
	}

	if companyID, ok := data["company_id"].(string); ok {
		if _, err := s.orgRepo.FindCompanyByID(companyID); err != nil {
			return nil, errors.New("company not found")
		}
		position.CompanyID = companyID
	}
	if v, ok := data["name"].(string); ok {
		position.Name = v
	}
	if v, ok := data["code"].(string); ok {
		position.Code = v
	}
	if v, ok := data["level"].(float64); ok {
		position.Level = int(v)
	}
	if v, ok := data["description"].(string); ok {
		position.Description = &v
	}
	if v, ok := data["is_active"].(bool); ok {
		position.IsActive = v
	}

	if err := s.orgRepo.UpdatePosition(position); err != nil {
		return nil, err
	}
	return position, nil
}

func (s *OrganizationService) DeletePosition(id string) error {
	if _, err := s.orgRepo.FindPositionByID(id); err != nil {
		return errors.New("position not found")
	}
	return s.orgRepo.DeletePosition(id)
}
