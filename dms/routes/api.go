package routes

import (
"github.com/goravel/framework/contracts/http"
"github.com/goravel/framework/contracts/route"

"dms/app/facades"
"dms/app/http/controllers"
"dms/app/http/middleware"
)

func Api() {
authController := controllers.NewAuthController()
orgController := controllers.NewOrganizationController()
auditController := controllers.NewAuditController()
userController := controllers.NewUserController()
docTypeController := controllers.NewDocumentTypeController()
settingController := controllers.NewSettingController()
templateController := controllers.NewTemplateController()
numberingController := controllers.NewNumberingController()
documentController := controllers.NewDocumentController()
workflowController := controllers.NewWorkflowController()
workflowActionController := controllers.NewWorkflowActionController()
commentController := controllers.NewCommentController()
notificationController := controllers.NewNotificationController()
onlyofficeController := controllers.NewOnlyOfficeController()
distributionController := controllers.NewDistributionController()
	attachmentController := controllers.NewAttachmentController()
	relationController := controllers.NewDocumentRelationController()

// Global CORS preflight handler - must be before other routes
facades.Route().Fallback(func(ctx http.Context) http.Response {
if ctx.Request().Method() == "OPTIONS" {
origin := ctx.Request().Header("Origin", "*")
ctx.Response().Header("Access-Control-Allow-Origin", origin)
ctx.Response().Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
ctx.Response().Header("Access-Control-Allow-Headers", "Accept, Authorization, Content-Type, X-Requested-With")
ctx.Response().Header("Access-Control-Allow-Credentials", "true")
ctx.Response().Header("Access-Control-Max-Age", "86400")
return ctx.Response().Status(http.StatusNoContent).String("")
}
return ctx.Response().Status(http.StatusNotFound).Json(http.Json{"error": "Not Found"})
})

facades.Route().Prefix("/api/v1").Middleware(middleware.Cors()).Group(func(router route.Router) {
// Public auth routes
router.Post("/auth/login", authController.Login)

// OnlyOffice callback (no auth - called by OnlyOffice server)
router.Post("/onlyoffice/callback", onlyofficeController.Callback)

// Protected auth routes
router.Middleware(middleware.Auth()).Group(func(router route.Router) {
router.Post("/auth/logout", authController.Logout)
router.Post("/auth/refresh", authController.Refresh)
router.Get("/auth/me", authController.Me)
router.Put("/auth/password", authController.ChangePassword)
})

// Organization routes (auth + data scope)
router.Middleware(middleware.Auth(), middleware.DataScope()).Group(func(router route.Router) {
// Companies
router.Middleware(middleware.RequirePermission("company.view")).Get("/companies", orgController.ListCompanies)
router.Middleware(middleware.RequirePermission("company.create")).Post("/companies", orgController.CreateCompany)
router.Middleware(middleware.RequirePermission("company.view")).Get("/companies/{id}", orgController.ShowCompany)
router.Middleware(middleware.RequirePermission("company.edit")).Put("/companies/{id}", orgController.UpdateCompany)
router.Middleware(middleware.RequirePermission("company.edit")).Delete("/companies/{id}", orgController.DeleteCompany)

// Offices
router.Middleware(middleware.RequirePermission("office.view")).Get("/offices", orgController.ListOffices)
router.Middleware(middleware.RequirePermission("office.create")).Post("/offices", orgController.CreateOffice)
router.Middleware(middleware.RequirePermission("office.view")).Get("/offices/{id}", orgController.ShowOffice)
router.Middleware(middleware.RequirePermission("office.edit")).Put("/offices/{id}", orgController.UpdateOffice)
router.Middleware(middleware.RequirePermission("office.edit")).Delete("/offices/{id}", orgController.DeleteOffice)
router.Middleware(middleware.RequirePermission("office.view")).Get("/offices/{id}/departments", orgController.ListOfficeDepartments)

// Departments
router.Middleware(middleware.RequirePermission("department.view")).Get("/departments", orgController.ListDepartments)
router.Middleware(middleware.RequirePermission("department.create")).Post("/departments", orgController.CreateDepartment)
router.Middleware(middleware.RequirePermission("department.view")).Get("/departments/{id}", orgController.ShowDepartment)
router.Middleware(middleware.RequirePermission("department.edit")).Put("/departments/{id}", orgController.UpdateDepartment)
router.Middleware(middleware.RequirePermission("department.edit")).Delete("/departments/{id}", orgController.DeleteDepartment)
router.Middleware(middleware.RequirePermission("department.view")).Get("/departments/{id}/sections", orgController.ListDepartmentSections)

// Sections
router.Middleware(middleware.RequirePermission("section.view")).Get("/sections", orgController.ListSections)
router.Middleware(middleware.RequirePermission("section.create")).Post("/sections", orgController.CreateSection)
router.Middleware(middleware.RequirePermission("section.view")).Get("/sections/{id}", orgController.ShowSection)
router.Middleware(middleware.RequirePermission("section.edit")).Put("/sections/{id}", orgController.UpdateSection)
router.Middleware(middleware.RequirePermission("section.edit")).Delete("/sections/{id}", orgController.DeleteSection)

// Positions
router.Middleware(middleware.RequirePermission("position.view")).Get("/positions", orgController.ListPositions)
router.Middleware(middleware.RequirePermission("position.create")).Post("/positions", orgController.CreatePosition)
router.Middleware(middleware.RequirePermission("position.view")).Get("/positions/{id}", orgController.ShowPosition)
router.Middleware(middleware.RequirePermission("position.edit")).Put("/positions/{id}", orgController.UpdatePosition)
router.Middleware(middleware.RequirePermission("position.edit")).Delete("/positions/{id}", orgController.DeletePosition)

// Audit logs
router.Middleware(middleware.RequirePermission("audit.view")).Get("/audit-logs", auditController.Index)

// Users
router.Middleware(middleware.RequirePermission("user.view")).Get("/users", userController.Index)
router.Middleware(middleware.RequirePermission("user.create")).Post("/users", userController.Store)
router.Middleware(middleware.RequirePermission("user.view")).Get("/users/{id}", userController.Show)
router.Middleware(middleware.RequirePermission("user.edit")).Put("/users/{id}", userController.Update)
router.Middleware(middleware.RequirePermission("user.delete")).Delete("/users/{id}", userController.Delete)
router.Post("/users/{id}/signature", userController.UploadSignature)
router.Delete("/users/{id}/signature", userController.DeleteSignature)
router.Post("/users/{id}/avatar", userController.UploadAvatar)
router.Middleware(middleware.RequirePermission("user.assign_role")).Put("/users/{id}/roles", userController.AssignRoles)

// Roles & Permissions
router.Middleware(middleware.RequirePermission("user.view")).Get("/roles", userController.ListRoles)
router.Middleware(middleware.RequirePermission("user.view")).Get("/roles/{id}", userController.ShowRole)
router.Middleware(middleware.RequirePermission("user.view")).Get("/permissions", userController.ListPermissions)

// Document Types
router.Middleware(middleware.RequirePermission("document.view")).Get("/document-types", docTypeController.ListTypes)
router.Middleware(middleware.RequirePermission("template.create")).Post("/document-types", docTypeController.CreateType)
router.Middleware(middleware.RequirePermission("document.view")).Get("/document-types/{id}", docTypeController.ShowType)
router.Middleware(middleware.RequirePermission("template.edit")).Put("/document-types/{id}", docTypeController.UpdateType)

// Document Categories
router.Middleware(middleware.RequirePermission("document.view")).Get("/categories", docTypeController.ListCategories)
router.Middleware(middleware.RequirePermission("template.create")).Post("/categories", docTypeController.CreateCategory)
router.Middleware(middleware.RequirePermission("document.view")).Get("/categories/{id}", docTypeController.ShowCategory)
router.Middleware(middleware.RequirePermission("template.edit")).Put("/categories/{id}", docTypeController.UpdateCategory)
router.Middleware(middleware.RequirePermission("template.delete")).Delete("/categories/{id}", docTypeController.DeleteCategory)

// System Settings
router.Middleware(middleware.RequirePermission("setting.view")).Get("/settings", settingController.List)
router.Middleware(middleware.RequirePermission("setting.view")).Get("/settings/{key}", settingController.GetByKey)
router.Middleware(middleware.RequirePermission("setting.edit")).Put("/settings", settingController.Upsert)
router.Middleware(middleware.RequirePermission("setting.edit")).Delete("/settings/{id}", settingController.Delete)

// Document Templates
router.Middleware(middleware.RequirePermission("template.view")).Get("/templates", templateController.Index)
router.Middleware(middleware.RequirePermission("template.create")).Post("/templates", templateController.Store)
router.Middleware(middleware.RequirePermission("template.view")).Get("/templates/{id}", templateController.Show)
router.Middleware(middleware.RequirePermission("template.edit")).Put("/templates/{id}", templateController.Update)
router.Middleware(middleware.RequirePermission("template.delete")).Delete("/templates/{id}", templateController.Destroy)
router.Middleware(middleware.RequirePermission("template.edit")).Post("/templates/{id}/upload", templateController.Upload)
router.Middleware(middleware.RequirePermission("template.view")).Get("/templates/{id}/download", templateController.Download)

// Template Tags
router.Middleware(middleware.RequirePermission("template.view")).Get("/templates/{id}/tags", templateController.ListTags)
router.Middleware(middleware.RequirePermission("template.edit")).Post("/templates/{id}/tags", templateController.StoreTag)
router.Middleware(middleware.RequirePermission("template.edit")).Put("/templates/{id}/tags/{tagId}", templateController.UpdateTag)
router.Middleware(middleware.RequirePermission("template.edit")).Delete("/templates/{id}/tags/{tagId}", templateController.DestroyTag)
router.Middleware(middleware.RequirePermission("template.edit")).Post("/templates/{id}/tags/bulk", templateController.BulkUpsertTags)

// Document Numbering
router.Middleware(middleware.RequirePermission("template.view")).Get("/numbering", numberingController.List)
router.Middleware(middleware.RequirePermission("template.view")).Get("/numbering/preview", numberingController.Preview)
router.Middleware(middleware.RequirePermission("template.create")).Post("/numbering", numberingController.Create)
router.Middleware(middleware.RequirePermission("template.view")).Get("/numbering/{id}", numberingController.Show)
router.Middleware(middleware.RequirePermission("template.edit")).Put("/numbering/{id}", numberingController.Update)
router.Middleware(middleware.RequirePermission("template.delete")).Delete("/numbering/{id}", numberingController.Delete)

// Documents
router.Middleware(middleware.RequirePermission("document.view")).Get("/documents", documentController.Index)
router.Middleware(middleware.RequirePermission("document.create")).Post("/documents", documentController.Store)
router.Middleware(middleware.RequirePermission("document.view")).Get("/documents/{id}", documentController.Show)
router.Middleware(middleware.RequirePermission("document.edit")).Put("/documents/{id}", documentController.Update)
router.Middleware(middleware.RequirePermission("document.delete")).Delete("/documents/{id}", documentController.Destroy)
router.Middleware(middleware.RequirePermission("document.view")).Get("/documents/{id}/versions", documentController.ListVersions)
router.Middleware(middleware.RequirePermission("document.edit")).Post("/documents/{id}/versions", documentController.CreateVersion)
router.Middleware(middleware.RequirePermission("document.view")).Get("/documents/{id}/versions/{ver}", documentController.ShowVersion)
router.Middleware(middleware.RequirePermission("document.download")).Get("/documents/{id}/versions/{ver}/download", documentController.DownloadVersion)
router.Middleware(middleware.RequirePermission("document.edit")).Post("/documents/{id}/versions/{ver}/restore", documentController.RestoreVersion)
router.Middleware(middleware.RequirePermission("document.download")).Get("/documents/{id}/download", documentController.Download)
router.Middleware(middleware.RequirePermission("document.view")).Get("/documents/{id}/preview", documentController.Preview)
router.Middleware(middleware.RequirePermission("document.view")).Get("/documents/{id}/editor-config", onlyofficeController.GetConfig)

// Watermark Configuration
router.Get("/watermark/config", documentController.GetWatermarkConfig)
router.Middleware(middleware.RequirePermission("setting.edit")).Put("/watermark/config", documentController.UpdateWatermarkConfig)

// Document Attachments
router.Middleware(middleware.RequirePermission("document.view")).Get("/documents/{id}/attachments", attachmentController.ListAttachments)
router.Middleware(middleware.RequirePermission("document.create")).Post("/documents/{id}/attachments", attachmentController.UploadAttachment)
router.Middleware(middleware.RequirePermission("document.view")).Get("/documents/{id}/attachments/{attachmentId}/download", attachmentController.DownloadAttachment)
router.Middleware(middleware.RequirePermission("document.delete")).Delete("/documents/{id}/attachments/{attachmentId}", attachmentController.DeleteAttachment)

// Document Comments
router.Middleware(middleware.RequirePermission("document.view")).Get("/documents/{id}/comments", commentController.Index)
router.Middleware(middleware.RequirePermission("document.view")).Post("/documents/{id}/comments", commentController.Store)
router.Middleware(middleware.RequirePermission("document.view")).Put("/documents/{id}/comments/{commentId}", commentController.Update)
router.Middleware(middleware.RequirePermission("document.view")).Delete("/documents/{id}/comments/{commentId}", commentController.Destroy)
router.Middleware(middleware.RequirePermission("document.review")).Post("/documents/{id}/comments/{commentId}/resolve", commentController.Resolve)
router.Middleware(middleware.RequirePermission("document.review")).Post("/documents/{id}/comments/{commentId}/unresolve", commentController.Unresolve)

// Document Relations
router.Middleware(middleware.RequirePermission("document.view")).Get("/documents/{id}/relations", relationController.Index)
router.Middleware(middleware.RequirePermission("document.create")).Post("/documents/{id}/relations", relationController.Store)
router.Middleware(middleware.RequirePermission("document.delete")).Delete("/documents/{id}/relations/{relationId}", relationController.Destroy)

// Workflows
router.Middleware(middleware.RequirePermission("workflow.view")).Get("/workflows", workflowController.Index)
router.Middleware(middleware.RequirePermission("workflow.create")).Post("/workflows", workflowController.Store)
router.Middleware(middleware.RequirePermission("workflow.view")).Get("/workflows/{id}", workflowController.Show)
router.Middleware(middleware.RequirePermission("workflow.edit")).Put("/workflows/{id}", workflowController.Update)
router.Middleware(middleware.RequirePermission("workflow.delete")).Delete("/workflows/{id}", workflowController.Destroy)
router.Middleware(middleware.RequirePermission("workflow.view")).Get("/workflows/{id}/steps", workflowController.ListSteps)
router.Middleware(middleware.RequirePermission("workflow.edit")).Post("/workflows/{id}/steps", workflowController.StoreStep)
router.Middleware(middleware.RequirePermission("workflow.edit")).Put("/workflows/{id}/steps/{stepId}", workflowController.UpdateStep)
router.Middleware(middleware.RequirePermission("workflow.edit")).Delete("/workflows/{id}/steps/{stepId}", workflowController.DestroyStep)
router.Middleware(middleware.RequirePermission("workflow.edit")).Put("/workflows/{id}/steps/reorder", workflowController.ReorderSteps)

// Workflow Actions (document workflow operations)
router.Middleware(middleware.RequirePermission("document.submit")).Post("/documents/{id}/submit", workflowActionController.Submit)
router.Middleware(middleware.RequirePermission("document.approve")).Post("/documents/{id}/approve", workflowActionController.Approve)
router.Middleware(middleware.RequirePermission("document.reject")).Post("/documents/{id}/reject", workflowActionController.Reject)
router.Middleware(middleware.RequirePermission("document.view")).Post("/documents/{id}/delegate", workflowActionController.Delegate)
router.Middleware(middleware.RequirePermission("document.view")).Get("/documents/{id}/workflow", workflowActionController.GetWorkflowStatus)
router.Middleware(middleware.RequirePermission("document.view")).Post("/documents/{id}/workflow/comment", workflowActionController.AddComment)
router.Get("/workflow/pending-tasks", workflowActionController.GetPendingTasks)
router.Get("/workflow/preview", workflowActionController.PreviewWorkflow)

// Notifications (no specific permission - users see their own)
router.Get("/notifications", notificationController.Index)
router.Get("/notifications/unread-count", notificationController.UnreadCount)
router.Post("/notifications/{id}/read", notificationController.MarkRead)
router.Post("/notifications/read-all", notificationController.MarkAllRead)
router.Delete("/notifications/{id}", notificationController.Destroy)

// Document Distributions
router.Middleware(middleware.RequirePermission("document.distribute")).Get("/documents/{id}/distributions", distributionController.Index)
router.Middleware(middleware.RequirePermission("document.distribute")).Post("/documents/{id}/distributions", distributionController.Store)
router.Middleware(middleware.RequirePermission("document.distribute")).Post("/documents/{id}/distributions/bulk", distributionController.BulkDistribute)
router.Middleware(middleware.RequirePermission("document.view")).Get("/distributions/{id}", distributionController.Show)
router.Middleware(middleware.RequirePermission("document.distribute")).Put("/distributions/{id}/distribute", distributionController.MarkDistributed)
router.Middleware(middleware.RequirePermission("document.view")).Post("/distributions/{id}/acknowledge", distributionController.Acknowledge)
router.Middleware(middleware.RequirePermission("document.distribute")).Delete("/distributions/{id}", distributionController.Cancel)
router.Get("/distributions/inbox", distributionController.Inbox)
})
})

// Swagger UI & OpenAPI spec (public)
facades.Route().Get("/swagger", func(ctx http.Context) http.Response {
return ctx.Response().File("public/swagger/index.html")
})
facades.Route().Get("/api/v1/docs/openapi.json", func(ctx http.Context) http.Response {
return ctx.Response().File("docs/openapi.json")
})
}
