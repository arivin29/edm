package controllers

import (
	"encoding/json"
	nethttp "net/http"

	"github.com/goravel/framework/contracts/http"

	"dms/app/facades"
	"dms/app/services"
	"dms/app/types"
)

type WorkflowController struct {
	workflowService *services.WorkflowService
}

func NewWorkflowController() *WorkflowController {
	return &WorkflowController{
		workflowService: services.NewWorkflowService(),
	}
}

// ---------------------------------------------------------------------------
// Workflow CRUD
// ---------------------------------------------------------------------------

func (c *WorkflowController) Index(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("workflow.view") {
		return forbiddenResponse(ctx)
	}

	items, meta, err := c.workflowService.List(ctx)
	if err != nil {
		return serverError(ctx, "Failed to list workflows")
	}

	return ctx.Response().Success().Json(http.Json{
		"data": items,
		"meta": meta,
	})
}

func (c *WorkflowController) Store(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("workflow.create") {
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

	w, err := c.workflowService.Create(ctx)
	if err != nil {
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Json(nethttp.StatusCreated, http.Json{
		"data": w,
	})
}

func (c *WorkflowController) Show(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("workflow.view") {
		return forbiddenResponse(ctx)
	}

	id := ctx.Request().Route("id")
	w, err := c.workflowService.Show(id)
	if err != nil {
		return serverError(ctx, "Failed to get workflow")
	}
	if w == nil {
		return notFoundError(ctx, "Workflow not found")
	}

	return ctx.Response().Success().Json(http.Json{
		"data": w,
	})
}

func (c *WorkflowController) Update(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("workflow.edit") {
		return forbiddenResponse(ctx)
	}

	id := ctx.Request().Route("id")
	w, err := c.workflowService.Update(id, ctx)
	if err != nil {
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Success().Json(http.Json{
		"data": w,
	})
}

func (c *WorkflowController) Destroy(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("workflow.delete") {
		return forbiddenResponse(ctx)
	}

	id := ctx.Request().Route("id")
	if err := c.workflowService.Delete(id); err != nil {
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Success().Json(http.Json{
		"message": "Workflow deleted successfully",
	})
}

// ---------------------------------------------------------------------------
// Workflow Steps
// ---------------------------------------------------------------------------

func (c *WorkflowController) ListSteps(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("workflow.view") {
		return forbiddenResponse(ctx)
	}

	id := ctx.Request().Route("id")
	steps, err := c.workflowService.ListSteps(id)
	if err != nil {
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Success().Json(http.Json{
		"data": steps,
	})
}

func (c *WorkflowController) StoreStep(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("workflow.edit") {
		return forbiddenResponse(ctx)
	}

	validator, err := facades.Validation().Make(ctx, ctx.Request().All(), map[string]string{
		"name":          "required|max_len:255",
		"step_type":     "required|max_len:50",
		"assignee_type": "required|max_len:50",
	})
	if err != nil {
		return validationError(ctx, err)
	}
	if validator.Fails() {
		return validationFailed(ctx, validator.Errors().All())
	}

	id := ctx.Request().Route("id")
	step, err := c.workflowService.CreateStep(id, ctx)
	if err != nil {
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Json(nethttp.StatusCreated, http.Json{
		"data": step,
	})
}

func (c *WorkflowController) UpdateStep(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("workflow.edit") {
		return forbiddenResponse(ctx)
	}

	id := ctx.Request().Route("id")
	stepID := ctx.Request().Route("stepId")

	step, err := c.workflowService.UpdateStep(id, stepID, ctx)
	if err != nil {
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Success().Json(http.Json{
		"data": step,
	})
}

func (c *WorkflowController) DestroyStep(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("workflow.edit") {
		return forbiddenResponse(ctx)
	}

	id := ctx.Request().Route("id")
	stepID := ctx.Request().Route("stepId")

	if err := c.workflowService.DeleteStep(id, stepID); err != nil {
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Success().Json(http.Json{
		"message": "Step deleted successfully",
	})
}

func (c *WorkflowController) ReorderSteps(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("workflow.edit") {
		return forbiddenResponse(ctx)
	}

	id := ctx.Request().Route("id")

	all := ctx.Request().All()
	stepsRaw, ok := all["steps"]
	if !ok {
		return badRequestError(ctx, "steps field is required")
	}

	rawJSON, err := json.Marshal(stepsRaw)
	if err != nil {
		return badRequestError(ctx, "invalid steps format")
	}

	var stepIDs []string
	if err := json.Unmarshal(rawJSON, &stepIDs); err != nil {
		return badRequestError(ctx, "invalid steps format - expected array of step IDs")
	}

	if err := c.workflowService.ReorderSteps(id, stepIDs); err != nil {
		return badRequestError(ctx, err.Error())
	}

	// Return updated steps list
	steps, err := c.workflowService.ListSteps(id)
	if err != nil {
		return serverError(ctx, "Steps reordered but failed to retrieve updated list")
	}

	return ctx.Response().Success().Json(http.Json{
		"data":    steps,
		"message": "Steps reordered successfully",
	})
}
