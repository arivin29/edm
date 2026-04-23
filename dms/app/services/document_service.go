package services

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/goravel/framework/contracts/http"

	"dms/app/facades"
	"dms/app/models"
	"dms/app/repositories"
	"dms/app/types"
)

type DocumentService struct {
	repo             repositories.DocumentRepository
	templateRepo     repositories.TemplateRepository
	numberingService *NumberingService
}

func NewDocumentService() *DocumentService {
	return &DocumentService{
		repo:             repositories.NewDocumentRepository(),
		templateRepo:     repositories.NewTemplateRepository(),
		numberingService: NewNumberingService(),
	}
}

// ---------------------------------------------------------------------------
// List with data scope
// ---------------------------------------------------------------------------

func (s *DocumentService) List(ctx http.Context) ([]models.Document, map[string]any, error) {
	filters := buildFilters(ctx, []string{
		"search", "status", "document_type_id", "category_id",
		"office_id", "department_id", "section_id",
		"created_by", "priority", "confidentiality", "classification", "from_module",
		"date_from", "date_to",
		"sort_by", "sort_dir",
	})

	user := types.GetCurrentUser(ctx)
	if user != nil {
		s.applyDataScope(user, filters)
	}

	items, total, err := s.repo.List(filters)
	if err != nil {
		return nil, nil, err
	}

	return items, paginationMeta(filters, total), nil
}

