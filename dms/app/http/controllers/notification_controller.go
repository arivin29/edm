package controllers

import (
	nethttp "net/http"

	"github.com/goravel/framework/contracts/http"

	"dms/app/services"
	"dms/app/types"
)

type NotificationController struct {
	notificationService *services.NotificationService
}

func NewNotificationController() *NotificationController {
	return &NotificationController{
		notificationService: services.NewNotificationService(),
	}
}

// ---------------------------------------------------------------------------
// GET /notifications - List user notifications
// ---------------------------------------------------------------------------

func (c *NotificationController) Index(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil {
		return forbiddenResponse(ctx)
	}

	items, meta, err := c.notificationService.List(ctx)
	if err != nil {
		return serverError(ctx, "Failed to list notifications")
	}

	return ctx.Response().Success().Json(http.Json{
		"data": items,
		"meta": meta,
	})
}

// ---------------------------------------------------------------------------
// GET /notifications/unread-count - Get unread notification count
// ---------------------------------------------------------------------------

func (c *NotificationController) UnreadCount(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil {
		return forbiddenResponse(ctx)
	}

	count, err := c.notificationService.GetUnreadCount(ctx)
	if err != nil {
		return serverError(ctx, "Failed to get unread count")
	}

	return ctx.Response().Success().Json(http.Json{
		"data": map[string]any{
			"unread_count": count,
		},
	})
}

// ---------------------------------------------------------------------------
// POST /notifications/{id}/read - Mark notification as read
// ---------------------------------------------------------------------------

func (c *NotificationController) MarkRead(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil {
		return forbiddenResponse(ctx)
	}

	id := ctx.Request().Route("id")
	if err := c.notificationService.MarkRead(id, ctx); err != nil {
		return notFoundError(ctx, err.Error())
	}

	return ctx.Response().Success().Json(http.Json{
		"message": "Notification marked as read",
	})
}

// ---------------------------------------------------------------------------
// POST /notifications/read-all - Mark all notifications as read
// ---------------------------------------------------------------------------

func (c *NotificationController) MarkAllRead(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil {
		return forbiddenResponse(ctx)
	}

	if err := c.notificationService.MarkAllRead(ctx); err != nil {
		return serverError(ctx, "Failed to mark all as read")
	}

	return ctx.Response().Success().Json(http.Json{
		"message": "All notifications marked as read",
	})
}

// ---------------------------------------------------------------------------
// DELETE /notifications/{id} - Delete notification
// ---------------------------------------------------------------------------

func (c *NotificationController) Destroy(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil {
		return forbiddenResponse(ctx)
	}

	id := ctx.Request().Route("id")
	if err := c.notificationService.Delete(id, ctx); err != nil {
		return notFoundError(ctx, err.Error())
	}

	return ctx.Response().Json(nethttp.StatusOK, http.Json{
		"message": "Notification deleted successfully",
	})
}
