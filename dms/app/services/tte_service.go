package services

import (
	"crypto/sha256"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"time"

	"dms/app/facades"
	"dms/app/models"
)

type TTEService struct{}

func NewTTEService() *TTEService {
	return &TTEService{}
}

type SignRequest struct {
	DocumentID string
	SignerID   string
	IPAddress  string
}

type TTEConfig struct {
	Provider    string `json:"provider"`     // internal, privy, vida, peruri
	Enabled     bool   `json:"enabled"`
	APIKey      string `json:"api_key"`
	APISecret   string `json:"api_secret"`
	CallbackURL string `json:"callback_url"`
}

// SignDocument creates a digital signature for a document
func (s *TTEService) SignDocument(req SignRequest) (*models.DigitalSignature, error) {
	// Load document
	var doc models.Document
	if err := facades.Orm().Query().Where("id = ?", req.DocumentID).First(&doc); err != nil {
		return nil, fmt.Errorf("query error: %v", err)
	}
	if doc.ID == "" {
		return nil, fmt.Errorf("document not found")
	}

	// Load signer with position/department
	var user models.User
	if err := facades.Orm().Query().With("Department").With("Position").Where("id = ?", req.SignerID).First(&user); err != nil {
		return nil, fmt.Errorf("signer not found: %v", err)
	}
	if user.ID == "" {
		return nil, fmt.Errorf("signer not found")
	}

	// Check if user has a signature image
	if user.SignaturePath == nil || *user.SignaturePath == "" {
		return nil, fmt.Errorf("penanda tangan belum memiliki tanda tangan digital. Silakan upload di halaman profil")
	}

	// Check if already signed by this user for this version
	var existing models.DigitalSignature
	facades.Orm().Query().
		Where("document_id = ? AND signer_id = ? AND version_number = ? AND status != 'revoked'", doc.ID, req.SignerID, doc.CurrentVersion).
		First(&existing)
	if existing.ID != "" {
		return nil, fmt.Errorf("dokumen sudah ditandatangani oleh pengguna ini pada versi %d", doc.CurrentVersion)
	}

	// Compute document hash
	docHash, err := s.computeDocumentHash(doc)
	if err != nil {
		docHash = ""
	}

	// Build signer info
	var position, department string
	if user.Position != nil {
		position = user.Position.Name
	}
	if user.Department != nil {
		department = user.Department.Name
	}

	now := time.Now()
	sig := models.DigitalSignature{
		DocumentID:         doc.ID,
		VersionNumber:      doc.CurrentVersion,
		SignerID:            req.SignerID,
		SignerName:          user.Name,
		SignerPosition:      &position,
		SignerDepartment:    &department,
		SignatureType:       "internal",
		SignatureImagePath:  user.SignaturePath,
		Provider:            "internal",
		HashAlgorithm:       "sha256",
		DocumentHash:        &docHash,
		Status:              "signed",
		SignedAt:            now,
		IPAddress:           &req.IPAddress,
	}

	if err := facades.Orm().Query().Create(&sig); err != nil {
		return nil, fmt.Errorf("gagal menyimpan tanda tangan: %v", err)
	}

	// Reload with relations
	facades.Orm().Query().With("Signer").Where("id = ?", sig.ID).First(&sig)

	return &sig, nil
}

// ListSignatures returns all signatures for a document
func (s *TTEService) ListSignatures(documentID string) ([]models.DigitalSignature, error) {
	var signatures []models.DigitalSignature
	if err := facades.Orm().Query().
		With("Signer").
		Where("document_id = ?", documentID).
		Order("signed_at ASC").
		Find(&signatures); err != nil {
		return nil, err
	}
	return signatures, nil
}

// VerifySignature verifies a signature's hash against current document
func (s *TTEService) VerifySignature(signatureID string) (*models.DigitalSignature, bool, error) {
	var sig models.DigitalSignature
	if err := facades.Orm().Query().Where("id = ?", signatureID).First(&sig); err != nil {
		return nil, false, err
	}
	if sig.ID == "" {
		return nil, false, fmt.Errorf("signature not found")
	}

	if sig.Status == "revoked" {
		return &sig, false, fmt.Errorf("tanda tangan telah dicabut")
	}

	// Load document and compute current hash
	var doc models.Document
	facades.Orm().Query().Where("id = ?", sig.DocumentID).First(&doc)
	if doc.ID == "" {
		return &sig, false, fmt.Errorf("document not found")
	}

	currentHash, err := s.computeDocumentHash(doc)
	if err != nil {
		return &sig, false, fmt.Errorf("gagal menghitung hash: %v", err)
	}

	// Compare hashes
	valid := sig.DocumentHash != nil && *sig.DocumentHash == currentHash

	if valid {
		now := time.Now()
		sig.VerifiedAt = &now
		sig.Status = "verified"
		facades.Orm().Query().Save(&sig)
	}

	return &sig, valid, nil
}

// RevokeSignature revokes a signature
func (s *TTEService) RevokeSignature(signatureID, reason string) error {
	var sig models.DigitalSignature
	if err := facades.Orm().Query().Where("id = ?", signatureID).First(&sig); err != nil {
		return err
	}
	if sig.ID == "" {
		return fmt.Errorf("signature not found")
	}
	if sig.Status == "revoked" {
		return fmt.Errorf("tanda tangan sudah dicabut")
	}

	now := time.Now()
	sig.Status = "revoked"
	sig.RevokedAt = &now
	sig.RevokeReason = &reason

	return facades.Orm().Query().Save(&sig)
}

// GetTTEConfig returns TTE provider configuration
func (s *TTEService) GetTTEConfig() (*TTEConfig, error) {
	settingService := NewSettingService()
	provider, _ := settingService.GetByKey(nil, nil, "tte_provider")
	enabled, _ := settingService.GetByKey(nil, nil, "tte_enabled")

	config := &TTEConfig{
		Provider: "internal",
		Enabled:  false,
	}

	if provider != nil && provider.Value != "" {
		config.Provider = provider.Value
	}
	if enabled != nil && enabled.Value == "true" {
		config.Enabled = true
	}

	return config, nil
}

// computeDocumentHash computes SHA-256 hash of the document file
func (s *TTEService) computeDocumentHash(doc models.Document) (string, error) {
	filePath := ""
	if doc.FinalFilePath != nil && *doc.FinalFilePath != "" {
		filePath = *doc.FinalFilePath
	} else if doc.DraftFilePath != nil && *doc.DraftFilePath != "" {
		filePath = *doc.DraftFilePath
	}
	if filePath == "" {
		return "", fmt.Errorf("no file available")
	}

	if !filepath.IsAbs(filePath) {
		filePath = filepath.Join("storage/app", filePath)
	}

	f, err := os.Open(filePath)
	if err != nil {
		return "", err
	}
	defer f.Close()

	h := sha256.New()
	if _, err := io.Copy(h, f); err != nil {
		return "", err
	}

	return fmt.Sprintf("%x", h.Sum(nil)), nil
}
