package repositories

import (
	"dms/app/facades"
	"dms/app/models"
)

type OrganizationRepository interface {
	// Existing find-by-ID methods
	FindCompanyByID(id string) (*models.Company, error)
	FindOfficeByID(id string) (*models.Office, error)
	FindDepartmentByID(id string) (*models.Department, error)
	FindSectionByID(id string) (*models.Section, error)
	FindPositionByID(id string) (*models.Position, error)

	// Company CRUD
	ListCompanies(filters map[string]any) ([]models.Company, int64, error)
	CreateCompany(company *models.Company) error
	UpdateCompany(company *models.Company) error
	DeleteCompany(id string) error
	FindCompanyByCode(code string) (*models.Company, error)

	// Office CRUD
	ListOffices(filters map[string]any) ([]models.Office, int64, error)
	CreateOffice(office *models.Office) error
	UpdateOffice(office *models.Office) error
	DeleteOffice(id string) error

	// Department CRUD
	ListDepartments(filters map[string]any) ([]models.Department, int64, error)
	CreateDepartment(dept *models.Department) error
	UpdateDepartment(dept *models.Department) error
	DeleteDepartment(id string) error
	ListDepartmentsByOfficeID(officeID string) ([]models.Department, error)

	// Section CRUD
	ListSections(filters map[string]any) ([]models.Section, int64, error)
	CreateSection(section *models.Section) error
	UpdateSection(section *models.Section) error
	DeleteSection(id string) error
	ListSectionsByDepartmentID(deptID string) ([]models.Section, error)

	// Position CRUD
	ListPositions(filters map[string]any) ([]models.Position, int64, error)
	CreatePosition(position *models.Position) error
	UpdatePosition(position *models.Position) error
	DeletePosition(id string) error
}

type organizationRepository struct{}

