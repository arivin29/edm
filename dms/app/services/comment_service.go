package services

import (
	"errors"
	"strconv"
	"time"

	"github.com/goravel/framework/contracts/http"

	"dms/app/models"
	"dms/app/repositories"
	"dms/app/types"
)

type CommentService struct {
	repo    repositories.CommentRepository
	docRepo repositories.DocumentRepository
}

func NewCommentService() *CommentService {
	return &CommentService{
		repo:    repositories.NewCommentRepository(),
		docRepo: repositories.NewDocumentRepository(),
	}
}

// List returns comments for a document with optional filters
func (s *CommentService) List(documentID string, ctx http.Context) ([]models.DocumentComment, error) {
	// Verify document exists
	doc, err := s.docRepo.FindByID(documentID)
	if err != nil {
		return nil, err
	}
	if doc == nil {
		return nil, errors.New("document not found")
	}

	filters := map[string]any{}

	// Version filter
	if v := ctx.Request().Query("version", ""); v != "" {
		if vNum, err := strconv.Atoi(v); err == nil {
			filters["version_number"] = vNum
		}
	}

	// Comment type filter
	if v := ctx.Request().Query("type", ""); v != "" {
		filters["comment_type"] = v
	}

	// Resolved filter
	if v := ctx.Request().Query("resolved", ""); v != "" {
		filters["is_resolved"] = v
	}

	// Internal filter - non-reviewers only see non-internal comments
	user := types.GetCurrentUser(ctx)
	if user != nil && !user.HasPermission("document.review") {
		filters["is_internal"] = "false"
	} else if v := ctx.Request().Query("internal", ""); v != "" {
		filters["is_internal"] = v
	}

	// Parent filter (for threading)
	if v := ctx.Request().Query("parent_id", ""); v != "" {
		filters["parent_id"] = v
	} else {
		// By default, return only top-level comments (with their replies loaded)
		filters["parent_id"] = "null"
	}

	return s.repo.List(documentID, filters)
}

// Create adds a new comment or reply
func (s *CommentService) Create(documentID string, ctx http.Context) (*models.DocumentComment, error) {
	user := types.GetCurrentUser(ctx)
	if user == nil {
		return nil, errors.New("unauthorized")
	}

	// Verify document exists
	doc, err := s.docRepo.FindByID(documentID)
	if err != nil {
		return nil, err
	}
	if doc == nil {
		return nil, errors.New("document not found")
	}

	content := ctx.Request().Input("content")
	if content == "" {
		return nil, errors.New("content is required")
	}

	comment := models.DocumentComment{
		DocumentID:  documentID,
		UserID:      user.ID,
		Content:     content,
		CommentType: "general",
		IsResolved:  false,
		IsInternal:  false,
	}

	// Optional fields
	if v := ctx.Request().Input("comment_type"); v != "" {
		validTypes := map[string]bool{"general": true, "review": true, "annotation": true}
		if validTypes[v] {
			comment.CommentType = v
		}
	}

	if v := ctx.Request().Input("parent_id"); v != "" {
		// Verify parent exists
		parent, err := s.repo.FindByID(v)
		if err != nil {
			return nil, err
		}
		if parent == nil {
			return nil, errors.New("parent comment not found")
		}
		if parent.DocumentID != documentID {
			return nil, errors.New("parent comment belongs to different document")
		}
		comment.ParentID = &v
	}

	if v := ctx.Request().Input("version_number"); v != "" {
		if vNum, err := strconv.Atoi(v); err == nil {
			comment.VersionNumber = &vNum
		}
	}

	if v := ctx.Request().Input("page_number"); v != "" {
		if pNum, err := strconv.Atoi(v); err == nil {
			comment.PageNumber = &pNum
		}
	}

	if v := ctx.Request().Input("position_x"); v != "" {
		if x, err := strconv.ParseFloat(v, 64); err == nil {
			comment.PositionX = &x
		}
	}

	if v := ctx.Request().Input("position_y"); v != "" {
		if y, err := strconv.ParseFloat(v, 64); err == nil {
			comment.PositionY = &y
		}
	}

	if v := ctx.Request().Input("selected_text"); v != "" {
		comment.SelectedText = &v
	}

	// Internal flag - only allow reviewers to set this
	if v := ctx.Request().Input("is_internal"); v == "true" {
		if user.HasPermission("document.review") {
			comment.IsInternal = true
		}
	}

	if err := s.repo.Create(&comment); err != nil {
		return nil, err
	}

	return s.repo.FindByID(comment.ID)
}

// Update modifies a comment (only own comments)
func (s *CommentService) Update(id string, ctx http.Context) (*models.DocumentComment, error) {
	user := types.GetCurrentUser(ctx)
	if user == nil {
		return nil, errors.New("unauthorized")
	}

	comment, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if comment == nil {
		return nil, errors.New("comment not found")
	}

	// Only the author can edit their comment
	if comment.UserID != user.ID {
		return nil, errors.New("you can only edit your own comments")
	}

	// Don't allow editing resolved comments
	if comment.IsResolved {
		return nil, errors.New("cannot edit a resolved comment")
	}

	if v := ctx.Request().Input("content"); v != "" {
		comment.Content = v
	}

	comment.UpdatedAt = time.Now()

	if err := s.repo.Update(comment); err != nil {
		return nil, err
	}

	return s.repo.FindByID(id)
}

// Delete soft deletes a comment (only own comments or by reviewer)
func (s *CommentService) Delete(id string, ctx http.Context) error {
	user := types.GetCurrentUser(ctx)
	if user == nil {
		return errors.New("unauthorized")
	}

	comment, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}
	if comment == nil {
		return errors.New("comment not found")
	}

	// Only author or reviewer can delete
	if comment.UserID != user.ID && !user.HasPermission("document.review") {
		return errors.New("you can only delete your own comments")
	}

	return s.repo.Delete(id)
}

// Resolve marks a comment as resolved
func (s *CommentService) Resolve(id string, ctx http.Context) (*models.DocumentComment, error) {
	user := types.GetCurrentUser(ctx)
	if user == nil {
		return nil, errors.New("unauthorized")
	}

	comment, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if comment == nil {
		return nil, errors.New("comment not found")
	}

	if comment.IsResolved {
		return nil, errors.New("comment is already resolved")
	}

	if err := s.repo.Resolve(id, user.ID); err != nil {
		return nil, err
	}

	return s.repo.FindByID(id)
}

// Unresolve marks a comment as unresolved
func (s *CommentService) Unresolve(id string, ctx http.Context) (*models.DocumentComment, error) {
	user := types.GetCurrentUser(ctx)
	if user == nil {
		return nil, errors.New("unauthorized")
	}

	comment, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if comment == nil {
		return nil, errors.New("comment not found")
	}

	if !comment.IsResolved {
		return nil, errors.New("comment is not resolved")
	}

	if err := s.repo.Unresolve(id); err != nil {
		return nil, err
	}

	return s.repo.FindByID(id)
}
