package controllers

import (
	"github.com/goravel/framework/contracts/http"

	"dms/app/facades"
	"dms/app/models"
	"dms/app/services"
	"dms/app/types"
)

type NumberingController struct {
	numberingService *services.NumberingService
}

func NewNumberingController() *NumberingController {
	return &NumberingController{
		numberingService: services.NewNumberingService(),
	}
}

func (c *NumberingController) List(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil {
		return ctx.Response().Json(http.StatusUnauthorized, http.Json{"error": "Unauthorized"})
	}

	items, meta, err := c.numberingService.List(ctx)
	if err != nil {
		return serverError(ctx, "Failed to list numbering configs")
	}
	return ctx.Response().Success().Json(http.Json{
		"data": items,
		"meta": meta,
	})
}

func (c *NumberingController) Create(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil {
		return ctx.Response().Json(http.StatusUnauthorized, http.Json{"error": "Unauthorized"})
	}

	validator, err := facades.Validation().Make(ctx, ctx.Request().All(), map[string]string{
		"company_id":       "required",
		"document_type_id": "required",
		"format":           "required|max_len:255",
	})
	if err != nil {
		return validationError(ctx, err)
	}
	if validator.Fails() {
		return validationFailed(ctx, validator.Errors().All())
	}

	dn := models.DocumentNumbering{
		CompanyID:      ctx.Request().Input("company_id"),
		DocumentTypeID: ctx.Request().Input("document_type_id"),
		Format:         ctx.Request().Input("format"),
		Separator:      "/",
	}

	if v := ctx.Request().Input("office_id"); v != "" {
		dn.OfficeID = &v
	}
	if v := ctx.Request().Input("category_id"); v != "" {
		dn.CategoryID = &v
	}
	if v := ctx.Request().Input("department_id"); v != "" {
		dn.DepartmentID = &v
	}
	if v := ctx.Request().Input("prefix"); v != "" {
		dn.Prefix = &v
	}
	if v := ctx.Request().Input("separator"); v != "" {
		dn.Separator = v
	}
	if v := ctx.Request().Input("reset_period"); v != "" {
		dn.ResetPeriod = &v
	}

	if err := c.numberingService.Create(&dn); err != nil {
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Json(http.StatusCreated, http.Json{
		"data": dn,
	})
}

func (c *NumberingController) Show(ctx http.Context) http.Response {
	id := ctx.Request().Route("id")
	dn, err := c.numberingService.FindByID(id)
	if err != nil {
		return notFoundError(ctx, "Numbering config not found")
	}
	return ctx.Response().Success().Json(http.Json{
		"data": dn,
	})
}

func (c *NumberingController) Update(ctx http.Context) http.Response {
	id := ctx.Request().Route("id")
	data := ctx.Request().All()

	dn, err := c.numberingService.Update(id, data)
	if err != nil {
		return badRequestError(ctx, err.Error())
	}
	return ctx.Response().Success().Json(http.Json{
		"data": dn,
	})
}

func (c *NumberingController) Delete(ctx http.Context) http.Response {
	id := ctx.Request().Route("id")
	if err := c.numberingService.Delete(id); err != nil {
		return badRequestError(ctx, err.Error())
	}
	return ctx.Response().Success().Json(http.Json{
		"message": "Numbering config deleted successfully",
	})
}

func (c *NumberingController) Preview(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil {
		return ctx.Response().Json(http.StatusUnauthorized, http.Json{"error": "Unauthorized"})
	}

	companyID := ctx.Request().Query("company_id", user.CompanyID)
	documentTypeID := ctx.Request().Query("document_type_id", "")
	if documentTypeID == "" {
		return badRequestError(ctx, "document_type_id is required")
	}

	var categoryID, officeID, departmentID *string
	if v := ctx.Request().Query("category_id", ""); v != "" {
		categoryID = &v
	}
	if v := ctx.Request().Query("office_id", ""); v != "" {
		officeID = &v
	}
	if v := ctx.Request().Query("department_id", ""); v != "" {
		departmentID = &v
	}

	result, err := c.numberingService.Preview(companyID, documentTypeID, categoryID, officeID, departmentID)
	if err != nil {
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Success().Json(http.Json{
		"data": result,
	})
}
