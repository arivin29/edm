package services

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"dms/app/models"
	"dms/app/repositories"

	"github.com/golang-jwt/jwt/v5"
	"github.com/goravel/framework/facades"

	contractshttp "github.com/goravel/framework/contracts/http"
)

type OnlyOfficeService struct {
	documentRepo repositories.DocumentRepository
}

func NewOnlyOfficeService() *OnlyOfficeService {
	return &OnlyOfficeService{
		documentRepo: repositories.NewDocumentRepository(),
	}
}

// EditorConfig represents the config sent to OnlyOffice JS API
type EditorConfig struct {
	Document     DocumentConfig    `json:"document"`
	DocumentType string            `json:"documentType"` // word
	EditorConfig EditorConfigInner `json:"editorConfig"`
	Token        string            `json:"token,omitempty"` // JWT if enabled
}

type DocumentConfig struct {
	FileType string   `json:"fileType"` // docx
	Key      string   `json:"key"`      // Unique document key
	Title    string   `json:"title"`    // Document title
	URL      string   `json:"url"`      // URL to download document
	Info     *DocInfo `json:"info,omitempty"`
}

type DocInfo struct {
	Owner    string `json:"owner"`
	Uploaded string `json:"uploaded"`
}

type EditorConfigInner struct {
	CallbackURL   string         `json:"callbackUrl"`
	Lang          string         `json:"lang"`
	Mode          string         `json:"mode"` // edit or view
	User          UserConfig     `json:"user"`
	Customization *Customization `json:"customization,omitempty"`
}

type UserConfig struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type Customization struct {
	Autosave       bool `json:"autosave"`
	ForceSave      bool `json:"forcesave"` // Enable manual save button
	CompactHeader  bool `json:"compactHeader"`
	CompactToolbar bool `json:"compactToolbar"`
}

// CallbackData represents OnlyOffice callback payload
type CallbackData struct {
	Key       string   `json:"key"`
	Status    int      `json:"status"`
	URL       string   `json:"url,omitempty"`
	Users     []string `json:"users,omitempty"`
	Actions   []Action `json:"actions,omitempty"`
	Forcesave int      `json:"forcesavetype,omitempty"` // 0=command, 1=timeout, 2=button
	History   *History `json:"history,omitempty"`
}

type Action struct {
	Type   int    `json:"type"` // 0=disconnect, 1=connect
	UserID string `json:"userid"`
}

type History struct {
	ServerVersion string `json:"serverVersion"`
	Changes       []any  `json:"changes"`
}

// GetEditorConfig generates OnlyOffice editor configuration
func (s *OnlyOfficeService) GetEditorConfig(documentID string, userID string, userName string, permissions []string) (*EditorConfig, error) {
	doc, err := s.documentRepo.FindByID(documentID)
	if err != nil || doc == nil {
		return nil, fmt.Errorf("document not found")
	}

	// Get base URL from config
	baseURL := facades.Config().GetString("http.url", "http://localhost:3000")
	if baseURL == "http://localhost" {
		port := facades.Config().GetString("http.port", "3000")
		baseURL = baseURL + ":" + port
	}

	// Generate download URL using OnlyOffice key (no auth needed)
	fileURL := s.generateSignedDownloadURL(baseURL, doc)

	// Callback URL for save events
	callbackURL := fmt.Sprintf("%s/api/v1/onlyoffice/callback", baseURL)

	// Determine mode based on document status and permissions
	mode := "view"
	hasEditPermission := false
	for _, p := range permissions {
		if p == "document.edit" {
			hasEditPermission = true
			break
		}
	}

	if (doc.Status == "draft" || doc.Status == "revision") && hasEditPermission {
		mode = "edit"
	}

	config := &EditorConfig{
		Document: DocumentConfig{
			FileType: "docx",
			Key:      s.getOrCreateKey(doc),
			Title:    doc.Title,
			URL:      fileURL,
			Info: &DocInfo{
				Owner:    userName,
				Uploaded: doc.CreatedAt.Format("2006-01-02"),
			},
		},
		DocumentType: "word",
		EditorConfig: EditorConfigInner{
			CallbackURL: callbackURL,
			Lang:        "id", // Indonesian
			Mode:        mode,
			User: UserConfig{
				ID:   userID,
				Name: userName,
			},
			Customization: &Customization{
				Autosave:       true,
				ForceSave:      true,
				CompactHeader:  false,
				CompactToolbar: false,
			},
		},
	}

	// Sign JWT token for OnlyOffice
	secret := facades.Config().GetString("ONLYOFFICE_JWT_SECRET", "")
	if secret != "" {
		token, err := s.signJWT(config, secret)
		if err == nil {
			config.Token = token
		}
	}

	return config, nil
}

