package middleware

import (
	"fmt"
	"strings"

	"github.com/goravel/framework/contracts/http"

	"dms/app/types"
)

// RequirePermission checks that the user has a specific permission.
func RequirePermission(permission string) http.Middleware {
	return func(ctx http.Context) {
		user := types.GetCurrentUser(ctx)
		if user == nil {
			ctx.Request().AbortWithStatusJson(http.StatusUnauthorized, http.Json{
				"error": "Unauthorized",
			})
			return
		}

		if !user.HasPermission(permission) {
			ctx.Request().AbortWithStatusJson(http.StatusForbidden, http.Json{
				"error": fmt.Sprintf("Insufficient permission: %s", permission),
			})
			return
		}

		ctx.Request().Next()
	}
}

// RequireAny checks that the user has at least one of the given permissions.
func RequireAny(permissions ...string) http.Middleware {
	return func(ctx http.Context) {
		user := types.GetCurrentUser(ctx)
		if user == nil {
			ctx.Request().AbortWithStatusJson(http.StatusUnauthorized, http.Json{
				"error": "Unauthorized",
			})
			return
		}

		if !user.HasAnyPermission(permissions...) {
			ctx.Request().AbortWithStatusJson(http.StatusForbidden, http.Json{
				"error": fmt.Sprintf("Insufficient permission: requires any of [%s]", strings.Join(permissions, ", ")),
			})
			return
		}

		ctx.Request().Next()
	}
}

// RequireAll checks that the user has all of the given permissions.
func RequireAll(permissions ...string) http.Middleware {
	return func(ctx http.Context) {
		user := types.GetCurrentUser(ctx)
		if user == nil {
			ctx.Request().AbortWithStatusJson(http.StatusUnauthorized, http.Json{
				"error": "Unauthorized",
			})
			return
		}

		if !user.HasAllPermissions(permissions...) {
			missing := make([]string, 0)
			for _, p := range permissions {
				if !user.HasPermission(p) {
					missing = append(missing, p)
				}
			}
			ctx.Request().AbortWithStatusJson(http.StatusForbidden, http.Json{
				"error": fmt.Sprintf("Insufficient permission: missing [%s]", strings.Join(missing, ", ")),
			})
			return
		}

		ctx.Request().Next()
	}
}