// applyDataScope applies data access restrictions based on user role
func (s *DocumentService) applyDataScope(user *types.UserContext, filters map[string]any) {
	// super_admin: all documents (no filter)
	if user.HasRole("super_admin") {
		return
	}

	// admin_company: documents in their company
	if user.HasRole("admin_company") {
		filters["company_id"] = user.CompanyID
		return
	}

	// admin_office: documents in their office
	if user.HasRole("admin_office") {
		filters["company_id"] = user.CompanyID
		filters["office_id"] = user.OfficeID
		return
	}

	// creator/reviewer/approver: documents in their company + office + department
	filters["company_id"] = user.CompanyID
	filters["office_id"] = user.OfficeID
	if user.DepartmentID != nil && *user.DepartmentID != "" {
		filters["department_id"] = *user.DepartmentID
	}
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

func (s *DocumentService) GetByID(id string) (*models.Document, error) {
	doc, err := s.repo.FindByIDWithRelations(id)
	if err != nil {
		return nil, err
	}
	if doc == nil {
		return nil, errors.New("document not found")
	}
	return doc, nil
}

func (s *DocumentService) Create(ctx http.Context) (*models.Document, error) {
	user := types.GetCurrentUser(ctx)
	if user == nil {
		return nil, errors.New("unauthorized")
	}

	templateID := ctx.Request().Input("template_id")
	if templateID == "" {
		return nil, errors.New("template_id is required")
	}

	// Step 1: Validate template exists
	template, err := s.templateRepo.FindByIDWithRelations(templateID)
	if err != nil {
		return nil, errors.New("failed to retrieve template")
	}
	if template == nil {
		return nil, errors.New("template not found")
	}

	// Step 2: Get required IDs from request or template
	categoryID := ctx.Request().Input("category_id")
	if categoryID == "" {
		if template.CategoryID != nil {
			categoryID = *template.CategoryID
		} else {
			return nil, errors.New("category_id is required")
		}
	}

	// Get office and department from user context or request
	officeID := ctx.Request().Input("office_id")
	if officeID == "" {
		officeID = user.OfficeID
	}

	departmentID := ctx.Request().Input("department_id")
	if departmentID == "" && user.DepartmentID != nil {
		departmentID = *user.DepartmentID
	}
	if departmentID == "" {
		return nil, errors.New("department_id is required")
	}

	// Step 3: Generate document number
	var catPtr, officePtr, deptPtr *string
	catPtr = &categoryID
	officePtr = &officeID
	deptPtr = &departmentID

	docNumber, err := s.numberingService.GenerateNumber(
		user.CompanyID,
		template.DocumentTypeID,
		catPtr,
		officePtr,
		deptPtr,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to generate document number: %w", err)
	}

	// Step 4: Generate folder name from document number (sanitize)
	folderName := s.sanitizeFolderName(docNumber)

	// Step 5: Copy template file to document folder
	companyCode, err := s.resolveCompanyCode(user.CompanyID)
	if err != nil {
		return nil, err
	}

	categoryCode, err := s.resolveCategoryCode(categoryID)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	dstDir := fmt.Sprintf("%s/documents/%s/%d/%02d/%s",
		strings.ToUpper(companyCode),
		strings.ToLower(categoryCode),
		now.Year(),
		now.Month(),
		folderName,
	)
	dstPath := fmt.Sprintf("%s/v1.docx", dstDir)

	if err := facades.Storage().Copy(template.FilePath, dstPath); err != nil {
		return nil, fmt.Errorf("failed to copy template file: %w", err)
	}

	// Step 6: Create document record
	doc := models.Document{
		CompanyID:      user.CompanyID,
		OfficeID:       officeID,
		DepartmentID:   departmentID,
		DocumentTypeID: template.DocumentTypeID,
		CategoryID:     categoryID,
		TemplateID:     &templateID,
		DocumentNumber: docNumber,
		FolderName:     folderName,
		Title:          ctx.Request().Input("title"),
		Status:         "draft",
		CurrentVersion: 1,
		MajorVersion:   1,
		MinorVersion:   0,
		Priority:        "normal",
		Confidentiality: "internal",
		AccessLevel:     "raw",
		Classification:  "internal",
		DraftFilePath:  &dstPath,
		CreatedBy:      user.ID,
	}

	// Optional fields
	if v := ctx.Request().Input("description"); v != "" {
		doc.Description = &v
	}
	if v := ctx.Request().Input("section_id"); v != "" {
		doc.SectionID = &v
	}
	if v := ctx.Request().Input("priority"); v != "" {
		doc.Priority = v
	}
	if v := ctx.Request().Input("confidentiality"); v != "" {
		doc.Confidentiality = v
	}
	if v := ctx.Request().Input("classification"); v != "" {
		doc.Classification = v
	}
	if v := ctx.Request().Input("from_module"); v != "" {
		doc.FromModule = &v
	}
	if v := ctx.Request().Input("from_module_id"); v != "" {
		doc.FromModuleID = &v
	}
	if v := ctx.Request().Input("from_module_number"); v != "" {
		doc.FromModuleNumber = &v
	}
	if v := ctx.Request().Input("metadata"); v != "" {
		doc.Metadata = &v
	}

	// Generate OnlyOffice key
	onlyofficeKey := fmt.Sprintf("doc_%s_v1", doc.ID)
	doc.OnlyofficeKey = &onlyofficeKey

	if err := s.repo.Create(&doc); err != nil {
		return nil, fmt.Errorf("failed to create document: %w", err)
	}

	// Update OnlyOffice key with actual document ID
	onlyofficeKey = fmt.Sprintf("doc_%s_v1", doc.ID)
	doc.OnlyofficeKey = &onlyofficeKey
	if err := s.repo.Update(&doc); err != nil {
		return nil, fmt.Errorf("failed to update onlyoffice key: %w", err)
	}

	// Step 7: Create initial document version
	changeType := "initial"
	version := models.DocumentVersion{
		DocumentID:    doc.ID,
		VersionNumber: 1,
		MajorVersion:  1,
		MinorVersion:  0,
		FilePath:      dstPath,
		FileName:      "v1.docx",
		ChangeType:    &changeType,
		Source:        "template",
		CreatedBy:     user.ID,
	}

	if err := s.repo.CreateVersion(&version); err != nil {
		return nil, fmt.Errorf("failed to create document version: %w", err)
	}

	// Step 8: Return created document with relations
	return s.repo.FindByIDWithRelations(doc.ID)
}

func (s *DocumentService) Update(id string, ctx http.Context) (*models.Document, error) {
	user := types.GetCurrentUser(ctx)
	if user == nil {
		return nil, errors.New("unauthorized")
	}

	doc, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if doc == nil {
		return nil, errors.New("document not found")
	}

	data := ctx.Request().All()

	// Update allowed fields
	if v, ok := data["title"].(string); ok && v != "" {
		doc.Title = v
	}
	if v, ok := data["description"].(string); ok {
		if v == "" {
			doc.Description = nil
		} else {
			doc.Description = &v
		}
	}
	if v, ok := data["priority"].(string); ok && v != "" {
		doc.Priority = v
	}
	if v, ok := data["confidentiality"].(string); ok && v != "" {
		doc.Confidentiality = v
	}
	if v, ok := data["access_level"].(string); ok && v != "" {
		doc.AccessLevel = v
	}
	if v, ok := data["classification"].(string); ok && v != "" {
		doc.Classification = v
	}
	if v, ok := data["section_id"].(string); ok {
		if v == "" {
			doc.SectionID = nil
		} else {
			doc.SectionID = &v
		}
	}
	if v, ok := data["metadata"].(string); ok {
		if v == "" {
			doc.Metadata = nil
		} else {
			doc.Metadata = &v
		}
	}
	if v, ok := data["revision_notes"].(string); ok {
		doc.RevisionNotes = &v
	}

	doc.UpdatedBy = &user.ID
	doc.UpdatedAt = time.Now()

	if err := s.repo.Update(doc); err != nil {
		return nil, err
	}

	return s.repo.FindByIDWithRelations(doc.ID)
}

func (s *DocumentService) Delete(id string, ctx http.Context) error {
	user := types.GetCurrentUser(ctx)
	if user == nil {
		return errors.New("unauthorized")
	}

	doc, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}
	if doc == nil {
		return errors.New("document not found")
	}

	return s.repo.Delete(id)
}

