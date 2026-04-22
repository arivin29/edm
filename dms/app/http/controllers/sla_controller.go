package controllers

import (
	"github.com/goravel/framework/contracts/http"

	"dms/app/services"
	"dms/app/types"
)

type SLAController struct {
	slaService *services.SLAService
}

func NewSLAController() *SLAController {
	return &SLAController{
		slaService: services.NewSLAService(),
	}
}

// Dashboard returns SLA statistics
// GET /sla/dashboard
func (c *SLAController) Dashboard(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil {
		return forbiddenResponse(ctx)
	}

	stats, err := c.slaService.GetDashboardStats()
	if err != nil {
		return serverError(ctx, "Failed to get SLA stats")
	}

	return ctx.Response().Success().Json(http.Json{
		"data": stats,
	})
}

// Breached returns list of SLA-breached and at-risk steps
// GET /sla/breached
func (c *SLAController) Breached(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil {
		return forbiddenResponse(ctx)
	}

	includeAtRisk := ctx.Request().Query("include_at_risk", "true") == "true"

	items, err := c.slaService.GetBreachedSteps(includeAtRisk)
	if err != nil {
		return serverError(ctx, "Failed to get breached steps")
	}

	return ctx.Response().Success().Json(http.Json{
		"data": items,
	})
}
