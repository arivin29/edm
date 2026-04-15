package controllers

import (
	nethttp "net/http"

	"github.com/goravel/framework/contracts/http"

	"dms/app/services"
	"dms/app/types"
)

type DistributionController struct {
	distributionService *services.DistributionService
}

func NewDistributionController() *DistributionController {
	return &DistributionController{
		distributionService: services.NewDistributionService(),
	}
}

// Index lists distributions for a document
// GET /documents/{id}/distributions
func (c *DistributionController) Index(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("document.distribute") {
		return forbiddenResponse(ctx)
	}

	documentID := ctx.Request().Route("id")
	items, meta, err := c.distributionService.List(documentID, ctx)
	if err != nil {
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Success().Json(http.Json{
		"data": items,
		"meta": meta,
	})
}

// Store creates a single distribution
// POST /documents/{id}/distributions
func (c *DistributionController) Store(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("document.distribute") {
		return forbiddenResponse(ctx)
	}

	documentID := ctx.Request().Route("id")
	dist, err := c.distributionService.Create(documentID, ctx)
	if err != nil {
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Json(nethttp.StatusCreated, http.Json{
		"data": dist,
	})
}

// BulkDistribute distributes a document to multiple recipients
// POST /documents/{id}/distributions/bulk
func (c *DistributionController) BulkDistribute(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("document.distribute") {
		return forbiddenResponse(ctx)
	}

	documentID := ctx.Request().Route("id")
	dists, err := c.distributionService.BulkDistribute(documentID, ctx)
	if err != nil {
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Json(nethttp.StatusCreated, http.Json{
		"data":    dists,
		"message": "Document distributed successfully",
	})
}

// Show returns a single distribution
// GET /distributions/{id}
func (c *DistributionController) Show(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("document.view") {
		return forbiddenResponse(ctx)
	}

	id := ctx.Request().Route("id")
	dist, err := c.distributionService.GetByID(id)
	if err != nil {
		return notFoundError(ctx, err.Error())
	}

	return ctx.Response().Success().Json(http.Json{
		"data": dist,
	})
}

// MarkDistributed marks a distribution as distributed
// PUT /distributions/{id}/distribute
func (c *DistributionController) MarkDistributed(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("document.distribute") {
		return forbiddenResponse(ctx)
	}

	id := ctx.Request().Route("id")
	dist, err := c.distributionService.MarkDistributed(id, ctx)
	if err != nil {
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Success().Json(http.Json{
		"data":    dist,
		"message": "Distribution marked as distributed",
	})
}

// Acknowledge records an acknowledgement for a distribution
// POST /distributions/{id}/acknowledge
func (c *DistributionController) Acknowledge(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("document.view") {
		return forbiddenResponse(ctx)
	}

	id := ctx.Request().Route("id")
	ack, err := c.distributionService.Acknowledge(id, ctx)
	if err != nil {
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Success().Json(http.Json{
		"data":    ack,
		"message": "Distribution acknowledged successfully",
	})
}

// Cancel cancels a pending distribution
// DELETE /distributions/{id}
func (c *DistributionController) Cancel(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("document.distribute") {
		return forbiddenResponse(ctx)
	}

	id := ctx.Request().Route("id")
	if err := c.distributionService.Cancel(id, ctx); err != nil {
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Success().Json(http.Json{
		"message": "Distribution cancelled successfully",
	})
}

// Inbox returns distributions for the current user
// GET /distributions/inbox
func (c *DistributionController) Inbox(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil {
		return forbiddenResponse(ctx)
	}

	items, meta, err := c.distributionService.GetMyDistributions(ctx)
	if err != nil {
		return serverError(ctx, "Failed to get distributions")
	}

	return ctx.Response().Success().Json(http.Json{
		"data": items,
		"meta": meta,
	})
}