// ---------------------------------------------------------------------------
// Versions
// ---------------------------------------------------------------------------

func (s *DocumentService) GetVersions(documentID string) ([]models.DocumentVersion, error) {
	doc, err := s.repo.FindByID(documentID)
	if err != nil {
		return nil, err
	}
	if doc == nil {
		return nil, errors.New("document not found")
	}

	return s.repo.ListVersions(documentID)
}

// ---------------------------------------------------------------------------
// Version Management
// ---------------------------------------------------------------------------

// CreateVersion creates a new version from file upload
func (s *DocumentService) CreateVersion(documentID string, ctx http.Context) (*models.DocumentVersion, error) {
	user := types.GetCurrentUser(ctx)
	if user == nil {
		return nil, errors.New("unauthorized")
	}

	// Get document
	doc, err := s.repo.FindByID(documentID)
	if err != nil {
		return nil, err
	}
	if doc == nil {
		return nil, errors.New("document not found")
	}

	// Get latest version number
	latestVer, err := s.repo.GetLatestVersionNumber(documentID)
	if err != nil {
		return nil, fmt.Errorf("failed to get latest version: %w", err)
	}
	newVerNum := latestVer + 1

	// Handle file upload
	file, err := ctx.Request().File("file")
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve file: %w", err)
	}

	// Get company and category codes for path
	companyCode, err := s.resolveCompanyCode(doc.CompanyID)
	if err != nil {
		return nil, err
	}

	categoryCode, err := s.resolveCategoryCode(doc.CategoryID)
	if err != nil {
		return nil, err
	}

	// Build file path
	now := time.Now()
	dstDir := fmt.Sprintf("%s/documents/%s/%d/%02d/%s",
		strings.ToUpper(companyCode),
		strings.ToLower(categoryCode),
		now.Year(),
		now.Month(),
		doc.FolderName,
	)
	fileName := fmt.Sprintf("v%d.docx", newVerNum)
	dstPath := fmt.Sprintf("%s/%s", dstDir, fileName)

	// Store file
	storedPath, err := file.StoreAs(dstDir, fileName)
	if err != nil {
		return nil, fmt.Errorf("failed to store file: %w", err)
	}

	// Get file size
	fileSize, _ := file.Size()

	// Create version record
	changeType := "upload"
	changeSummary := ctx.Request().Input("change_summary")
	version := models.DocumentVersion{
		DocumentID:    doc.ID,
		VersionNumber: newVerNum,
		MajorVersion:  doc.MajorVersion,
		MinorVersion:  doc.MinorVersion + 1,
		FilePath:      storedPath,
		FileName:      fileName,
		FileSize:      &fileSize,
		ChangeType:    &changeType,
		Source:        "upload",
		CreatedBy:     user.ID,
	}
	if changeSummary != "" {
		version.ChangeSummary = &changeSummary
	}

	if err := s.repo.CreateVersion(&version); err != nil {
		return nil, fmt.Errorf("failed to create version: %w", err)
	}

	// Update document
	doc.CurrentVersion = newVerNum
	doc.MinorVersion = doc.MinorVersion + 1
	doc.DraftFilePath = &dstPath
	doc.UpdatedBy = &user.ID
	doc.UpdatedAt = now

	// Update OnlyOffice key for new version
	onlyofficeKey := fmt.Sprintf("doc_%s_v%d", doc.ID, newVerNum)
	doc.OnlyofficeKey = &onlyofficeKey

	if err := s.repo.Update(doc); err != nil {
		return nil, fmt.Errorf("failed to update document: %w", err)
	}

	return s.repo.FindVersionByNumber(documentID, newVerNum)
}

