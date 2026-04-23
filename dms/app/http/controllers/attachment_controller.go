package controllers

import (
	"fmt"
	"path/filepath"
	"strings"
	"time"

	nethttp "net/http"

	"github.com/google/uuid"
	"github.com/goravel/framework/contracts/http"

	"dms/app/facades"
	"dms/app/models"
	"dms/app/repositories"
	"dms/app/services"
	"dms/app/types"
)

type AttachmentController struct {
	attachmentRepo repositories.AttachmentRepository
	documentRepo   repositories.DocumentRepository
	fileService    services.FileService
	ocrService     *services.OCRService
}

func NewAttachmentController() *AttachmentController {
	return &AttachmentController{
		attachmentRepo: repositories.NewAttachmentRepository(),
		documentRepo:   repositories.NewDocumentRepository(),
		fileService:    services.NewFileService(),
		ocrService:     services.NewOCRService(),
	}
}

// ---------------------------------------------------------------------------
// GET /documents/{id}/attachments
// ---------------------------------------------------------------------------

func (c *AttachmentController) ListAttachments(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("document.view") {
		return forbiddenResponse(ctx)
	}

	documentID := ctx.Request().Route("id")
	if documentID == "" {
		return badRequestError(ctx, "Document ID is required")
	}

	items, err := c.attachmentRepo.ListByEntity("document", documentID)
	if err != nil {
		return serverError(ctx, "Failed to list attachments")
	}

	return ctx.Response().Success().Json(http.Json{
		"data": items,
	})
}

// ---------------------------------------------------------------------------
// POST /documents/{id}/attachments
// ---------------------------------------------------------------------------

func (c *AttachmentController) UploadAttachment(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("document.create") {
		return forbiddenResponse(ctx)
	}

	documentID := ctx.Request().Route("id")
	if documentID == "" {
		return badRequestError(ctx, "Document ID is required")
	}

	// Verify document exists
	doc, err := c.documentRepo.FindByID(documentID)
	if err != nil {
		return serverError(ctx, "Failed to retrieve document")
	}
	if doc == nil {
		return notFoundError(ctx, "Document not found")
	}

	// Get uploaded file
	file, err := ctx.Request().File("file")
	if err != nil {
		return badRequestError(ctx, "File is required")
	}

	// Validate extension
	originalName := file.GetClientOriginalName()
	ext := strings.ToLower(filepath.Ext(originalName))
	allowedExts := []string{".pdf", ".docx", ".doc", ".xlsx", ".xls", ".pptx", ".ppt", ".png", ".jpg", ".jpeg", ".gif", ".zip", ".rar", ".csv", ".txt"}
	extAllowed := false
	for _, a := range allowedExts {
		if ext == a {
			extAllowed = true
			break
		}
	}
	if !extAllowed {
		return badRequestError(ctx, fmt.Sprintf("File type %s not allowed", ext))
	}

	// Validate size (50MB)
	fileSize, err := file.Size()
	if err != nil {
		return serverError(ctx, "Failed to determine file size")
	}
	if fileSize > 50*1024*1024 {
		return badRequestError(ctx, "File size exceeds maximum 50MB")
	}

	// Resolve company code for path
	companyCode, err := c.resolveCompanyCode(doc.CompanyID)
	if err != nil {
		return serverError(ctx, "Failed to resolve company")
	}

	// Build storage path: {companyCode}/attachments/{documentID}/{uuid}{ext}
	newFileName := uuid.New().String() + ext
	dir := fmt.Sprintf("%s/attachments/%s", strings.ToUpper(companyCode), documentID)

	storedPath, err := file.StoreAs(dir, newFileName)
	if err != nil {
		return serverError(ctx, "Failed to store file")
	}

	// Detect MIME type
	mimeType := c.detectMimeType(ext)

	now := time.Now()
	year := now.Year()
	month := int(now.Month())
	entityType := "document"

	attachment := models.FileStorage{
		CompanyID:    doc.CompanyID,
		FileName:     newFileName,
		OriginalName: originalName,
		FilePath:     storedPath,
		FileSize:     fileSize,
		MimeType:     mimeType,
		Module:       "attachments",
		StorageYear:  &year,
		StorageMonth: &month,
		EntityType:   &entityType,
		EntityID:     &documentID,
		StorageType:  "local",
		UploadedBy:   user.ID,
	}

	if err := c.attachmentRepo.Create(&attachment); err != nil {
		return serverError(ctx, "Failed to save attachment record")
	}

	return ctx.Response().Json(nethttp.StatusCreated, http.Json{
		"data":    attachment,
		"message": "File berhasil diupload",
	})
}

// ---------------------------------------------------------------------------
// GET /documents/{id}/attachments/{attachmentId}/download
// ---------------------------------------------------------------------------