func NewOrganizationRepository() OrganizationRepository {
	return &organizationRepository{}
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

func paginationFromFilters(filters map[string]any) (int, int) {
	page := 1
	perPage := 20
	if v, ok := filters["page"]; ok {
		if p, ok := v.(int); ok && p > 0 {
			page = p
		}
	}
	if v, ok := filters["per_page"]; ok {
		if pp, ok := v.(int); ok && pp > 0 {
			perPage = pp
		}
	}
	return page, perPage
}

// ---------------------------------------------------------------------------
// Company
// ---------------------------------------------------------------------------

func (r *organizationRepository) FindCompanyByID(id string) (*models.Company, error) {
	var company models.Company
	if err := facades.Orm().Query().Where("id = ?", id).First(&company); err != nil {
		return nil, err
	}
	return &company, nil
}

func (r *organizationRepository) FindCompanyByCode(code string) (*models.Company, error) {
	var company models.Company
	if err := facades.Orm().Query().Where("code = ?", code).First(&company); err != nil {
		return nil, err
	}
	return &company, nil
}

func (r *organizationRepository) ListCompanies(filters map[string]any) ([]models.Company, int64, error) {
	page, perPage := paginationFromFilters(filters)
	offset := (page - 1) * perPage

	q := facades.Orm().Query()

	if search, ok := filters["search"].(string); ok && search != "" {
		q = q.Where("name ILIKE ? OR code ILIKE ?", "%"+search+"%", "%"+search+"%")
	}
	if isActive, ok := filters["is_active"].(string); ok && isActive != "" {
		q = q.Where("is_active = ?", isActive == "true" || isActive == "1")
	}
	if companyIDs, ok := filters["scope_company_ids"].([]string); ok && len(companyIDs) > 0 {
		q = q.Where("id IN ?", companyIDs)
	}

	count, err := q.Model(&models.Company{}).Count()
	if err != nil {
		return nil, 0, err
	}

	var items []models.Company
	if err := q.Order("created_at desc").Offset(offset).Limit(perPage).Get(&items); err != nil {
		return nil, 0, err
	}

	return items, count, nil
}

func (r *organizationRepository) CreateCompany(company *models.Company) error {
	return facades.Orm().Query().Create(company)
}

func (r *organizationRepository) UpdateCompany(company *models.Company) error {
	return facades.Orm().Query().Save(company)
}

func (r *organizationRepository) DeleteCompany(id string) error {
	_, err := facades.Orm().Query().Where("id = ?", id).Delete(&models.Company{})
	return err
}

// ---------------------------------------------------------------------------
// Office
// ---------------------------------------------------------------------------

func (r *organizationRepository) FindOfficeByID(id string) (*models.Office, error) {
	var office models.Office
	if err := facades.Orm().Query().Where("id = ?", id).First(&office); err != nil {
		return nil, err
	}
	return &office, nil
}

func (r *organizationRepository) ListOffices(filters map[string]any) ([]models.Office, int64, error) {
	page, perPage := paginationFromFilters(filters)
	offset := (page - 1) * perPage

	q := facades.Orm().Query()

	if companyID, ok := filters["company_id"].(string); ok && companyID != "" {
		q = q.Where("company_id = ?", companyID)
	}
	if typ, ok := filters["type"].(string); ok && typ != "" {
		q = q.Where("type = ?", typ)
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
	if officeIDs, ok := filters["scope_office_ids"].([]string); ok && len(officeIDs) > 0 {
		q = q.Where("id IN ?", officeIDs)
	}

	count, err := q.Model(&models.Office{}).Count()
	if err != nil {
		return nil, 0, err
	}

	var items []models.Office
	if err := q.Order("created_at desc").Offset(offset).Limit(perPage).Get(&items); err != nil {
		return nil, 0, err
	}

	return items, count, nil
}

func (r *organizationRepository) CreateOffice(office *models.Office) error {
	return facades.Orm().Query().Create(office)
}

func (r *organizationRepository) UpdateOffice(office *models.Office) error {
	return facades.Orm().Query().Save(office)
}

func (r *organizationRepository) DeleteOffice(id string) error {
	_, err := facades.Orm().Query().Where("id = ?", id).Delete(&models.Office{})
	return err
}

// ---------------------------------------------------------------------------
// Department
// ---------------------------------------------------------------------------

func (r *organizationRepository) FindDepartmentByID(id string) (*models.Department, error) {
	var dept models.Department
	if err := facades.Orm().Query().Where("id = ?", id).First(&dept); err != nil {
		return nil, err
	}
	return &dept, nil
}

func (r *organizationRepository) ListDepartments(filters map[string]any) ([]models.Department, int64, error) {
	page, perPage := paginationFromFilters(filters)
	offset := (page - 1) * perPage

	q := facades.Orm().Query()

	if officeID, ok := filters["office_id"].(string); ok && officeID != "" {
		q = q.Where("office_id = ?", officeID)
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

	count, err := q.Model(&models.Department{}).Count()
	if err != nil {
		return nil, 0, err
	}

	var items []models.Department
	if err := q.Order("sort_order asc, created_at desc").Offset(offset).Limit(perPage).Get(&items); err != nil {
		return nil, 0, err
	}

	return items, count, nil
}

func (r *organizationRepository) ListDepartmentsByOfficeID(officeID string) ([]models.Department, error) {
	var items []models.Department
	if err := facades.Orm().Query().Where("office_id = ?", officeID).Order("sort_order asc").Get(&items); err != nil {
		return nil, err
	}
	return items, nil
}

func (r *organizationRepository) CreateDepartment(dept *models.Department) error {
	return facades.Orm().Query().Create(dept)
}

func (r *organizationRepository) UpdateDepartment(dept *models.Department) error {
	return facades.Orm().Query().Save(dept)
}

func (r *organizationRepository) DeleteDepartment(id string) error {
	_, err := facades.Orm().Query().Where("id = ?", id).Delete(&models.Department{})
	return err
}

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

func (r *organizationRepository) FindSectionByID(id string) (*models.Section, error) {
	var section models.Section
	if err := facades.Orm().Query().Where("id = ?", id).First(&section); err != nil {
		return nil, err
	}
	return &section, nil
}

func (r *organizationRepository) ListSections(filters map[string]any) ([]models.Section, int64, error) {
	page, perPage := paginationFromFilters(filters)
	offset := (page - 1) * perPage

	q := facades.Orm().Query()

	if deptID, ok := filters["department_id"].(string); ok && deptID != "" {
		q = q.Where("department_id = ?", deptID)
	}
	if isActive, ok := filters["is_active"].(string); ok && isActive != "" {
		q = q.Where("is_active = ?", isActive == "true" || isActive == "1")
	}
	if search, ok := filters["search"].(string); ok && search != "" {
		q = q.Where("name ILIKE ? OR code ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	count, err := q.Model(&models.Section{}).Count()
	if err != nil {
		return nil, 0, err
	}

	var items []models.Section
	if err := q.Order("sort_order asc, created_at desc").Offset(offset).Limit(perPage).Get(&items); err != nil {
		return nil, 0, err
	}

	return items, count, nil
}

func (r *organizationRepository) ListSectionsByDepartmentID(deptID string) ([]models.Section, error) {
	var items []models.Section
	if err := facades.Orm().Query().Where("department_id = ?", deptID).Order("sort_order asc").Get(&items); err != nil {
		return nil, err
	}
	return items, nil
}

func (r *organizationRepository) CreateSection(section *models.Section) error {
	return facades.Orm().Query().Create(section)
}

func (r *organizationRepository) UpdateSection(section *models.Section) error {
	return facades.Orm().Query().Save(section)
}

func (r *organizationRepository) DeleteSection(id string) error {
	_, err := facades.Orm().Query().Where("id = ?", id).Delete(&models.Section{})
	return err
}

// ---------------------------------------------------------------------------
// Position
// ---------------------------------------------------------------------------

func (r *organizationRepository) FindPositionByID(id string) (*models.Position, error) {
	var position models.Position
	if err := facades.Orm().Query().Where("id = ?", id).First(&position); err != nil {
		return nil, err
	}
	return &position, nil
}

func (r *organizationRepository) ListPositions(filters map[string]any) ([]models.Position, int64, error) {
	page, perPage := paginationFromFilters(filters)
	offset := (page - 1) * perPage

	q := facades.Orm().Query()

	if companyID, ok := filters["company_id"].(string); ok && companyID != "" {
		q = q.Where("company_id = ?", companyID)
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

	orderBy := "created_at desc"
	if sortBy, ok := filters["sort_by"].(string); ok && sortBy == "level" {
		orderBy = "level asc, created_at desc"
	}

	count, err := q.Model(&models.Position{}).Count()
	if err != nil {
		return nil, 0, err
	}

	var items []models.Position
	if err := q.Order(orderBy).Offset(offset).Limit(perPage).Get(&items); err != nil {
		return nil, 0, err
	}

	return items, count, nil
}

func (r *organizationRepository) CreatePosition(position *models.Position) error {
	return facades.Orm().Query().Create(position)
}

func (r *organizationRepository) UpdatePosition(position *models.Position) error {
	return facades.Orm().Query().Save(position)
}

func (r *organizationRepository) DeletePosition(id string) error {
	_, err := facades.Orm().Query().Where("id = ?", id).Delete(&models.Position{})
	return err
}
