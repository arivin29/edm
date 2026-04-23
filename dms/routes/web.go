package routes

import (
	"github.com/goravel/framework/contracts/http"

	"dms/app/facades"
)

func Web() {
	facades.Route().Get("/", func(ctx http.Context) http.Response {
		return ctx.Response().Redirect(http.StatusFound, "https://dms-devetek.web.app")
	})
}
