package controllers

import (
	"github.com/goravel/framework/contracts/http"

	"dms/app/facades"
	"dms/app/models"
	"dms/app/services"
)

type OrganizationController struct {
	orgService *services.OrganizationService
}

func NewOrganizationController() *OrganizationController {
	return &OrganizationController{
		orgService: services.NewOrganizationService(),
	}
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

func validationError(ctx http.Context, err error) http.Response {
	return ctx.Response().Json(http.StatusUnprocessableEntity, http.Json{
		"error": "Validation error: " + err.Error(),
	})
}

func validationFailed(ctx http.Context, errs map[string]map[string]string) http.Response {
	return ctx.Response().Json(http.StatusUnprocessableEntity, http.Json{
		"error":  "Validation failed",
		"errors": errs,
	})
}

func serverError(ctx http.Context, msg string) http.Response {
	return ctx.Response().Json(http.StatusInternalServerError, http.Json{
		"error": msg,
	})
}

func notFoundError(ctx http.Context, msg string) http.Response {
	return ctx.Response().Json(http.StatusNotFound, http.Json{
		"error": msg,
	})
}

func badRequestError(ctx http.Context, msg string) http.Response {
	return ctx.Response().Json(http.StatusBadRequest, http.Json{
		"error": msg,
	})
}

// ---------------------------------------------------------------------------
// Company
// ---------------------------------------------------------------------------

func (c *OrganizationController) ListCompanies(ctx http.Context) http.Response {
	items, meta, err := c.orgService.ListCompanies(ctx)
	if err != nil {
		return serverError(ctx, "Failed to list companies")
	}
	return ctx.Response().Success().Json(http.Json{
		"data": items,
		"meta": meta,
	})
}

func (c *OrganizationController) CreateCompany(ctx http.Context) http.Response {
	validator, err := facades.Validation().Make(ctx, ctx.Request().All(), map[string]string{
		"name": "required|max_len:255",
		"code": "required|max_len:50",
	})
	if err != nil {
		return validationError(ctx, err)
	}
	if validator.Fails() {
		return validationFailed(ctx, validator.Errors().All())
	}

	company := models.Company{
		Name:     ctx.Request().Input("name"),
		Code:     ctx.Request().Input("code"),
		IsActive: true,
	}
	if v := ctx.Request().Input("logo_path"); v != "" {
		company.LogoPath = &v
	}
	if v := ctx.Request().Input("address"); v != "" {
		company.Address = &v
	}
	if v := ctx.Request().Input("phone"); v != "" {
		company.Phone = &v
	}
	if v := ctx.Request().Input("email"); v != "" {
		company.Email = &v
	}
	if v := ctx.Request().Input("website"); v != "" {
		company.Website = &v
	}
	if v := ctx.Request().Input("npwp"); v != "" {
		company.NPWP = &v
	}

	if err := c.orgService.CreateCompany(&company); err != nil {
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Json(http.StatusCreated, http.Json{
		"data": company,
	})
}

func (c *OrganizationController) ShowCompany(ctx http.Context) http.Response {
	id := ctx.Request().Route("id")
	company, err := c.orgService.GetCompany(id)
	if err != nil {
		return notFoundError(ctx, "Company not found")
	}
	return ctx.Response().Success().Json(http.Json{
		"data": company,
	})
}

func (c *OrganizationController) UpdateCompany(ctx http.Context) http.Response {
	id := ctx.Request().Route("id")
	data := ctx.Request().All()

	company, err := c.orgService.UpdateCompany(id, data)
	if err != nil {
		return badRequestError(ctx, err.Error())
	}
	return ctx.Response().Success().Json(http.Json{
		"data": company,
	})
}

func (c *OrganizationController) DeleteCompany(ctx http.Context) http.Response {
	id := ctx.Request().Route("id")
	if err := c.orgService.DeleteCompany(id); err != nil {
		return badRequestError(ctx, err.Error())
	}
	return ctx.Response().Success().Json(http.Json{
		"message": "Company deleted successfully",
	})
}

// ---------------------------------------------------------------------------
// Office
// ---------------------------------------------------------------------------

func (c *OrganizationController) ListOffices(ctx http.Context) http.Response {
	items, meta, err := c.orgService.ListOffices(ctx)
	if err != nil {
		return serverError(ctx, "Failed to list offices")
	}
	return ctx.Response().Success().Json(http.Json{
		"data": items,
		"meta": meta,
	})
}

func (c *OrganizationController) CreateOffice(ctx http.Context) http.Response {
	validator, err := facades.Validation().Make(ctx, ctx.Request().All(), map[string]string{
		"company_id": "required",
		"name":       "required|max_len:255",
		"code":       "required|max_len:50",
	})
	if err != nil {
		return validationError(ctx, err)
	}
	if validator.Fails() {
		return validationFailed(ctx, validator.Errors().All())
	}

	office := models.Office{
		CompanyID: ctx.Request().Input("company_id"),
		Name:      ctx.Request().Input("name"),
		Code:      ctx.Request().Input("code"),
		Type:      ctx.Request().Input("type", "branch"),
		IsActive:  true,
	}
	if v := ctx.Request().Input("address"); v != "" {
		office.Address = &v
	}
	if v := ctx.Request().Input("city"); v != "" {
		office.City = &v
	}
	if v := ctx.Request().Input("province"); v != "" {
		office.Province = &v
	}
	if v := ctx.Request().Input("postal_code"); v != "" {
		office.PostalCode = &v
	}
	if v := ctx.Request().Input("phone"); v != "" {
		office.Phone = &v
	}
	if v := ctx.Request().Input("email"); v != "" {
		office.Email = &v
	}

	if err := c.orgService.CreateOffice(&office); err != nil {
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Json(http.StatusCreated, http.Json{
		"data": office,
	})
}

func (c *OrganizationController) ShowOffice(ctx http.Context) http.Response {
	id := ctx.Request().Route("id")
	office, err := c.orgService.GetOffice(id)
	if err != nil {
		return notFoundError(ctx, "Office not found")
	}
	return ctx.Response().Success().Json(http.Json{
		"data": office,
	})
}

func (c *OrganizationController) UpdateOffice(ctx http.Context) http.Response {
	id := ctx.Request().Route("id")
	data := ctx.Request().All()

	office, err := c.orgService.UpdateOffice(id, data)
	if err != nil {
		return badRequestError(ctx, err.Error())
	}
	return ctx.Response().Success().Json(http.Json{
		"data": office,
	})
}

func (c *OrganizationController) DeleteOffice(ctx http.Context) http.Response {
	id := ctx.Request().Route("id")
	if err := c.orgService.DeleteOffice(id); err != nil {
		return badRequestError(ctx, err.Error())
	}
	return ctx.Response().Success().Json(http.Json{
		"message": "Office deleted successfully",
	})
}

func (c *OrganizationController) ListOfficeDepartments(ctx http.Context) http.Response {
	id := ctx.Request().Route("id")
	items, err := c.orgService.ListDepartmentsByOffice(id)
	if err != nil {
		return badRequestError(ctx, err.Error())
	}
	return ctx.Response().Success().Json(http.Json{
		"data": items,
	})
}

// ---------------------------------------------------------------------------
// Department
// ---------------------------------------------------------------------------

func (c *OrganizationController) ListDepartments(ctx http.Context) http.Response {
	items, meta, err := c.orgService.ListDepartments(ctx)
	if err != nil {
		return serverError(ctx, "Failed to list departments")
	}
	return ctx.Response().Success().Json(http.Json{
		"data": items,
		"meta": meta,
	})
}

func (c *OrganizationController) CreateDepartment(ctx http.Context) http.Response {
	validator, err := facades.Validation().Make(ctx, ctx.Request().All(), map[string]string{
		"office_id": "required",
		"name":      "required|max_len:255",
		"code":      "required|max_len:50",
	})
	if err != nil {
		return validationError(ctx, err)
	}
	if validator.Fails() {
		return validationFailed(ctx, validator.Errors().All())
	}

	dept := models.Department{
		OfficeID: ctx.Request().Input("office_id"),
		Name:     ctx.Request().Input("name"),
		Code:     ctx.Request().Input("code"),
		IsActive: true,
	}
	if v := ctx.Request().Input("parent_id"); v != "" {
		dept.ParentID = &v
	}
	if v := ctx.Request().Input("head_user_id"); v != "" {
		dept.HeadUserID = &v
	}
	if v := ctx.Request().InputInt("sort_order"); v > 0 {
		dept.SortOrder = v
	}

	if err := c.orgService.CreateDepartment(&dept); err != nil {
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Json(http.StatusCreated, http.Json{
		"data": dept,
	})
}

func (c *OrganizationController) ShowDepartment(ctx http.Context) http.Response {
	id := ctx.Request().Route("id")
	dept, err := c.orgService.GetDepartment(id)
	if err != nil {
		return notFoundError(ctx, "Department not found")
	}
	return ctx.Response().Success().Json(http.Json{
		"data": dept,
	})
}

func (c *OrganizationController) UpdateDepartment(ctx http.Context) http.Response {
	id := ctx.Request().Route("id")
	data := ctx.Request().All()

	dept, err := c.orgService.UpdateDepartment(id, data)
	if err != nil {
		return badRequestError(ctx, err.Error())
	}
	return ctx.Response().Success().Json(http.Json{
		"data": dept,
	})
}

func (c *OrganizationController) DeleteDepartment(ctx http.Context) http.Response {
	id := ctx.Request().Route("id")
	if err := c.orgService.DeleteDepartment(id); err != nil {
		return badRequestError(ctx, err.Error())
	}
	return ctx.Response().Success().Json(http.Json{
		"message": "Department deleted successfully",
	})
}

func (c *OrganizationController) ListDepartmentSections(ctx http.Context) http.Response {
	id := ctx.Request().Route("id")
	items, err := c.orgService.ListSectionsByDepartment(id)
	if err != nil {
		return badRequestError(ctx, err.Error())
	}
	return ctx.Response().Success().Json(http.Json{
		"data": items,
	})
}

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

func (c *OrganizationController) ListSections(ctx http.Context) http.Response {
	items, meta, err := c.orgService.ListSections(ctx)
	if err != nil {
		return serverError(ctx, "Failed to list sections")
	}
	return ctx.Response().Success().Json(http.Json{
		"data": items,
		"meta": meta,
	})
}

func (c *OrganizationController) CreateSection(ctx http.Context) http.Response {
	validator, err := facades.Validation().Make(ctx, ctx.Request().All(), map[string]string{
		"department_id": "required",
		"name":          "required|max_len:255",
		"code":          "required|max_len:50",
	})
	if err != nil {
		return validationError(ctx, err)
	}
	if validator.Fails() {
		return validationFailed(ctx, validator.Errors().All())
	}

	section := models.Section{
		DepartmentID: ctx.Request().Input("department_id"),
		Name:         ctx.Request().Input("name"),
		Code:         ctx.Request().Input("code"),
		IsActive:     true,
	}
	if v := ctx.Request().Input("head_user_id"); v != "" {
		section.HeadUserID = &v
	}
	if v := ctx.Request().InputInt("sort_order"); v > 0 {
		section.SortOrder = v
	}

	if err := c.orgService.CreateSection(&section); err != nil {
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Json(http.StatusCreated, http.Json{
		"data": section,
	})
}

func (c *OrganizationController) ShowSection(ctx http.Context) http.Response {
	id := ctx.Request().Route("id")
	section, err := c.orgService.GetSection(id)
	if err != nil {
		return notFoundError(ctx, "Section not found")
	}
	return ctx.Response().Success().Json(http.Json{
		"data": section,
	})
}

func (c *OrganizationController) UpdateSection(ctx http.Context) http.Response {
	id := ctx.Request().Route("id")
	data := ctx.Request().All()

	section, err := c.orgService.UpdateSection(id, data)
	if err != nil {
		return badRequestError(ctx, err.Error())
	}
	return ctx.Response().Success().Json(http.Json{
		"data": section,
	})
}

func (c *OrganizationController) DeleteSection(ctx http.Context) http.Response {
	id := ctx.Request().Route("id")
	if err := c.orgService.DeleteSection(id); err != nil {
		return badRequestError(ctx, err.Error())
	}
	return ctx.Response().Success().Json(http.Json{
		"message": "Section deleted successfully",
	})
}

// ---------------------------------------------------------------------------
// Position
// ---------------------------------------------------------------------------

func (c *OrganizationController) ListPositions(ctx http.Context) http.Response {
	items, meta, err := c.orgService.ListPositions(ctx)
	if err != nil {
		return serverError(ctx, "Failed to list positions")
	}
	return ctx.Response().Success().Json(http.Json{
		"data": items,
		"meta": meta,
	})
}

func (c *OrganizationController) CreatePosition(ctx http.Context) http.Response {
	validator, err := facades.Validation().Make(ctx, ctx.Request().All(), map[string]string{
		"company_id": "required",
		"name":       "required|max_len:255",
		"code":       "required|max_len:50",
	})
	if err != nil {
		return validationError(ctx, err)
	}
	if validator.Fails() {
		return validationFailed(ctx, validator.Errors().All())
	}

	position := models.Position{
		CompanyID: ctx.Request().Input("company_id"),
		Name:      ctx.Request().Input("name"),
		Code:      ctx.Request().Input("code"),
		Level:     ctx.Request().InputInt("level"),
		IsActive:  true,
	}
	if v := ctx.Request().Input("description"); v != "" {
		position.Description = &v
	}

	if err := c.orgService.CreatePosition(&position); err != nil {
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Json(http.StatusCreated, http.Json{
		"data": position,
	})
}

func (c *OrganizationController) ShowPosition(ctx http.Context) http.Response {
	id := ctx.Request().Route("id")
	position, err := c.orgService.GetPosition(id)
	if err != nil {
		return notFoundError(ctx, "Position not found")
	}
	return ctx.Response().Success().Json(http.Json{
		"data": position,
	})
}

func (c *OrganizationController) UpdatePosition(ctx http.Context) http.Response {
	id := ctx.Request().Route("id")
	data := ctx.Request().All()

	position, err := c.orgService.UpdatePosition(id, data)
	if err != nil {
		return badRequestError(ctx, err.Error())
	}
	return ctx.Response().Success().Json(http.Json{
		"data": position,
	})
}

func (c *OrganizationController) DeletePosition(ctx http.Context) http.Response {
	id := ctx.Request().Route("id")
	if err := c.orgService.DeletePosition(id); err != nil {
		return badRequestError(ctx, err.Error())
	}
	return ctx.Response().Success().Json(http.Json{
		"message": "Position deleted successfully",
	})
}
