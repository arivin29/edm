package controllers

import (
	nethttp "net/http"

	"github.com/goravel/framework/contracts/http"

	"dms/app/services"
	"dms/app/types"
)

type WorkflowActionController struct {
	actionService *services.WorkflowActionService
}

func NewWorkflowActionController() *WorkflowActionController {
	return &WorkflowActionController{
		actionService: services.NewWorkflowActionService(),
	}
}

// ---------------------------------------------------------------------------
// POST /documents/{id}/submit - Submit document for workflow review
// ---------------------------------------------------------------------------

func (c *WorkflowActionController) Submit(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("document.submit") {
		return forbiddenResponse(ctx)
	}

	id := ctx.Request().Route("id")
	instance, err := c.actionService.Submit(id, ctx)
	if err != nil {
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Json(nethttp.StatusCreated, http.Json{
		"data":    instance,
		"message": "Document submitted for review",
	})
}

// ---------------------------------------------------------------------------
// POST /documents/{id}/approve - Approve current workflow step
// ---------------------------------------------------------------------------

func (c *WorkflowActionController) Approve(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("document.approve") {
		return forbiddenResponse(ctx)
	}

	id := ctx.Request().Route("id")
	stepInstance, err := c.actionService.ProcessAction(id, "approve", ctx)
	if err != nil {
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Success().Json(http.Json{
		"data":    stepInstance,
		"message": "Step approved successfully",
	})
}

// ---------------------------------------------------------------------------
// POST /documents/{id}/reject - Reject current workflow step
// ---------------------------------------------------------------------------

func (c *WorkflowActionController) Reject(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("document.reject") {
		return forbiddenResponse(ctx)
	}

	id := ctx.Request().Route("id")
	stepInstance, err := c.actionService.ProcessAction(id, "reject", ctx)
	if err != nil {
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Success().Json(http.Json{
		"data":    stepInstance,
		"message": "Step rejected",
	})
}

// ---------------------------------------------------------------------------
// POST /documents/{id}/delegate - Delegate current step to another user
// ---------------------------------------------------------------------------

func (c *WorkflowActionController) Delegate(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("document.view") {
		return forbiddenResponse(ctx)
	}

	id := ctx.Request().Route("id")
	delegation, err := c.actionService.Delegate(id, ctx)
	if err != nil {
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Json(nethttp.StatusCreated, http.Json{
		"data":    delegation,
		"message": "Step delegated successfully",
	})
}

// ---------------------------------------------------------------------------
// GET /documents/{id}/workflow - Get workflow status for document
// ---------------------------------------------------------------------------

func (c *WorkflowActionController) GetWorkflowStatus(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("document.view") {
		return forbiddenResponse(ctx)
	}

	id := ctx.Request().Route("id")
	status, err := c.actionService.GetWorkflowStatus(id, ctx)
	if err != nil {
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Success().Json(http.Json{
		"data": status,
	})
}

// ---------------------------------------------------------------------------
// GET /workflow/pending-tasks - Get pending approval tasks for current user
// ---------------------------------------------------------------------------

func (c *WorkflowActionController) GetPendingTasks(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil {
		return forbiddenResponse(ctx)
	}

	tasks, err := c.actionService.GetPendingTasks(ctx)
	if err != nil {
		return serverError(ctx, "Failed to get pending tasks")
	}

	return ctx.Response().Success().Json(http.Json{
		"data": tasks,
	})
}

// ---------------------------------------------------------------------------
// GET /workflow/preview?document_type_id=X&category_id=Y&office_id=Z&department_id=W
// Preview which workflow will be used (for document create form)
// ---------------------------------------------------------------------------

func (c *WorkflowActionController) PreviewWorkflow(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil {
		return forbiddenResponse(ctx)
	}

	documentTypeID := ctx.Request().Query("document_type_id", "")
	if documentTypeID == "" {
		return badRequestError(ctx, "document_type_id is required")
	}

	categoryID := ctx.Request().Query("category_id", "")
	officeID := ctx.Request().Query("office_id", "")
	departmentID := ctx.Request().Query("department_id", "")

	preview, err := c.actionService.PreviewWorkflowForCreate(
		user.CompanyID, documentTypeID, categoryID, officeID, departmentID,
	)
	if err != nil {
		return serverError(ctx, "Failed to preview workflow")
	}

	return ctx.Response().Success().Json(http.Json{
		"data": preview,
	})
}

// ---------------------------------------------------------------------------
// POST /documents/{id}/comment - Add comment to current workflow step
// ---------------------------------------------------------------------------

func (c *WorkflowActionController) AddComment(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("document.view") {
		return forbiddenResponse(ctx)
	}

	id := ctx.Request().Route("id")
	action, err := c.actionService.AddComment(id, ctx)
	if err != nil {
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Json(nethttp.StatusCreated, http.Json{
		"data":    action,
		"message": "Comment added successfully",
	})
}
