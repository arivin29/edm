package services

import (
	"errors"
	"time"

	"github.com/goravel/framework/contracts/http"

	"dms/app/facades"
	"dms/app/models"
	"dms/app/repositories"
	"dms/app/types"
)

type TemplateService struct {
	repo        repositories.TemplateRepository
	fileService FileService
}

func NewTemplateService() *TemplateService {
	return &TemplateService{
		repo:        repositories.NewTemplateRepository(),
		fileService: NewFileService(),
	}
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

func (s *TemplateService) List(ctx http.Context) ([]models.DocumentTemplate, map[string]any, error) {
	filters := buildFilters(ctx, []string{
		"search", "company_id", "document_type_id", "category_id", "status", "is_active",
		"sort_by", "sort_dir",
	})

	// Scope to user's company
	user := types.GetCurrentUser(ctx)
	if user != nil && user.CompanyID != "" {
		filters["company_id"] = user.CompanyID
	}

	items, total, err := s.repo.List(filters)
	if err != nil {
		return nil, nil, err
	}
	return items, paginationMeta(filters, total), nil
}

func (s *TemplateService) Show(id string) (*models.DocumentTemplate, error) {
	return s.repo.FindByIDWithRelations(id)
}

func (s *TemplateService) Create(ctx http.Context) (*models.DocumentTemplate, error) {
	user := types.GetCurrentUser(ctx)
	if user == nil {
		return nil, errors.New("unauthorized")
	}

	// Resolve company code for file path
	companyCode, err := s.resolveCompanyCode(user.CompanyID)
	if err != nil {
		return nil, err
	}

	// Upload file
	filePath, err := s.fileService.Upload(ctx, "file", FileUploadOptions{
		CompanyCode: companyCode,
		Module:      "templates",
		Category:    "docx",
		Filename:    s.getUploadedFileName(ctx),
	})
	if err != nil {
		return nil, err
	}

	fileSize := s.getUploadedFileSize(ctx)

	// Validate unique code per company
	if code := ctx.Request().Input("code"); code != "" {
		existing, _ := s.repo.FindByCodeAndCompany(code, user.CompanyID)
		if existing != nil {
			return nil, errors.New("template code already exists for this company")
		}
	}

	t := models.DocumentTemplate{
		CompanyID:      user.CompanyID,
		DocumentTypeID: ctx.Request().Input("document_type_id"),
		Name:           ctx.Request().Input("name"),
		FilePath:       filePath,
		FileName:       s.getUploadedFileName(ctx),
		FileSize:       fileSize,
		Status:         "active",
		IsActive:       true,
		Version:        1,
		CreatedBy:      user.ID,
	}

	if v := ctx.Request().Input("category_id"); v != "" {
		t.CategoryID = &v
	}
	if v := ctx.Request().Input("code"); v != "" {
		t.Code = &v
	}
	if v := ctx.Request().Input("description"); v != "" {
		t.Description = &v
	}
	if v := ctx.Request().Input("version_notes"); v != "" {
		t.VersionNotes = &v
	}
	if v := ctx.Request().Input("status"); v != "" {
		t.Status = v
	}

	if err := s.repo.Create(&t); err != nil {
		return nil, err
	}

	return s.repo.FindByIDWithRelations(t.ID)
}

func (s *TemplateService) Update(id string, ctx http.Context) (*models.DocumentTemplate, error) {
	user := types.GetCurrentUser(ctx)
	if user == nil {
		return nil, errors.New("unauthorized")
	}

	t, err := s.repo.FindByID(id)
	if err != nil {
		return nil, errors.New("template not found")
	}

	data := ctx.Request().All()

	if code, ok := data["code"].(string); ok && code != "" {
		if t.Code == nil || code != *t.Code {
			existing, _ := s.repo.FindByCodeAndCompany(code, t.CompanyID)
			if existing != nil && existing.ID != t.ID {
				return nil, errors.New("template code already exists for this company")
			}
			t.Code = &code
		}
	}
	if v, ok := data["name"].(string); ok && v != "" {
		t.Name = v
	}
	if v, ok := data["document_type_id"].(string); ok && v != "" {
		t.DocumentTypeID = v
	}
	if v, ok := data["category_id"].(string); ok {
		if v == "" {
			t.CategoryID = nil
		} else {
			t.CategoryID = &v
		}
	}
	if v, ok := data["description"].(string); ok {
		t.Description = &v
	}
	if v, ok := data["version_notes"].(string); ok {
		t.VersionNotes = &v
	}
	if v, ok := data["status"].(string); ok && v != "" {
		t.Status = v
	}
	if v, ok := data["is_active"].(bool); ok {
		t.IsActive = v
	}

	t.UpdatedBy = &user.ID
	t.UpdatedAt = time.Now()

	if err := s.repo.Update(t); err != nil {
		return nil, err
	}

	return s.repo.FindByIDWithRelations(t.ID)
}

func (s *TemplateService) Delete(id string) error {
	if _, err := s.repo.FindByID(id); err != nil {
		return errors.New("template not found")
	}
	return s.repo.Delete(id)
}

func (s *TemplateService) UploadFile(id string, ctx http.Context) (*models.DocumentTemplate, error) {
	user := types.GetCurrentUser(ctx)
	if user == nil {
		return nil, errors.New("unauthorized")
	}

	t, err := s.repo.FindByID(id)
	if err != nil {
		return nil, errors.New("template not found")
	}

	companyCode, err := s.resolveCompanyCode(t.CompanyID)
	if err != nil {
		return nil, err
	}

	// Delete old file
	if t.FilePath != "" {
		_ = s.fileService.Delete(t.FilePath)
	}

	filePath, err := s.fileService.Upload(ctx, "file", FileUploadOptions{
		CompanyCode: companyCode,
		Module:      "templates",
		Category:    "docx",
		Filename:    s.getUploadedFileName(ctx),
	})
	if err != nil {
		return nil, err
	}

	t.FilePath = filePath
	t.FileName = s.getUploadedFileName(ctx)
	t.FileSize = s.getUploadedFileSize(ctx)
	t.Version = t.Version + 1
	t.UpdatedBy = &user.ID
	t.UpdatedAt = time.Now()

	if v := ctx.Request().Input("version_notes"); v != "" {
		t.VersionNotes = &v
	}

	if err := s.repo.Update(t); err != nil {
		return nil, err
	}

	return s.repo.FindByIDWithRelations(t.ID)
}

func (s *TemplateService) GetFilePath(id string) (string, string, error) {
	t, err := s.repo.FindByID(id)
	if err != nil {
		return "", "", errors.New("template not found")
	}
	if t.FilePath == "" {
		return "", "", errors.New("no file associated with this template")
	}
	return t.FilePath, t.FileName, nil
}

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------

func (s *TemplateService) ListTags(templateID string) ([]models.TemplateTag, error) {
	if _, err := s.repo.FindByID(templateID); err != nil {
		return nil, errors.New("template not found")
	}
	return s.repo.ListTags(templateID)
}

func (s *TemplateService) CreateTag(templateID string, tag *models.TemplateTag) error {
	if _, err := s.repo.FindByID(templateID); err != nil {
		return errors.New("template not found")
	}
	tag.TemplateID = templateID
	return s.repo.CreateTag(tag)
}

func (s *TemplateService) UpdateTag(templateID, tagID string, data map[string]any) (*models.TemplateTag, error) {
	tag, err := s.repo.FindTagByID(tagID)
	if err != nil {
		return nil, errors.New("tag not found")
	}
	if tag.TemplateID != templateID {
		return nil, errors.New("tag does not belong to this template")
	}

	if v, ok := data["tag_key"].(string); ok && v != "" {
		tag.TagKey = v
	}
	if v, ok := data["tag_placeholder"].(string); ok && v != "" {
		tag.TagPlaceholder = v
	}
	if v, ok := data["label"].(string); ok && v != "" {
		tag.Label = v
	}
	if v, ok := data["description"].(string); ok {
		tag.Description = &v
	}
	if v, ok := data["data_type"].(string); ok && v != "" {
		tag.DataType = v
	}
	if v, ok := data["source_type"].(string); ok {
		tag.SourceType = v
	}
	if v, ok := data["source_config"].(string); ok {
		tag.SourceConfig = &v
	}
	if v, ok := data["format_pattern"].(string); ok {
		tag.FormatPattern = &v
	}
	if v, ok := data["default_value"].(string); ok {
		tag.DefaultValue = &v
	}
	if v, ok := data["placeholder_text"].(string); ok {
		tag.PlaceholderText = &v
	}
	if v, ok := data["is_required"].(bool); ok {
		tag.IsRequired = v
	}
	if v, ok := data["is_readonly"].(bool); ok {
		tag.IsReadonly = v
	}
	if v, ok := data["is_hidden"].(bool); ok {
		tag.IsHidden = v
	}
	if v, ok := data["validation_regex"].(string); ok {
		tag.ValidationRegex = &v
	}
	if v, ok := data["validation_message"].(string); ok {
		tag.ValidationMessage = &v
	}
	if v, ok := data["group_name"].(string); ok {
		tag.GroupName = &v
	}
	if v, ok := data["group_order"].(float64); ok {
		tag.GroupOrder = int(v)
	}
	if v, ok := data["field_order"].(float64); ok {
		tag.FieldOrder = int(v)
	}
	if v, ok := data["col_span"].(float64); ok {
		tag.ColSpan = int(v)
	}
	if v, ok := data["table_config"].(string); ok {
		tag.TableConfig = &v
	}
	if v, ok := data["signature_config"].(string); ok {
		tag.SignatureConfig = &v
	}
	if v, ok := data["min_length"].(float64); ok {
		i := int(v)
		tag.MinLength = &i
	}
	if v, ok := data["max_length"].(float64); ok {
		i := int(v)
		tag.MaxLength = &i
	}
	if v, ok := data["min_value"].(float64); ok {
		tag.MinValue = &v
	}
	if v, ok := data["max_value"].(float64); ok {
		tag.MaxValue = &v
	}

	if err := s.repo.UpdateTag(tag); err != nil {
		return nil, err
	}
	return tag, nil
}

func (s *TemplateService) DeleteTag(templateID, tagID string) error {
	tag, err := s.repo.FindTagByID(tagID)
	if err != nil {
		return errors.New("tag not found")
	}
	if tag.TemplateID != templateID {
		return errors.New("tag does not belong to this template")
	}
	return s.repo.DeleteTag(tagID)
}

func (s *TemplateService) BulkUpsertTags(templateID string, tags []models.TemplateTag) ([]models.TemplateTag, error) {
	if _, err := s.repo.FindByID(templateID); err != nil {
		return nil, errors.New("template not found")
	}
	if err := s.repo.BulkUpsertTags(templateID, tags); err != nil {
		return nil, err
	}
	return s.repo.ListTags(templateID)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

func (s *TemplateService) resolveCompanyCode(companyID string) (string, error) {
	var company models.Company
	if err := facades.Orm().Query().Where("id = ?", companyID).First(&company); err != nil {
		return "", errors.New("company not found")
	}
	return company.Code, nil
}

func (s *TemplateService) getUploadedFileName(ctx http.Context) string {
	file, err := ctx.Request().File("file")
	if err != nil {
		return "template.docx"
	}
	return file.GetClientOriginalName()
}

func (s *TemplateService) getUploadedFileSize(ctx http.Context) *int64 {
	file, err := ctx.Request().File("file")
	if err != nil {
		return nil
	}
	size, err := file.Size()
	if err != nil {
		return nil
	}
	return &size
}
