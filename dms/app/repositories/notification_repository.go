package repositories

import (
	"fmt"
	"time"

	"dms/app/facades"
	"dms/app/models"
)

type NotificationRepository interface {
	List(userID string, filters map[string]any) ([]models.Notification, int64, error)
	FindByID(id string) (*models.Notification, error)
	Create(notification *models.Notification) error
	MarkRead(id string) error
	MarkAllRead(userID string) error
	Delete(id string) error
	CountUnread(userID string) (int64, error)
}

type notificationRepository struct{}

func NewNotificationRepository() NotificationRepository {
	return &notificationRepository{}
}

func (r *notificationRepository) List(userID string, filters map[string]any) ([]models.Notification, int64, error) {
	page, perPage := paginationFromFilters(filters)
	offset := (page - 1) * perPage

	q := facades.Orm().Query().Where("user_id = ?", userID)

	// Filter by is_read
	if v, ok := filters["is_read"].(string); ok && v != "" {
		if v == "true" {
			q = q.Where("is_read = ?", true)
		} else if v == "false" {
			q = q.Where("is_read = ?", false)
		}
	}

	// Filter by type
	if v, ok := filters["type"].(string); ok && v != "" {
		q = q.Where("type = ?", v)
	}

	// Count total
	count, err := q.Model(&models.Notification{}).Count()
	if err != nil {
		return nil, 0, err
	}

	// Sorting - always order by created_at desc (newest first)
	sortBy := "created_at"
	sortDir := "desc"
	if v, ok := filters["sort_by"].(string); ok && v != "" {
		allowed := map[string]bool{
			"created_at": true,
			"is_read":    true,
			"type":       true,
		}
		if allowed[v] {
			sortBy = v
		}
	}
	if v, ok := filters["sort_dir"].(string); ok && v == "asc" {
		sortDir = "asc"
	}

	var items []models.Notification
	if err := q.
		With("Document").
		Order(fmt.Sprintf("%s %s", sortBy, sortDir)).
		Offset(offset).
		Limit(perPage).
		Get(&items); err != nil {
		return nil, 0, err
	}

	return items, count, nil
}

func (r *notificationRepository) FindByID(id string) (*models.Notification, error) {
	var notification models.Notification
	if err := facades.Orm().Query().
		Where("id = ?", id).
		First(&notification); err != nil {
		return nil, err
	}
	if notification.ID == "" {
		return nil, nil
	}
	return &notification, nil
}

func (r *notificationRepository) Create(notification *models.Notification) error {
	return facades.Orm().Query().Create(notification)
}

func (r *notificationRepository) MarkRead(id string) error {
	now := time.Now()
	if _, err := facades.Orm().Query().
		Model(&models.Notification{}).
		Where("id = ?", id).
		Update("is_read", true); err != nil {
		return err
	}
	_, err := facades.Orm().Query().
		Model(&models.Notification{}).
		Where("id = ?", id).
		Update("read_at", now)
	return err
}

func (r *notificationRepository) MarkAllRead(userID string) error {
	now := time.Now()
	if _, err := facades.Orm().Query().
		Model(&models.Notification{}).
		Where("user_id = ? AND is_read = ?", userID, false).
		Update("is_read", true); err != nil {
		return err
	}
	_, err := facades.Orm().Query().
		Model(&models.Notification{}).
		Where("user_id = ? AND is_read = ?", userID, true).
		Where("read_at IS NULL").
		Update("read_at", now)
	return err
}

func (r *notificationRepository) Delete(id string) error {
	_, err := facades.Orm().Query().Where("id = ?", id).Delete(&models.Notification{})
	return err
}

func (r *notificationRepository) CountUnread(userID string) (int64, error) {
	return facades.Orm().Query().
		Model(&models.Notification{}).
		Where("user_id = ? AND is_read = ?", userID, false).
		Count()
}