func (c *AttachmentController) DownloadAttachment(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("document.view") {
		return forbiddenResponse(ctx)
	}

	documentID := ctx.Request().Route("id")
	attachmentID := ctx.Request().Route("attachmentId")

	attachment, err := c.attachmentRepo.FindByID(attachmentID)
	if err != nil {
		return serverError(ctx, "Failed to retrieve attachment")
	}
	if attachment == nil {
		return notFoundError(ctx, "Attachment not found")
	}

	// Verify the attachment belongs to this document
	if attachment.EntityType == nil || *attachment.EntityType != "document" ||
		attachment.EntityID == nil || *attachment.EntityID != documentID {
		return notFoundError(ctx, "Attachment not found for this document")
	}

	return ctx.Response().Download(attachment.FilePath, attachment.OriginalName)
}

// ---------------------------------------------------------------------------
// DELETE /documents/{id}/attachments/{attachmentId}
// ---------------------------------------------------------------------------

func (c *AttachmentController) DeleteAttachment(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("document.delete") {
		return forbiddenResponse(ctx)
	}

	documentID := ctx.Request().Route("id")
	attachmentID := ctx.Request().Route("attachmentId")

	attachment, err := c.attachmentRepo.FindByID(attachmentID)
	if err != nil {
		return serverError(ctx, "Failed to retrieve attachment")
	}
	if attachment == nil {
		return notFoundError(ctx, "Attachment not found")
	}

	// Verify the attachment belongs to this document
	if attachment.EntityType == nil || *attachment.EntityType != "document" ||
		attachment.EntityID == nil || *attachment.EntityID != documentID {
		return notFoundError(ctx, "Attachment not found for this document")
	}

	// Soft delete
	if err := c.attachmentRepo.Delete(attachmentID); err != nil {
		return serverError(ctx, "Failed to delete attachment")
	}

	// Optionally delete physical file
	_ = c.fileService.Delete(attachment.FilePath)

	return ctx.Response().Success().Json(http.Json{
		"message": "Lampiran berhasil dihapus",
	})
}

// ---------------------------------------------------------------------------
// POST /documents/{id}/attachments/{attachmentId}/ocr - Run OCR on attachment
// ---------------------------------------------------------------------------

func (c *AttachmentController) RunAttachmentOCR(ctx http.Context) http.Response {
	user := types.GetCurrentUser(ctx)
	if user == nil || !user.HasPermission("document.view") {
		return forbiddenResponse(ctx)
	}

	documentID := ctx.Request().Route("id")
	attachmentID := ctx.Request().Route("attachmentId")

	attachment, err := c.attachmentRepo.FindByID(attachmentID)
	if err != nil {
		return serverError(ctx, "Failed to retrieve attachment")
	}
	if attachment == nil {
		return notFoundError(ctx, "Attachment not found")
	}

	if attachment.EntityType == nil || *attachment.EntityType != "document" ||
		attachment.EntityID == nil || *attachment.EntityID != documentID {
		return notFoundError(ctx, "Attachment not found for this document")
	}

	// Only allow OCR on PDF and image files
	mime := attachment.MimeType
	if !strings.Contains(mime, "pdf") && !strings.Contains(mime, "image") {
		return badRequestError(ctx, "OCR hanya bisa dijalankan pada file PDF atau gambar")
	}

	result, err := c.ocrService.RunOCROnFile(attachment.FilePath)
	if err != nil {
		return badRequestError(ctx, err.Error())
	}

	// Save OCR text to attachment record
	if result.Text != "" {
		if err := c.attachmentRepo.UpdateOCRText(attachmentID, result.Text); err != nil {
			fmt.Printf("Warning: could not save OCR text to attachment: %v\n", err)
		}
	}

	return ctx.Response().Success().Json(http.Json{
		"data":    result,
		"message": "OCR completed successfully",
	})
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

func (c *AttachmentController) resolveCompanyCode(companyID string) (string, error) {
	var company models.Company
	if err := facades.Orm().Query().Where("id = ?", companyID).First(&company); err != nil {
		return "", err
	}
	if company.ID == "" {
		return "", fmt.Errorf("company not found")
	}
	return company.Code, nil
}

func (c *AttachmentController) detectMimeType(ext string) string {
	mimeTypes := map[string]string{
		".pdf":  "application/pdf",
		".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		".doc":  "application/msword",
		".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		".xls":  "application/vnd.ms-excel",
		".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
		".ppt":  "application/vnd.ms-powerpoint",
		".png":  "image/png",
		".jpg":  "image/jpeg",
		".jpeg": "image/jpeg",
		".gif":  "image/gif",
		".zip":  "application/zip",
		".rar":  "application/vnd.rar",
		".csv":  "text/csv",
		".txt":  "text/plain",
	}
	if mt, ok := mimeTypes[ext]; ok {
		return mt
	}
	return "application/octet-stream"
}
