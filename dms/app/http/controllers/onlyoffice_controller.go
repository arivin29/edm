package controllers

import (
	"net/http"

	contractshttp "github.com/goravel/framework/contracts/http"

	"dms/app/services"
	"dms/app/types"
)

type OnlyOfficeController struct {
	service *services.OnlyOfficeService
}

func NewOnlyOfficeController() *OnlyOfficeController {
	return &OnlyOfficeController{
		service: services.NewOnlyOfficeService(),
	}
}

// GetConfig returns editor configuration for a document
// GET /documents/{id}/editor-config
func (c *OnlyOfficeController) GetConfig(ctx contractshttp.Context) contractshttp.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("document.view") {
		return ctx.Response().Json(http.StatusForbidden, contractshttp.Json{
			"error": "Forbidden",
		})
	}

	id := ctx.Request().Route("id")

	// Get user name - for now use ID, could be enhanced to fetch actual name
	userName := user.ID

	config, err := c.service.GetEditorConfig(id, user.ID, userName, user.Permissions)
	if err != nil {
		return ctx.Response().Json(http.StatusBadRequest, contractshttp.Json{
			"error": err.Error(),
		})
	}

	return ctx.Response().Json(http.StatusOK, contractshttp.Json{
		"data": config,
	})
}

// Callback handles OnlyOffice document server callbacks
// POST /onlyoffice/callback
func (c *OnlyOfficeController) Callback(ctx contractshttp.Context) contractshttp.Response {
	// Note: This endpoint is accessible without auth for OnlyOffice server
	if err := c.service.HandleCallback(ctx); err != nil {
		// OnlyOffice expects {"error": 0} for success, {"error": 1} for failure
		return ctx.Response().Json(http.StatusOK, contractshttp.Json{
			"error": 1,
		})
	}

	return ctx.Response().Json(http.StatusOK, contractshttp.Json{
		"error": 0,
	})
}

// Download serves a document file via OnlyOffice key (no auth required - for OnlyOffice)
// GET /onlyoffice/download/{key}
func (c *OnlyOfficeController) Download(ctx contractshttp.Context) contractshttp.Response {
	key := ctx.Request().Route("key")

	filePath, fileName, err := c.service.ValidateDownloadKey(key)
	if err != nil {
		return ctx.Response().Json(http.StatusForbidden, contractshttp.Json{
			"error": "Invalid download key",
		})
	}

	return ctx.Response().Download(filePath, fileName)
}
