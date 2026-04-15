package middleware

import (
	"github.com/goravel/framework/contracts/http"
)

// Cors middleware handles Cross-Origin Resource Sharing
func Cors() http.Middleware {
	return func(ctx http.Context) {
		origin := ctx.Request().Header("Origin", "*")
		
		// Set CORS headers for all requests
		ctx.Response().Header("Access-Control-Allow-Origin", origin)
		ctx.Response().Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		ctx.Response().Header("Access-Control-Allow-Headers", "Accept, Authorization, Content-Type, X-Requested-With")
		ctx.Response().Header("Access-Control-Allow-Credentials", "true")
		ctx.Response().Header("Access-Control-Max-Age", "86400")
		ctx.Response().Header("Access-Control-Expose-Headers", "Authorization")

		// Handle preflight OPTIONS request - respond immediately
		if ctx.Request().Method() == "OPTIONS" {
			ctx.Response().Header("Content-Length", "0")
			ctx.Request().AbortWithStatus(http.StatusNoContent)
			return
		}

		ctx.Request().Next()
	}
}