// GetVersionDetail retrieves a specific version
func (s *DocumentService) GetVersionDetail(documentID string, versionNumber int) (*models.DocumentVersion, error) {
	doc, err := s.repo.FindByID(documentID)
	if err != nil {
		return nil, err
	}
	if doc == nil {
		return nil, errors.New("document not found")
	}

	version, err := s.repo.FindVersionByNumber(documentID, versionNumber)
	if err != nil {
		return nil, err
	}
	if version == nil {
		return nil, errors.New("version not found")
	}

	return version, nil
}

// GetVersionFilePath returns the file path and name for a specific version
func (s *DocumentService) GetVersionFilePath(documentID string, versionNumber int) (string, string, error) {
	doc, err := s.repo.FindByID(documentID)
	if err != nil {
		return "", "", err
	}
	if doc == nil {
		return "", "", errors.New("document not found")
	}

	version, err := s.repo.FindVersionByNumber(documentID, versionNumber)
	if err != nil {
		return "", "", err
	}
	if version == nil {
		return "", "", errors.New("version not found")
	}

	storagePath := facades.Config().GetString("filesystems.disks.local.root", "./storage/app")
	downloadName := fmt.Sprintf("%s_v%d.docx", s.sanitizeFolderName(doc.DocumentNumber), versionNumber)
	return storagePath + "/" + version.FilePath, downloadName, nil
}

