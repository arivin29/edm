package controllers

import (
	nethttp "net/http"
	"strconv"

	"github.com/goravel/framework/contracts/http"

	"dms/app/facades"
	"dms/app/services"
	"dms/app/types"
)

type DocumentController struct {
	documentService  *services.DocumentService
	watermarkService *services.WatermarkService
}

func NewDocumentController() *DocumentController {
	return &DocumentController{
		documentService:  services.NewDocumentService(),
		watermarkService: services.NewWatermarkService(),
	}
}

// ---------------------------------------------------------------------------
// GET /documents - List documents
// ---------------------------------------------------------------------------

func (c *DocumentController) Index(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("document.view") {
		return forbiddenResponse(ctx)
	}

	items, meta, err := c.documentService.List(ctx)
	if err != nil {
		return serverError(ctx, "Failed to list documents")
	}

	return ctx.Response().Success().Json(http.Json{
		"data": items,
		"meta": meta,
	})
}

// ---------------------------------------------------------------------------
// POST /documents - Create document from template
// ---------------------------------------------------------------------------

func (c *DocumentController) Store(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("document.create") {
		return forbiddenResponse(ctx)
	}

	validator, err := facades.Validation().Make(ctx, ctx.Request().All(), map[string]string{
		"template_id": "required",
		"title":       "required|max_len:500",
	})
	if err != nil {
		return validationError(ctx, err)
	}
	if validator.Fails() {
		return validationFailed(ctx, validator.Errors().All())
	}

	doc, err := c.documentService.Create(ctx)
	if err != nil {
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Json(nethttp.StatusCreated, http.Json{
		"data": doc,
	})
}

// ---------------------------------------------------------------------------
// GET /documents/{id} - Get document detail
// ---------------------------------------------------------------------------

func (c *DocumentController) Show(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("document.view") {
		return forbiddenResponse(ctx)
	}

	id := ctx.Request().Route("id")
	doc, err := c.documentService.GetByID(id)
	if err != nil {
		return notFoundError(ctx, err.Error())
	}

	return ctx.Response().Success().Json(http.Json{
		"data": doc,
	})
}

// ---------------------------------------------------------------------------
// PUT /documents/{id} - Update document metadata
// ---------------------------------------------------------------------------

func (c *DocumentController) Update(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("document.edit") {
		return forbiddenResponse(ctx)
	}

	id := ctx.Request().Route("id")
	doc, err := c.documentService.Update(id, ctx)
	if err != nil {
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Success().Json(http.Json{
		"data": doc,
	})
}

// ---------------------------------------------------------------------------
// DELETE /documents/{id} - Soft delete document
// ---------------------------------------------------------------------------

func (c *DocumentController) Destroy(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("document.delete") {
		return forbiddenResponse(ctx)
	}

	id := ctx.Request().Route("id")
	if err := c.documentService.Delete(id, ctx); err != nil {
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Success().Json(http.Json{
		"message": "Document deleted successfully",
	})
}

// ---------------------------------------------------------------------------
// GET /documents/{id}/versions - List all versions
// ---------------------------------------------------------------------------

func (c *DocumentController) ListVersions(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("document.view") {
		return forbiddenResponse(ctx)
	}

	id := ctx.Request().Route("id")
	versions, err := c.documentService.GetVersions(id)
	if err != nil {
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Success().Json(http.Json{
		"data": versions,
	})
}

// ---------------------------------------------------------------------------
// GET /documents/{id}/download - Download current .docx
// ---------------------------------------------------------------------------

func (c *DocumentController) Download(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("document.download") {
		return forbiddenResponse(ctx)
	}

	id := ctx.Request().Route("id")
	filePath, fileName, err := c.documentService.GetFilePath(id)
	if err != nil {
		return notFoundError(ctx, err.Error())
	}

	return ctx.Response().Download(filePath, fileName)
}

// ---------------------------------------------------------------------------
// GET /documents/{id}/preview - Preview with watermark (returns PDF)
// ---------------------------------------------------------------------------

func (c *DocumentController) Preview(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("document.view") {
		return forbiddenResponse(ctx)
	}

	id := ctx.Request().Route("id")
	filePath, _, err := c.documentService.GetFilePath(id)
	if err != nil {
		return notFoundError(ctx, err.Error())
	}

	// Get document classification
	doc, err := c.documentService.GetByID(id)
	if err != nil {
		return notFoundError(ctx, err.Error())
	}

	classification := "internal"
	if doc.Classification != "" {
		classification = doc.Classification
	}

	data, contentType, err := c.watermarkService.GetWatermarkedFile(filePath, classification)
	if err != nil {
		return serverError(ctx, "Failed to generate preview: "+err.Error())
	}

	return ctx.Response().Header("Content-Type", contentType).
		Header("Content-Disposition", "inline").
		Data(nethttp.StatusOK, contentType, data)
}

// ---------------------------------------------------------------------------
// GET /watermark/config - Get watermark configuration
// ---------------------------------------------------------------------------

func (c *DocumentController) GetWatermarkConfig(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil {
		return forbiddenResponse(ctx)
	}

	classifications := []string{"public", "internal", "confidential", "secret"}
	configs := make(map[string]services.WatermarkConfig)

	for _, cl := range classifications {
		configs[cl] = c.watermarkService.GetWatermarkConfig(cl)
	}

	return ctx.Response().Success().Json(http.Json{
		"data": configs,
	})
}

// ---------------------------------------------------------------------------
// PUT /watermark/config - Update watermark configuration
// ---------------------------------------------------------------------------

func (c *DocumentController) UpdateWatermarkConfig(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("setting.edit") {
		return forbiddenResponse(ctx)
	}

	settingService := services.NewSettingService()
	data := ctx.Request().All()

	// Expect: { classification: string, enabled: bool, text: string }
	classification, ok := data["classification"].(string)
	if !ok || classification == "" {
		return badRequestError(ctx, "classification is required")
	}

	if enabled, ok := data["enabled"].(bool); ok {
		val := "false"
		if enabled {
			val = "true"
		}
		settingService.UpsertByKeyValue(nil, nil, "watermark."+classification+".enabled", val, "boolean")
	}

	if text, ok := data["text"].(string); ok {
		settingService.UpsertByKeyValue(nil, nil, "watermark."+classification+".text", text, "string")
	}

	// Return updated config
	config := c.watermarkService.GetWatermarkConfig(classification)
	return ctx.Response().Success().Json(http.Json{
		"data": config,
	})
}

// ---------------------------------------------------------------------------
// POST /documents/{id}/versions - Create new version from file upload
// ---------------------------------------------------------------------------

func (c *DocumentController) CreateVersion(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("document.edit") {
		return forbiddenResponse(ctx)
	}

	id := ctx.Request().Route("id")

	// File is required - will be validated in service when calling Request().File()
	version, err := c.documentService.CreateVersion(id, ctx)
	if err != nil {
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Json(nethttp.StatusCreated, http.Json{
		"data": version,
	})
}

// ---------------------------------------------------------------------------
// GET /documents/{id}/versions/{ver} - Get specific version detail
// ---------------------------------------------------------------------------

func (c *DocumentController) ShowVersion(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("document.view") {
		return forbiddenResponse(ctx)
	}

	id := ctx.Request().Route("id")
	verStr := ctx.Request().Route("ver")
	versionNumber, err := strconv.Atoi(verStr)
	if err != nil {
		return badRequestError(ctx, "Invalid version number")
	}

	version, err := c.documentService.GetVersionDetail(id, versionNumber)
	if err != nil {
		return notFoundError(ctx, err.Error())
	}

	return ctx.Response().Success().Json(http.Json{
		"data": version,
	})
}

// ---------------------------------------------------------------------------
// GET /documents/{id}/versions/{ver}/download - Download specific version
// ---------------------------------------------------------------------------

func (c *DocumentController) DownloadVersion(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("document.download") {
		return forbiddenResponse(ctx)
	}

	id := ctx.Request().Route("id")
	verStr := ctx.Request().Route("ver")
	versionNumber, err := strconv.Atoi(verStr)
	if err != nil {
		return badRequestError(ctx, "Invalid version number")
	}

	filePath, fileName, err := c.documentService.GetVersionFilePath(id, versionNumber)
	if err != nil {
		return notFoundError(ctx, err.Error())
	}

	return ctx.Response().Download(filePath, fileName)
}

// ---------------------------------------------------------------------------
// POST /documents/{id}/versions/{ver}/restore - Restore to specific version
// ---------------------------------------------------------------------------

func (c *DocumentController) RestoreVersion(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("document.edit") {
		return forbiddenResponse(ctx)
	}

	id := ctx.Request().Route("id")
	verStr := ctx.Request().Route("ver")
	versionNumber, err := strconv.Atoi(verStr)
	if err != nil {
		return badRequestError(ctx, "Invalid version number")
	}

	doc, err := c.documentService.RestoreVersion(id, versionNumber, ctx)
	if err != nil {
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Success().Json(http.Json{
		"data":    doc,
		"message": "Document restored successfully",
	})
}
