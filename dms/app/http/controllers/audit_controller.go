package controllers

import (
	"math"
	"strconv"

	"github.com/goravel/framework/contracts/http"

	"dms/app/services"
)

type AuditController struct {
	auditService services.AuditService
}

func NewAuditController() *AuditController {
	return &AuditController{
		auditService: services.NewAuditService(),
	}
}

func (c *AuditController) Index(ctx http.Context) http.Response {
	filters := make(map[string]any)

	// String filters
	for _, key := range []string{"user_id", "office_id", "action", "entity_type", "entity_id", "date_from", "date_to", "sort_by", "sort_dir"} {
		if v := ctx.Request().Query(key, ""); v != "" {
			filters[key] = v
		}
	}

	// Pagination
	if v := ctx.Request().Query("page", ""); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			filters["page"] = n
		}
	}
	if v := ctx.Request().Query("per_page", ""); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			filters["per_page"] = n
		}
	}

	// Scope from context (set by DataScope middleware)
	if v, ok := ctx.Value("scope_company_ids").([]string); ok {
		filters["scope_company_ids"] = v
	}
	if v, ok := ctx.Value("scope_office_ids").([]string); ok {
		filters["scope_office_ids"] = v
	}

	logs, total, err := c.auditService.List(filters)
	if err != nil {
		return ctx.Response().Json(http.StatusInternalServerError, http.Json{
			"error": "Failed to fetch audit logs",
		})
	}

	page := 1
	if v, ok := filters["page"].(int); ok {
		page = v
	}
	perPage := 50
	if v, ok := filters["per_page"].(int); ok {
		perPage = v
	}
	totalPages := int(math.Ceil(float64(total) / float64(perPage)))

	return ctx.Response().Success().Json(http.Json{
		"data": logs,
		"meta": http.Json{
			"page":        page,
			"per_page":    perPage,
			"total":       total,
			"total_pages": totalPages,
		},
	})
}
