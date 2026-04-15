package controllers

import (
	"encoding/json"
	nethttp "net/http"

	"github.com/goravel/framework/contracts/http"

	"dms/app/facades"
	"dms/app/models"
	"dms/app/services"
	"dms/app/types"
)

type TemplateController struct {
	templateService *services.TemplateService
}

func NewTemplateController() *TemplateController {
	return &TemplateController{
		templateService: services.NewTemplateService(),
	}
}

// ---------------------------------------------------------------------------
// Templates CRUD
// ---------------------------------------------------------------------------

func (c *TemplateController) Index(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("template.view") {
		return forbiddenResponse(ctx)
	}

	items, meta, err := c.templateService.List(ctx)
	if err != nil {
		return serverError(ctx, "Failed to list templates")
	}

	return ctx.Response().Success().Json(http.Json{
		"data": items,
		"meta": meta,
	})
}

func (c *TemplateController) Store(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("template.create") {
		return forbiddenResponse(ctx)
	}

	validator, err := facades.Validation().Make(ctx, ctx.Request().All(), map[string]string{
		"name":             "required|max_len:255",
		"document_type_id": "required",
	})
	if err != nil {
		return validationError(ctx, err)
	}
	if validator.Fails() {
		return validationFailed(ctx, validator.Errors().All())
	}

	t, err := c.templateService.Create(ctx)
	if err != nil {
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Json(nethttp.StatusCreated, http.Json{
		"data": t,
	})
}

func (c *TemplateController) Show(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("template.view") {
		return forbiddenResponse(ctx)
	}

	id := ctx.Request().Route("id")
	t, err := c.templateService.Show(id)
	if err != nil {
		return notFoundError(ctx, "Template not found")
	}

	return ctx.Response().Success().Json(http.Json{
		"data": t,
	})
}

func (c *TemplateController) Update(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("template.edit") {
		return forbiddenResponse(ctx)
	}

	id := ctx.Request().Route("id")
	t, err := c.templateService.Update(id, ctx)
	if err != nil {
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Success().Json(http.Json{
		"data": t,
	})
}

func (c *TemplateController) Destroy(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("template.delete") {
		return forbiddenResponse(ctx)
	}

	id := ctx.Request().Route("id")
	if err := c.templateService.Delete(id); err != nil {
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Success().Json(http.Json{
		"message": "Template deleted successfully",
	})
}

func (c *TemplateController) Upload(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("template.edit") {
		return forbiddenResponse(ctx)
	}

	id := ctx.Request().Route("id")
	t, err := c.templateService.UploadFile(id, ctx)
	if err != nil {
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Success().Json(http.Json{
		"data": t,
	})
}

func (c *TemplateController) Download(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("template.view") {
		return forbiddenResponse(ctx)
	}

	id := ctx.Request().Route("id")
	filePath, fileName, err := c.templateService.GetFilePath(id)
	if err != nil {
		return notFoundError(ctx, err.Error())
	}

	return ctx.Response().Download(filePath, fileName)
}

// ---------------------------------------------------------------------------
// Template Tags
// ---------------------------------------------------------------------------

func (c *TemplateController) ListTags(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("template.view") {
		return forbiddenResponse(ctx)
	}

	id := ctx.Request().Route("id")
	tags, err := c.templateService.ListTags(id)
	if err != nil {
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Success().Json(http.Json{
		"data": tags,
	})
}

func (c *TemplateController) StoreTag(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("template.edit") {
		return forbiddenResponse(ctx)
	}

	validator, err := facades.Validation().Make(ctx, ctx.Request().All(), map[string]string{
		"tag_key":         "required|max_len:100",
		"tag_placeholder": "required|max_len:150",
		"label":           "required|max_len:255",
	})
	if err != nil {
		return validationError(ctx, err)
	}
	if validator.Fails() {
		return validationFailed(ctx, validator.Errors().All())
	}

	id := ctx.Request().Route("id")
	tag := buildTagFromRequest(ctx)

	if err := c.templateService.CreateTag(id, &tag); err != nil {
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Json(nethttp.StatusCreated, http.Json{
		"data": tag,
	})
}

func (c *TemplateController) UpdateTag(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("template.edit") {
		return forbiddenResponse(ctx)
	}

	id := ctx.Request().Route("id")
	tagID := ctx.Request().Route("tagId")
	data := ctx.Request().All()

	tag, err := c.templateService.UpdateTag(id, tagID, data)
	if err != nil {
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Success().Json(http.Json{
		"data": tag,
	})
}

func (c *TemplateController) DestroyTag(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("template.edit") {
		return forbiddenResponse(ctx)
	}

	id := ctx.Request().Route("id")
	tagID := ctx.Request().Route("tagId")

	if err := c.templateService.DeleteTag(id, tagID); err != nil {
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Success().Json(http.Json{
		"message": "Tag deleted successfully",
	})
}

func (c *TemplateController) BulkUpsertTags(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("template.edit") {
		return forbiddenResponse(ctx)
	}

	id := ctx.Request().Route("id")

	all := ctx.Request().All()
	tagsRaw, ok := all["tags"]
	if !ok {
		return badRequestError(ctx, "tags field is required")
	}

	rawJSON, err := json.Marshal(tagsRaw)
	if err != nil {
		return badRequestError(ctx, "invalid tags format")
	}

	var tags []models.TemplateTag
	if err := json.Unmarshal(rawJSON, &tags); err != nil {
		return badRequestError(ctx, "invalid tags format")
	}

	result, err := c.templateService.BulkUpsertTags(id, tags)
	if err != nil {
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Success().Json(http.Json{
		"data": result,
	})
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

func forbiddenResponse(ctx http.Context) http.Response {
	return ctx.Response().Json(nethttp.StatusForbidden, http.Json{
		"error": "Forbidden",
	})
}

func buildTagFromRequest(ctx http.Context) models.TemplateTag {
	tag := models.TemplateTag{
		TagKey:         ctx.Request().Input("tag_key"),
		TagPlaceholder: ctx.Request().Input("tag_placeholder"),
		Label:          ctx.Request().Input("label"),
		DataType:       "text",
		SourceType:     "static",
		ColSpan:        12,
	}

	if v := ctx.Request().Input("description"); v != "" {
		tag.Description = &v
	}
	if v := ctx.Request().Input("data_type"); v != "" {
		tag.DataType = v
	}
	if v := ctx.Request().Input("source_type"); v != "" {
		tag.SourceType = v
	}
	if v := ctx.Request().Input("source_config"); v != "" {
		tag.SourceConfig = &v
	}
	if v := ctx.Request().Input("format_pattern"); v != "" {
		tag.FormatPattern = &v
	}
	if v := ctx.Request().Input("default_value"); v != "" {
		tag.DefaultValue = &v
	}
	if v := ctx.Request().Input("placeholder_text"); v != "" {
		tag.PlaceholderText = &v
	}
	if v := ctx.Request().Input("validation_regex"); v != "" {
		tag.ValidationRegex = &v
	}
	if v := ctx.Request().Input("validation_message"); v != "" {
		tag.ValidationMessage = &v
	}
	if v := ctx.Request().Input("group_name"); v != "" {
		tag.GroupName = &v
	}
	if v := ctx.Request().Input("table_config"); v != "" {
		tag.TableConfig = &v
	}
	if v := ctx.Request().Input("signature_config"); v != "" {
		tag.SignatureConfig = &v
	}

	tag.IsRequired = ctx.Request().InputBool("is_required")
	tag.IsReadonly = ctx.Request().InputBool("is_readonly")
	tag.IsHidden = ctx.Request().InputBool("is_hidden")

	if v := ctx.Request().InputInt("group_order"); v > 0 {
		tag.GroupOrder = v
	}
	if v := ctx.Request().InputInt("field_order"); v > 0 {
		tag.FieldOrder = v
	}
	if v := ctx.Request().InputInt("col_span"); v > 0 {
		tag.ColSpan = v
	}

	return tag
}
