package controllers

import (
	nethttp "net/http"
	"strconv"

	"github.com/goravel/framework/contracts/http"

	"dms/app/services"
	"dms/app/types"
)

type SearchController struct {
	searchService *services.SearchService
}

func NewSearchController() *SearchController {
	return &SearchController{searchService: services.NewSearchService()}
}

// GET /search?q=xxx&limit=5
func (c *SearchController) GlobalSearch(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil {
		return ctx.Response().Status(nethttp.StatusUnauthorized).Json(http.Json{"error": "Unauthorized"})
	}

	query := ctx.Request().Query("q", "")
	limitStr := ctx.Request().Query("limit", "5")
	limit, _ := strconv.Atoi(limitStr)
	if limit <= 0 || limit > 20 {
		limit = 5
	}

	result, err := c.searchService.GlobalSearch(query, limit)
	if err != nil {
		return ctx.Response().Status(nethttp.StatusInternalServerError).Json(http.Json{"error": err.Error()})
	}

	return ctx.Response().Status(nethttp.StatusOK).Json(http.Json{"data": result})
}
