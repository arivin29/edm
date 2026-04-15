package controllers

import (
	nethttp "net/http"

	"github.com/goravel/framework/contracts/http"

	"dms/app/models"
	"dms/app/repositories"
	"dms/app/types"
)

type DocumentRelationController struct {
	repo    repositories.DocumentRelationRepository
	docRepo repositories.DocumentRepository
}

func NewDocumentRelationController() *DocumentRelationController {
	return &DocumentRelationController{
		repo:    repositories.NewDocumentRelationRepository(),
		docRepo: repositories.NewDocumentRepository(),
	}
}

// GET /documents/{id}/relations
func (c *DocumentRelationController) Index(ctx http.Context) http.Response {
	documentID := ctx.Request().Route("id")

	doc, err := c.docRepo.FindByID(documentID)
	if err != nil || doc == nil {
		return notFoundError(ctx, "Document not found")
	}

	outbound, err := c.repo.ListByDocumentID(documentID)
	if err != nil {
		return serverError(ctx, "Failed to list relations")
	}

	inbound, err := c.repo.ListInbound(documentID)
	if err != nil {
		return serverError(ctx, "Failed to list inbound relations")
	}

	return ctx.Response().Success().Json(http.Json{
		"outbound": outbound,
		"inbound":  inbound,
	})
}

// POST /documents/{id}/relations
func (c *DocumentRelationController) Store(ctx http.Context) http.Response {
	documentID := ctx.Request().Route("id")

	doc, err := c.docRepo.FindByID(documentID)
	if err != nil || doc == nil {
		return notFoundError(ctx, "Document not found")
	}

	relatedDocID := ctx.Request().Input("related_document_id")
	relationType := ctx.Request().Input("relation_type")
	notes := ctx.Request().Input("notes")

	if relatedDocID == "" || relationType == "" {
		return ctx.Response().Status(nethttp.StatusBadRequest).Json(http.Json{
			"error": "related_document_id and relation_type are required",
		})
	}

	validTypes := map[string]bool{
		"references": true, "supersedes": true, "related_to": true,
		"attachment": true, "parent_child": true,
	}
	if !validTypes[relationType] {
		return ctx.Response().Status(nethttp.StatusBadRequest).Json(http.Json{
			"error": "Invalid relation_type",
		})
	}

	// Verify related document exists
	relDoc, err := c.docRepo.FindByID(relatedDocID)
	if err != nil || relDoc == nil {
		return notFoundError(ctx, "Related document not found")
	}

	user := types.GetCurrentUser(ctx)
	if user == nil {
		return ctx.Response().Status(nethttp.StatusUnauthorized).Json(http.Json{"error": "Unauthorized"})
	}

	var notesPtr *string
	if notes != "" {
		notesPtr = &notes
	}

	relation := &models.DocumentRelation{
		DocumentID:        documentID,
		RelatedDocumentID: relatedDocID,
		RelationType:      relationType,
		Notes:             notesPtr,
		CreatedBy:         user.ID,
	}

	if err := c.repo.Create(relation); err != nil {
		return ctx.Response().Status(nethttp.StatusConflict).Json(http.Json{
			"error": "Relation already exists or invalid data",
		})
	}

	return ctx.Response().Status(nethttp.StatusCreated).Json(http.Json{
		"data": relation,
	})
}

// DELETE /documents/{id}/relations/{relationId}
func (c *DocumentRelationController) Destroy(ctx http.Context) http.Response {
	documentID := ctx.Request().Route("id")
	relationID := ctx.Request().Route("relationId")

	rel, err := c.repo.FindByID(relationID)
	if err != nil || rel == nil {
		return notFoundError(ctx, "Relation not found")
	}

	if rel.DocumentID != documentID {
		return notFoundError(ctx, "Relation not found for this document")
	}

	if err := c.repo.Delete(relationID); err != nil {
		return serverError(ctx, "Failed to delete relation")
	}

	return ctx.Response().Success().Json(http.Json{
		"message": "Relation deleted",
	})
}
