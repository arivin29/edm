package controllers

import (
	"github.com/goravel/framework/contracts/http"

	"dms/app/facades"
	"dms/app/models"
	"dms/app/services"
)

type SettingController struct {
	settingService *services.SettingService
}

func NewSettingController() *SettingController {
	return &SettingController{
		settingService: services.NewSettingService(),
	}
}

func (c *SettingController) List(ctx http.Context) http.Response {
	items, err := c.settingService.List(ctx)
	if err != nil {
		return serverError(ctx, "Failed to list settings")
	}
	return ctx.Response().Success().Json(http.Json{
		"data": items,
	})
}

func (c *SettingController) GetByKey(ctx http.Context) http.Response {
	key := ctx.Request().Route("key")

	var companyID, officeID *string
	if v := ctx.Request().Input("company_id"); v != "" {
		companyID = &v
	}
	if v := ctx.Request().Input("office_id"); v != "" {
		officeID = &v
	}

	setting, err := c.settingService.GetByKey(companyID, officeID, key)
	if err != nil {
		return notFoundError(ctx, "Setting not found")
	}
	return ctx.Response().Success().Json(http.Json{
		"data": setting,
	})
}

func (c *SettingController) Upsert(ctx http.Context) http.Response {
	validator, err := facades.Validation().Make(ctx, ctx.Request().All(), map[string]string{
		"key":   "required|max_len:255",
		"value": "required",
	})
	if err != nil {
		return validationError(ctx, err)
	}
	if validator.Fails() {
		return validationFailed(ctx, validator.Errors().All())
	}

	setting := models.SystemSetting{
		Key:   ctx.Request().Input("key"),
		Value: ctx.Request().Input("value"),
		Type:  ctx.Request().Input("type", "string"),
	}
	if v := ctx.Request().Input("company_id"); v != "" {
		setting.CompanyID = &v
	}
	if v := ctx.Request().Input("office_id"); v != "" {
		setting.OfficeID = &v
	}
	if v := ctx.Request().Input("description"); v != "" {
		setting.Description = &v
	}

	if err := c.settingService.Upsert(&setting); err != nil {
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Success().Json(http.Json{
		"data": setting,
	})
}

func (c *SettingController) Delete(ctx http.Context) http.Response {
	id := ctx.Request().Route("id")
	if err := c.settingService.Delete(id); err != nil {
		return badRequestError(ctx, err.Error())
	}
	return ctx.Response().Success().Json(http.Json{
		"message": "Setting deleted successfully",
	})
}
