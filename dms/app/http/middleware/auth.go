package middleware

import (
	"strings"

	"github.com/goravel/framework/contracts/http"

	"dms/app/facades"
	"dms/app/repositories"
	"dms/app/types"
)

func Auth() http.Middleware {
	return func(ctx http.Context) {
		authHeader := ctx.Request().Header("Authorization")
		token := strings.TrimPrefix(authHeader, "Bearer ")
		if token == "" || token == authHeader {
			ctx.Request().AbortWithStatusJson(http.StatusUnauthorized, http.Json{
				"error": "Unauthorized",
			})
			return
		}

		if _, err := facades.Auth(ctx).Parse(token); err != nil {
			ctx.Request().AbortWithStatusJson(http.StatusUnauthorized, http.Json{
				"error": "Unauthorized",
			})
			return
		}

		userID, err := facades.Auth(ctx).ID()
		if err != nil || userID == "" {
			ctx.Request().AbortWithStatusJson(http.StatusUnauthorized, http.Json{
				"error": "Unauthorized",
			})
			return
		}

		rbacRepo := repositories.NewRBACRepository()
		userCtx, err := rbacRepo.LoadUserContext(userID)
		if err != nil {
			ctx.Request().AbortWithStatusJson(http.StatusUnauthorized, http.Json{
				"error": "Unauthorized",
			})
			return
		}

		ctx.WithValue(types.CurrentUserKey, userCtx)

		ctx.Request().Next()
	}
}
