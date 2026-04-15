package services

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/goravel/framework/contracts/filesystem"
	"github.com/goravel/framework/contracts/http"

	"dms/app/facades"
)

// Allowed extensions per module
var allowedExtensions = map[string][]string{
	"documents":   {".docx", ".pdf"},
	"templates":   {".docx"},
	"signatures":  {".png", ".jpg", ".jpeg"},
	"avatars":     {".png", ".jpg", ".jpeg"},
	"attachments": {".pdf", ".docx", ".doc", ".xlsx", ".xls", ".pptx", ".ppt", ".png", ".jpg", ".jpeg", ".gif", ".zip", ".rar", ".csv", ".txt"},
}

// Max file sizes in bytes per module
var maxFileSizes = map[string]int64{
	"documents":   50 * 1024 * 1024, // 50MB
	"templates":   20 * 1024 * 1024, // 20MB
	"signatures":  2 * 1024 * 1024,  // 2MB
	"avatars":     5 * 1024 * 1024,  // 5MB
	"attachments": 50 * 1024 * 1024, // 50MB
}

type FileUploadOptions struct {
	CompanyCode string
	Module      string // "documents", "templates", "signatures", "avatars"
	Category    string // "sop", "wi", "form", "user", etc.
	Filename    string
}

type FileService interface {
	Upload(ctx http.Context, fieldName string, opts FileUploadOptions) (string, error)
	Delete(path string) error
	Exists(path string) bool
	URL(path string) string
	BuildPath(opts FileUploadOptions) string
	WriteFile(path string, content []byte) error
}

type FileServiceImpl struct{}

func NewFileService() FileService {
	return &FileServiceImpl{}
}

func (s *FileServiceImpl) Upload(ctx http.Context, fieldName string, opts FileUploadOptions) (string, error) {
	file, err := ctx.Request().File(fieldName)
	if err != nil {
		return "", fmt.Errorf("failed to retrieve file: %w", err)
	}

	if err := s.validateModule(opts.Module); err != nil {
		return "", err
	}

	if err := s.validateExtension(file, opts.Module); err != nil {
		return "", err
	}

	if err := s.validateSize(file, opts.Module); err != nil {
		return "", err
	}

	dir := s.BuildPath(opts)
	filename := s.uniqueFilename(opts.Filename)

	storedPath, err := file.StoreAs(dir, filename)
	if err != nil {
		return "", fmt.Errorf("failed to store file: %w", err)
	}

	return storedPath, nil
}

func (s *FileServiceImpl) Delete(path string) error {
	return facades.Storage().Delete(path)
}

func (s *FileServiceImpl) Exists(path string) bool {
	return facades.Storage().Exists(path)
}

func (s *FileServiceImpl) URL(path string) string {
	return facades.Storage().Url(path)
}

// BuildPath constructs: /{company_code}/{module}/{category}/{year}/{month}
func (s *FileServiceImpl) BuildPath(opts FileUploadOptions) string {
	now := time.Now()
	return fmt.Sprintf("%s/%s/%s/%d/%02d",
		strings.ToUpper(opts.CompanyCode),
		strings.ToLower(opts.Module),
		strings.ToLower(opts.Category),
		now.Year(),
		now.Month(),
	)
}

func (s *FileServiceImpl) validateModule(module string) error {
	if _, ok := allowedExtensions[module]; !ok {
		return fmt.Errorf("invalid module: %s (allowed: documents, templates, signatures, avatars)", module)
	}
	return nil
}

func (s *FileServiceImpl) validateExtension(file filesystem.File, module string) error {
	ext := strings.ToLower(filepath.Ext(file.GetClientOriginalName()))
	allowed := allowedExtensions[module]
	for _, a := range allowed {
		if ext == a {
			return nil
		}
	}
	return fmt.Errorf("file type %s not allowed for module %s (allowed: %s)", ext, module, strings.Join(allowed, ", "))
}

func (s *FileServiceImpl) validateSize(file filesystem.File, module string) error {
	size, err := file.Size()
	if err != nil {
		return fmt.Errorf("failed to determine file size: %w", err)
	}
	max := maxFileSizes[module]
	if size > max {
		return fmt.Errorf("file size %d bytes exceeds maximum %d bytes for module %s", size, max, module)
	}
	return nil
}

func (s *FileServiceImpl) uniqueFilename(original string) string {
	ext := filepath.Ext(original)
	name := strings.TrimSuffix(original, ext)
	short := uuid.New().String()[:8]
	return fmt.Sprintf("%s-%s%s", name, short, ext)
}

func (s *FileServiceImpl) WriteFile(path string, content []byte) error {
	storagePath := s.getStoragePath()
	fullPath := fmt.Sprintf("%s/%s", storagePath, path)

	// Ensure directory exists
	dir := filepath.Dir(fullPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	return os.WriteFile(fullPath, content, 0644)
}

func (s *FileServiceImpl) getStoragePath() string {
	// Get storage path from facades or use default
	return facades.Storage().Path("")
}
