package controllers

import (
	nethttp "net/http"

	"github.com/goravel/framework/contracts/http"

	"dms/app/facades"
	"dms/app/services"
)

type CommentController struct {
	commentService *services.CommentService
}

func NewCommentController() *CommentController {
	return &CommentController{
		commentService: services.NewCommentService(),
	}
}

// ---------------------------------------------------------------------------
// GET /documents/{id}/comments - List comments for document
// ---------------------------------------------------------------------------

func (c *CommentController) Index(ctx http.Context) http.Response {
	documentID := ctx.Request().Route("id")

	comments, err := c.commentService.List(documentID, ctx)
	if err != nil {
		if err.Error() == "document not found" {
			return notFoundError(ctx, err.Error())
		}
		return serverError(ctx, "Failed to list comments")
	}

	return ctx.Response().Success().Json(http.Json{
		"data": comments,
	})
}

// ---------------------------------------------------------------------------
// POST /documents/{id}/comments - Add comment
// ---------------------------------------------------------------------------

func (c *CommentController) Store(ctx http.Context) http.Response {
	documentID := ctx.Request().Route("id")

	validator, err := facades.Validation().Make(ctx, ctx.Request().All(), map[string]string{
		"content": "required",
	})
	if err != nil {
		return validationError(ctx, err)
	}
	if validator.Fails() {
		return validationFailed(ctx, validator.Errors().All())
	}

	comment, err := c.commentService.Create(documentID, ctx)
	if err != nil {
		if err.Error() == "document not found" || err.Error() == "parent comment not found" {
			return notFoundError(ctx, err.Error())
		}
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Json(nethttp.StatusCreated, http.Json{
		"data": comment,
	})
}

// ---------------------------------------------------------------------------
// PUT /documents/{id}/comments/{commentId} - Update comment
// ---------------------------------------------------------------------------

func (c *CommentController) Update(ctx http.Context) http.Response {
	commentID := ctx.Request().Route("commentId")

	comment, err := c.commentService.Update(commentID, ctx)
	if err != nil {
		if err.Error() == "comment not found" {
			return notFoundError(ctx, err.Error())
		}
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Success().Json(http.Json{
		"data": comment,
	})
}

// ---------------------------------------------------------------------------
// DELETE /documents/{id}/comments/{commentId} - Delete comment
// ---------------------------------------------------------------------------

func (c *CommentController) Destroy(ctx http.Context) http.Response {
	commentID := ctx.Request().Route("commentId")

	if err := c.commentService.Delete(commentID, ctx); err != nil {
		if err.Error() == "comment not found" {
			return notFoundError(ctx, err.Error())
		}
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Success().Json(http.Json{
		"message": "Comment deleted successfully",
	})
}

// ---------------------------------------------------------------------------
// POST /documents/{id}/comments/{commentId}/resolve - Mark resolved
// ---------------------------------------------------------------------------

func (c *CommentController) Resolve(ctx http.Context) http.Response {
	commentID := ctx.Request().Route("commentId")

	comment, err := c.commentService.Resolve(commentID, ctx)
	if err != nil {
		if err.Error() == "comment not found" {
			return notFoundError(ctx, err.Error())
		}
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Success().Json(http.Json{
		"data":    comment,
		"message": "Comment resolved successfully",
	})
}

// ---------------------------------------------------------------------------
// POST /documents/{id}/comments/{commentId}/unresolve - Mark unresolved
// ---------------------------------------------------------------------------

func (c *CommentController) Unresolve(ctx http.Context) http.Response {
	commentID := ctx.Request().Route("commentId")

	comment, err := c.commentService.Unresolve(commentID, ctx)
	if err != nil {
		if err.Error() == "comment not found" {
			return notFoundError(ctx, err.Error())
		}
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Success().Json(http.Json{
		"data":    comment,
		"message": "Comment unresolved successfully",
	})
}
