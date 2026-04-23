package routes

import (
	"github.com/goravel/framework/contracts/http"

	"dms/app/facades"
	"dms/app/http/controllers"
)

func Web() {
	onlyofficeController := controllers.NewOnlyOfficeController()

	facades.Route().Get("/", func(ctx http.Context) http.Response {
		return ctx.Response().Redirect(http.StatusFound, "https://dms-devetek.web.app")
	})

	// OnlyOffice file download (outside /api/v1 to avoid Gin routing issues)
	facades.Route().Get("/dl/{key}", onlyofficeController.Download)
}
