package services

import (
	"encoding/json"
	"errors"
	"math"

	"github.com/goravel/framework/contracts/http"

	"dms/app/models"
	"dms/app/repositories"
	"dms/app/types"
)

// Notification types constants
const (
	NotifTypeWorkflowAssigned   = "workflow_assigned"   // You have a document pending review
	NotifTypeWorkflowApproved   = "workflow_approved"   // Document approved at step X
	NotifTypeWorkflowRejected   = "workflow_rejected"   // Document rejected
	NotifTypeDocumentCommented  = "document_commented"  // New comment on document
	NotifTypeDocumentMentioned  = "document_mentioned"  // You were mentioned in a comment
	NotifTypeDeadlineReminder   = "deadline_reminder"   // Document deadline approaching
)

type NotificationService struct {
	repo repositories.NotificationRepository
}

func NewNotificationService() *NotificationService {
	return &NotificationService{
		repo: repositories.NewNotificationRepository(),
	}
}

// Send creates a new notification for a user
// This is the public API used by other services to create notifications
func (s *NotificationService) Send(userID, notifType, title string, message *string, documentID *string, data map[string]any) error {
	if userID == "" {
		return errors.New("user_id is required")
	}
	if notifType == "" {
		return errors.New("notification type is required")
	}
	if title == "" {
		return errors.New("title is required")
	}

	notification := &models.Notification{
		UserID:     userID,
		Type:       notifType,
		Title:      title,
		Message:    message,
		DocumentID: documentID,
		IsRead:     false,
	}

	// Serialize data to JSON string if provided
	if data != nil && len(data) > 0 {
		dataBytes, err := json.Marshal(data)
		if err != nil {
			return errors.New("failed to serialize notification data")
		}
		dataStr := string(dataBytes)
		notification.Data = &dataStr
	}

	return s.repo.Create(notification)
}

// List returns notifications for the current user
func (s *NotificationService) List(ctx http.Context) ([]models.Notification, map[string]any, error) {
	user := types.GetCurrentUser(ctx)
	if user == nil {
		return nil, nil, errors.New("unauthorized")
	}

	filters := s.buildFilters(ctx, []string{
		"is_read", "type", "sort_by", "sort_dir",
	})

	items, total, err := s.repo.List(user.ID, filters)
	if err != nil {
		return nil, nil, err
	}

	return items, s.paginationMeta(filters, total), nil
}

// MarkRead marks a single notification as read
func (s *NotificationService) MarkRead(id string, ctx http.Context) error {
	user := types.GetCurrentUser(ctx)
	if user == nil {
		return errors.New("unauthorized")
	}

	notification, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}
	if notification == nil {
		return errors.New("notification not found")
	}

	// Ensure user owns the notification
	if notification.UserID != user.ID {
		return errors.New("notification not found")
	}

	return s.repo.MarkRead(id)
}

// MarkAllRead marks all notifications as read for the current user
func (s *NotificationService) MarkAllRead(ctx http.Context) error {
	user := types.GetCurrentUser(ctx)
	if user == nil {
		return errors.New("unauthorized")
	}

	return s.repo.MarkAllRead(user.ID)
}

// GetUnreadCount returns the count of unread notifications for the current user
func (s *NotificationService) GetUnreadCount(ctx http.Context) (int64, error) {
	user := types.GetCurrentUser(ctx)
	if user == nil {
		return 0, errors.New("unauthorized")
	}

	return s.repo.CountUnread(user.ID)
}

// Delete removes a notification
func (s *NotificationService) Delete(id string, ctx http.Context) error {
	user := types.GetCurrentUser(ctx)
	if user == nil {
		return errors.New("unauthorized")
	}

	notification, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}
	if notification == nil {
		return errors.New("notification not found")
	}

	// Ensure user owns the notification
	if notification.UserID != user.ID {
		return errors.New("notification not found")
	}

	return s.repo.Delete(id)
}

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

func (s *NotificationService) buildFilters(ctx http.Context, keys []string) map[string]any {
	filters := map[string]any{}

	for _, k := range keys {
		if v := ctx.Request().Query(k, ""); v != "" {
			filters[k] = v
		}
	}

	// Pagination
	page := ctx.Request().QueryInt("page", 1)
	if page < 1 {
		page = 1
	}
	filters["page"] = page

	perPage := ctx.Request().QueryInt("per_page", 20)
	if perPage < 1 {
		perPage = 20
	}
	if perPage > 100 {
		perPage = 100
	}
	filters["per_page"] = perPage

	return filters
}

func (s *NotificationService) paginationMeta(filters map[string]any, total int64) map[string]any {
	page := 1
	perPage := 20
	if v, ok := filters["page"].(int); ok && v > 0 {
		page = v
	}
	if v, ok := filters["per_page"].(int); ok && v > 0 {
		perPage = v
	}
	totalPages := int(math.Ceil(float64(total) / float64(perPage)))
	return map[string]any{
		"page":        page,
		"per_page":    perPage,
		"total":       total,
		"total_pages": totalPages,
	}
}
