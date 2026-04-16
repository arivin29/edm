package repositories

import (
	"time"

	"dms/app/facades"
	"dms/app/models"
)

type CommentRepository interface {
	List(documentID string, filters map[string]any) ([]models.DocumentComment, error)
	FindByID(id string) (*models.DocumentComment, error)
	Create(comment *models.DocumentComment) error
	Update(comment *models.DocumentComment) error
	Delete(id string) error
	Resolve(id string, resolverID string) error
	Unresolve(id string) error
	CountByDocument(documentID string) (int64, error)
}

type commentRepository struct{}

func NewCommentRepository() CommentRepository {
	return &commentRepository{}
}

func (r *commentRepository) List(documentID string, filters map[string]any) ([]models.DocumentComment, error) {
	q := facades.Orm().Query().
		Where("document_id = ? AND deleted_at IS NULL", documentID)

	// Filter by version number
	if v, ok := filters["version_number"].(int); ok && v > 0 {
		q = q.Where("version_number = ?", v)
	}

	// Filter by comment type
	if v, ok := filters["comment_type"].(string); ok && v != "" {
		q = q.Where("comment_type = ?", v)
	}

	// Filter by resolved status
	if v, ok := filters["is_resolved"].(string); ok {
		if v == "true" {
			q = q.Where("is_resolved = true")
		} else if v == "false" {
			q = q.Where("is_resolved = false")
		}
	}

	// Filter by internal flag (for visibility control)
	if v, ok := filters["is_internal"].(string); ok {
		if v == "true" {
			q = q.Where("is_internal = true")
		} else if v == "false" {
			q = q.Where("is_internal = false")
		}
	}

	// Filter by parent (null = top-level comments only)
	if v, ok := filters["parent_id"].(string); ok {
		if v == "null" || v == "" {
			q = q.Where("parent_id IS NULL")
		} else {
			q = q.Where("parent_id = ?", v)
		}
	}

	var comments []models.DocumentComment
	if err := q.
		With("User").
		With("Resolver").
		With("Replies").
		With("Replies.User").
		Order("created_at desc").
		Get(&comments); err != nil {
		return nil, err
	}

	return comments, nil
}

func (r *commentRepository) FindByID(id string) (*models.DocumentComment, error) {
	var comment models.DocumentComment
	if err := facades.Orm().Query().
		With("User").
		With("Resolver").
		Where("id = ? AND deleted_at IS NULL", id).
		First(&comment); err != nil {
		return nil, err
	}
	if comment.ID == "" {
		return nil, nil
	}
	return &comment, nil
}

func (r *commentRepository) Create(comment *models.DocumentComment) error {
	return facades.Orm().Query().Create(comment)
}

func (r *commentRepository) Update(comment *models.DocumentComment) error {
	return facades.Orm().Query().Save(comment)
}

func (r *commentRepository) Delete(id string) error {
	now := time.Now()
	_, err := facades.Orm().Query().
		Model(&models.DocumentComment{}).
		Where("id = ?", id).
		Update("deleted_at", now)
	return err
}

func (r *commentRepository) Resolve(id string, resolverID string) error {
	var comment models.DocumentComment
	if err := facades.Orm().Query().Where("id = ?", id).First(&comment); err != nil {
		return err
	}
	if comment.ID == "" {
		return nil
	}

	now := time.Now()
	comment.IsResolved = true
	comment.ResolvedBy = &resolverID
	comment.ResolvedAt = &now
	comment.UpdatedAt = now

	return facades.Orm().Query().Save(&comment)
}

func (r *commentRepository) Unresolve(id string) error {
	var comment models.DocumentComment
	if err := facades.Orm().Query().Where("id = ?", id).First(&comment); err != nil {
		return err
	}
	if comment.ID == "" {
		return nil
	}

	now := time.Now()
	comment.IsResolved = false
	comment.ResolvedBy = nil
	comment.ResolvedAt = nil
	comment.UpdatedAt = now

	return facades.Orm().Query().Save(&comment)
}

func (r *commentRepository) CountByDocument(documentID string) (int64, error) {
	return facades.Orm().Query().
		Model(&models.DocumentComment{}).
		Where("document_id = ? AND deleted_at IS NULL", documentID).
		Count()
}