func (s *OnlyOfficeService) getOrCreateKey(doc *models.Document) string {
	if doc.OnlyofficeKey != nil && *doc.OnlyofficeKey != "" {
		return *doc.OnlyofficeKey
	}
	// Generate unique key using UUID format
	key := fmt.Sprintf("oo%d%d", doc.CurrentVersion, time.Now().UnixNano())
	doc.OnlyofficeKey = &key
	s.documentRepo.Update(doc)
	return key
}

// HandleCallback processes OnlyOffice callback events
// OnlyOffice sends POST with JSON body containing status and document URL
func (s *OnlyOfficeService) HandleCallback(ctx contractshttp.Context) error {
	// Parse callback body
	var callback CallbackData
	if err := ctx.Request().Bind(&callback); err != nil {
		return fmt.Errorf("invalid callback data: %w", err)
	}

	// Status codes:
	// 0 - no document with the key identifier
	// 1 - document is being edited
	// 2 - document is ready for saving (closed by all users)
	// 3 - document saving error
	// 4 - document is closed with no changes
	// 6 - document is being edited but forcesave requested
	// 7 - error on forcesave

	switch callback.Status {
	case 2, 6: // Document ready for save or forcesave
		// Download the document from OnlyOffice
		if callback.URL != "" {
			if err := s.saveDocument(callback.Key, callback.URL); err != nil {
				return fmt.Errorf("failed to save document: %w", err)
			}
		}
	case 4: // Closed without changes
		// No action needed
	}

	return nil
}

func (s *OnlyOfficeService) saveDocument(key, downloadURL string) error {
	// Find document by OnlyOffice key
	doc, err := s.documentRepo.FindByOnlyOfficeKey(key)
	if err != nil || doc == nil {
		return fmt.Errorf("document not found for key: %s", key)
	}

	// Download file from OnlyOffice
	resp, err := http.Get(downloadURL)
	if err != nil {
		return fmt.Errorf("failed to download from OnlyOffice: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("OnlyOffice returned status %d", resp.StatusCode)
	}

	// Read content
	content, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read document content: %w", err)
	}

	// Save to draft file path
	if doc.DraftFilePath == nil || *doc.DraftFilePath == "" {
		// Create draft path if not exists
		draftPath := fmt.Sprintf("documents/%s/draft.docx", doc.FolderName)
		doc.DraftFilePath = &draftPath
	}

	// Write to storage
	if err := s.writeFile(*doc.DraftFilePath, content); err != nil {
		return fmt.Errorf("failed to write file: %w", err)
	}

	// Generate new key for next session
	newKey := fmt.Sprintf("oo%d%d", doc.CurrentVersion, time.Now().UnixNano())
	doc.OnlyofficeKey = &newKey

	// Update document
	if err := s.documentRepo.Update(doc); err != nil {
		return fmt.Errorf("failed to update document: %w", err)
	}

	return nil
}

// writeFile writes content to the storage path
func (s *OnlyOfficeService) writeFile(path string, content []byte) error {
	storagePath := facades.Config().GetString("filesystems.disks.local.root", "./storage/app")
	fullPath := fmt.Sprintf("%s/%s", storagePath, path)

	// Ensure directory exists
	dir := filepath.Dir(fullPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	return os.WriteFile(fullPath, content, 0644)
}

// InvalidateKey generates a new OnlyOffice key for a document
// This should be called when document content changes outside of OnlyOffice
func (s *OnlyOfficeService) InvalidateKey(documentID string) error {
	doc, err := s.documentRepo.FindByID(documentID)
	if err != nil || doc == nil {
		return fmt.Errorf("document not found")
	}

	newKey := fmt.Sprintf("oo%d%d", doc.CurrentVersion, time.Now().UnixNano())
	doc.OnlyofficeKey = &newKey

	return s.documentRepo.Update(doc)
}

// signJWT creates a JWT token for OnlyOffice Document Server
func (s *OnlyOfficeService) signJWT(config *EditorConfig, secret string) (string, error) {
	claims := jwt.MapClaims{
		"document":     config.Document,
		"documentType": config.DocumentType,
		"editorConfig": config.EditorConfig,
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

// generateSignedDownloadURL creates a download URL using the OnlyOffice key as auth
func (s *OnlyOfficeService) generateSignedDownloadURL(baseURL string, doc *models.Document) string {
	key := s.getOrCreateKey(doc)
	return fmt.Sprintf("%s/dl/%s", baseURL, key)
}

// ValidateDownloadKey validates a download key and returns the document
func (s *OnlyOfficeService) ValidateDownloadKey(key string) (string, string, error) {
	doc, err := s.documentRepo.FindByOnlyOfficeKey(key)
	if err != nil || doc == nil {
		return "", "", fmt.Errorf("invalid download key")
	}
	docService := NewDocumentService()
	return docService.GetFilePath(doc.ID)
}
