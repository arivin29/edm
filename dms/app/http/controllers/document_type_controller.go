package controllers

import (
	"github.com/goravel/framework/contracts/http"

	"dms/app/facades"
	"dms/app/models"
	"dms/app/services"
)

type DocumentTypeController struct {
	docTypeService *services.DocumentTypeService
}

func NewDocumentTypeController() *DocumentTypeController {
	return &DocumentTypeController{
		docTypeService: services.NewDocumentTypeService(),
	}
}

// ---------------------------------------------------------------------------
// Document Types
// ---------------------------------------------------------------------------

func (c *DocumentTypeController) ListTypes(ctx http.Context) http.Response {
	items, meta, err := c.docTypeService.ListTypes(ctx)
	if err != nil {
		return serverError(ctx, "Failed to list document types")
	}
	return ctx.Response().Success().Json(http.Json{
		"data": items,
		"meta": meta,
	})
}

func (c *DocumentTypeController) CreateType(ctx http.Context) http.Response {
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

	dt := models.DocumentType{
		Name:     ctx.Request().Input("name"),
		Code:     ctx.Request().Input("code"),
		IsActive: true,
	}
	if v := ctx.Request().Input("description"); v != "" {
		dt.Description = &v
	}
	if v := ctx.Request().Input("icon"); v != "" {
		dt.Icon = &v
	}
	if v := ctx.Request().InputInt("sort_order"); v > 0 {
		dt.SortOrder = v
	}

	if err := c.docTypeService.CreateType(&dt); err != nil {
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Json(http.StatusCreated, http.Json{
		"data": dt,
	})
}

func (c *DocumentTypeController) ShowType(ctx http.Context) http.Response {
	id := ctx.Request().Route("id")
	dt, err := c.docTypeService.GetType(id)
	if err != nil {
		return notFoundError(ctx, "Document type not found")
	}
	return ctx.Response().Success().Json(http.Json{
		"data": dt,
	})
}

func (c *DocumentTypeController) UpdateType(ctx http.Context) http.Response {
	id := ctx.Request().Route("id")
	data := ctx.Request().All()

	dt, err := c.docTypeService.UpdateType(id, data)
	if err != nil {
		return badRequestError(ctx, err.Error())
	}
	return ctx.Response().Success().Json(http.Json{
		"data": dt,
	})
}

// ---------------------------------------------------------------------------
// Document Categories
// ---------------------------------------------------------------------------

func (c *DocumentTypeController) ListCategories(ctx http.Context) http.Response {
	items, meta, err := c.docTypeService.ListCategories(ctx)
	if err != nil {
		return serverError(ctx, "Failed to list categories")
	}
	return ctx.Response().Success().Json(http.Json{
		"data": items,
		"meta": meta,
	})
}

func (c *DocumentTypeController) CreateCategory(ctx http.Context) http.Response {
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

	cat := models.DocumentCategory{
		CompanyID: ctx.Request().Input("company_id"),
		Name:      ctx.Request().Input("name"),
		Code:      ctx.Request().Input("code"),
		IsActive:  true,
	}
	if v := ctx.Request().Input("description"); v != "" {
		cat.Description = &v
	}
	if v := ctx.Request().Input("color"); v != "" {
		cat.Color = &v
	}
	if v := ctx.Request().Input("icon"); v != "" {
		cat.Icon = &v
	}
	if v := ctx.Request().Input("parent_id"); v != "" {
		cat.ParentID = &v
	}
	if v := ctx.Request().InputInt("sort_order"); v > 0 {
		cat.SortOrder = v
	}

	if err := c.docTypeService.CreateCategory(&cat); err != nil {
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Json(http.StatusCreated, http.Json{
		"data": cat,
	})
}

func (c *DocumentTypeController) ShowCategory(ctx http.Context) http.Response {
	id := ctx.Request().Route("id")
	cat, err := c.docTypeService.GetCategory(id)
	if err != nil {
		return notFoundError(ctx, "Category not found")
	}
	return ctx.Response().Success().Json(http.Json{
		"data": cat,
	})
}

func (c *DocumentTypeController) UpdateCategory(ctx http.Context) http.Response {
	id := ctx.Request().Route("id")
	data := ctx.Request().All()

	cat, err := c.docTypeService.UpdateCategory(id, data)
	if err != nil {
		return badRequestError(ctx, err.Error())
	}
	return ctx.Response().Success().Json(http.Json{
		"data": cat,
	})
}

func (c *DocumentTypeController) DeleteCategory(ctx http.Context) http.Response {
	id := ctx.Request().Route("id")
	if err := c.docTypeService.DeleteCategory(id); err != nil {
		return badRequestError(ctx, err.Error())
	}
	return ctx.Response().Success().Json(http.Json{
		"message": "Category deleted successfully",
	})
}