// RestoreVersion creates a new version by copying from an existing version
func (s *DocumentService) RestoreVersion(documentID string, versionNumber int, ctx http.Context) (*models.Document, error) {
	user := types.GetCurrentUser(ctx)
	if user == nil {
		return nil, errors.New("unauthorized")
	}

	// Get document
	doc, err := s.repo.FindByID(documentID)
	if err != nil {
		return nil, err
	}
	if doc == nil {
		return nil, errors.New("document not found")
	}

	// Get version to restore
	sourceVersion, err := s.repo.FindVersionByNumber(documentID, versionNumber)
	if err != nil {
		return nil, err
	}
	if sourceVersion == nil {
		return nil, errors.New("version not found")
	}

	// Get latest version number
	latestVer, err := s.repo.GetLatestVersionNumber(documentID)
	if err != nil {
		return nil, fmt.Errorf("failed to get latest version: %w", err)
	}
	newVerNum := latestVer + 1

	// Get company and category codes for path
	companyCode, err := s.resolveCompanyCode(doc.CompanyID)
	if err != nil {
		return nil, err
	}

	categoryCode, err := s.resolveCategoryCode(doc.CategoryID)
	if err != nil {
		return nil, err
	}

	// Build new file path
	now := time.Now()
	dstDir := fmt.Sprintf("%s/documents/%s/%d/%02d/%s",
		strings.ToUpper(companyCode),
		strings.ToLower(categoryCode),
		now.Year(),
		now.Month(),
		doc.FolderName,
	)
	fileName := fmt.Sprintf("v%d.docx", newVerNum)
	dstPath := fmt.Sprintf("%s/%s", dstDir, fileName)

	// Copy file from source version
	if err := facades.Storage().Copy(sourceVersion.FilePath, dstPath); err != nil {
		return nil, fmt.Errorf("failed to copy version file: %w", err)
	}

	// Create version record
	changeType := "restore"
	changeSummary := fmt.Sprintf("Restored from version %d", versionNumber)
	version := models.DocumentVersion{
		DocumentID:    doc.ID,
		VersionNumber: newVerNum,
		MajorVersion:  doc.MajorVersion,
		MinorVersion:  doc.MinorVersion + 1,
		FilePath:      dstPath,
		FileName:      fileName,
		FileSize:      sourceVersion.FileSize,
		FileHash:      sourceVersion.FileHash,
		ChangeType:    &changeType,
		ChangeSummary: &changeSummary,
		Source:        "system",
		CreatedBy:     user.ID,
	}

	if err := s.repo.CreateVersion(&version); err != nil {
		return nil, fmt.Errorf("failed to create version: %w", err)
	}

	// Update document
	doc.CurrentVersion = newVerNum
	doc.MinorVersion = doc.MinorVersion + 1
	doc.DraftFilePath = &dstPath
	doc.UpdatedBy = &user.ID
	doc.UpdatedAt = now

	// Update OnlyOffice key for new version
	onlyofficeKey := fmt.Sprintf("doc_%s_v%d", doc.ID, newVerNum)
	doc.OnlyofficeKey = &onlyofficeKey

	if err := s.repo.Update(doc); err != nil {
		return nil, fmt.Errorf("failed to update document: %w", err)
	}

	return s.repo.FindByIDWithRelations(doc.ID)
}

// ---------------------------------------------------------------------------
// Download
// ---------------------------------------------------------------------------

func (s *DocumentService) GetFilePath(id string) (string, string, error) {
	doc, err := s.repo.FindByID(id)
	if err != nil {
		return "", "", err
	}
	if doc == nil {
		return "", "", errors.New("document not found")
	}

	// Prefer final file, then draft file
	var filePath string
	if doc.FinalDocxPath != nil && *doc.FinalDocxPath != "" {
		filePath = *doc.FinalDocxPath
	} else if doc.DraftFilePath != nil && *doc.DraftFilePath != "" {
		filePath = *doc.DraftFilePath
	} else {
		return "", "", errors.New("no file associated with this document")
	}

	// Resolve to full path under storage/app/
	storagePath := facades.Config().GetString("filesystems.disks.local.root", "./storage/app")
	fullPath := storagePath + "/" + filePath

	fileName := fmt.Sprintf("%s_v%d.docx", s.sanitizeFolderName(doc.DocumentNumber), doc.CurrentVersion)
	return fullPath, fileName, nil
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

func (s *DocumentService) sanitizeFolderName(docNumber string) string {
	// Replace / with -, lowercase, remove other special chars
	name := strings.ReplaceAll(docNumber, "/", "-")
	name = strings.ReplaceAll(name, "\\", "-")
	name = strings.ReplaceAll(name, " ", "-")
	return strings.ToLower(name)
}

func (s *DocumentService) resolveCompanyCode(companyID string) (string, error) {
	var company models.Company
	if err := facades.Orm().Query().Where("id = ?", companyID).First(&company); err != nil {
		return "", errors.New("company not found")
	}
	if company.ID == "" {
		return "", errors.New("company not found")
	}
	return company.Code, nil
}

func (s *DocumentService) resolveCategoryCode(categoryID string) (string, error) {
	var category models.DocumentCategory
	if err := facades.Orm().Query().Where("id = ?", categoryID).First(&category); err != nil {
		return "", errors.New("category not found")
	}
	if category.ID == "" {
		return "", errors.New("category not found")
	}
	return category.Code, nil
}
