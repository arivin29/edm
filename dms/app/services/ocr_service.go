package services

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"dms/app/facades"
	"dms/app/models"
)

type OCRService struct{}

func NewOCRService() *OCRService {
	return &OCRService{}
}

type OCRResult struct {
	Text      string `json:"text"`
	PageCount int    `json:"page_count"`
	Engine    string `json:"engine"`
	Duration  string `json:"duration"`
}

// RunOCR extracts text from a document's file using Tesseract CLI
func (s *OCRService) RunOCR(documentID string) (*OCRResult, error) {
	var doc models.Document
	if err := facades.Orm().Query().Where("id = ?", documentID).First(&doc); err != nil {
		return nil, fmt.Errorf("query error: %v", err)
	}
	if doc.ID == "" {
		return nil, fmt.Errorf("document not found")
	}

	// Determine file path (prefer final, fallback to draft)
	filePath := ""
	if doc.FinalFilePath != nil && *doc.FinalFilePath != "" {
		filePath = *doc.FinalFilePath
	} else if doc.DraftFilePath != nil && *doc.DraftFilePath != "" {
		filePath = *doc.DraftFilePath
	}
	if filePath == "" {
		return nil, fmt.Errorf("no file available for OCR")
	}

	// Resolve absolute path
	if !filepath.IsAbs(filePath) {
		filePath = filepath.Join("storage/app", filePath)
	}

	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return nil, fmt.Errorf("file not found: %s", filePath)
	}

	ext := strings.ToLower(filepath.Ext(filePath))
	startTime := time.Now()

	var ocrText string
	var err error

	switch ext {
	case ".pdf":
		ocrText, err = s.ocrPDF(filePath)
	case ".png", ".jpg", ".jpeg", ".tif", ".tiff", ".bmp":
		ocrText, err = s.ocrImage(filePath)
	default:
		return nil, fmt.Errorf("unsupported file type for OCR: %s", ext)
	}

	if err != nil {
		return nil, fmt.Errorf("OCR failed: %v", err)
	}

	duration := time.Since(startTime)

	// Save OCR text to database
	ocrTextStr := strings.TrimSpace(ocrText)
	if _, err := facades.Orm().Query().Model(&models.Document{}).Where("id = ?", documentID).Update("metadata", s.buildOCRMetadata(doc.Metadata, ocrTextStr)); err != nil {
		// Non-fatal: log but continue
		fmt.Printf("Warning: could not save OCR text to metadata: %v\n", err)
	}

	// Update full-text search vector if OCR text available
	if ocrTextStr != "" {
		s.updateSearchVector(documentID, ocrTextStr)
	}

	return &OCRResult{
		Text:      ocrTextStr,
		PageCount: s.countPages(ocrTextStr),
		Engine:    "tesseract",
		Duration:  fmt.Sprintf("%.1fs", duration.Seconds()),
	}, nil
}

// GetOCRText retrieves previously extracted OCR text from document metadata
func (s *OCRService) GetOCRText(documentID string) (string, error) {
	var doc models.Document
	if err := facades.Orm().Query().Where("id = ?", documentID).First(&doc); err != nil {
		return "", err
	}
	if doc.ID == "" {
		return "", fmt.Errorf("document not found")
	}

	if doc.Metadata == nil {
		return "", nil
	}

	var metaMap map[string]interface{}
	if err := json.Unmarshal([]byte(*doc.Metadata), &metaMap); err != nil {
		return "", nil
	}

	text, _ := metaMap["ocr_text"].(string)
	return text, nil
}

// ocrPDF converts PDF pages to images then runs Tesseract
func (s *OCRService) ocrPDF(pdfPath string) (string, error) {
	// Use pdftoppm to convert PDF to images, then run Tesseract on each
	tmpDir, err := os.MkdirTemp("", "ocr-*")
	if err != nil {
		return "", err
	}
	defer os.RemoveAll(tmpDir)

	// Convert PDF to PNG images using pdftoppm (from poppler-utils)
	imgPrefix := filepath.Join(tmpDir, "page")
	cmd := exec.Command("pdftoppm", "-png", "-r", "300", pdfPath, imgPrefix)
	if output, err := cmd.CombinedOutput(); err != nil {
		// Fallback: try using convert (ImageMagick)
		cmd2 := exec.Command("convert", "-density", "300", pdfPath, filepath.Join(tmpDir, "page-%03d.png"))
		if output2, err2 := cmd2.CombinedOutput(); err2 != nil {
			return "", fmt.Errorf("pdftoppm failed: %s; convert also failed: %s", string(output), string(output2))
		}
	}

	// Find generated images and sort numerically
	matches, err := filepath.Glob(filepath.Join(tmpDir, "page*.png"))
	if err != nil || len(matches) == 0 {
		return "", fmt.Errorf("no page images generated")
	}
	sort.Strings(matches)

	var allText strings.Builder
	for i, imgPath := range matches {
		if i > 0 {
			allText.WriteString("\n\n--- Page " + fmt.Sprintf("%d", i+1) + " ---\n\n")
		}
		text, err := s.ocrImage(imgPath)
		if err != nil {
			allText.WriteString(fmt.Sprintf("[OCR Error on page %d: %v]", i+1, err))
			continue
		}
		allText.WriteString(text)
	}
	return allText.String(), nil
}

// ocrImage runs Tesseract on a single image file
func (s *OCRService) ocrImage(imagePath string) (string, error) {
	// Run tesseract with Indonesian + English language
	cmd := exec.Command("tesseract", imagePath, "stdout", "-l", "ind+eng", "--oem", "3", "--psm", "6")
	output, err := cmd.CombinedOutput()
	if err != nil {
		// Try without Indonesian language pack
		cmd2 := exec.Command("tesseract", imagePath, "stdout", "-l", "eng", "--oem", "3", "--psm", "6")
		output2, err2 := cmd2.CombinedOutput()
		if err2 != nil {
			return "", fmt.Errorf("tesseract failed: %s", string(output))
		}
		return string(output2), nil
	}
	return string(output), nil
}

// buildOCRMetadata merges OCR text into existing metadata JSON
func (s *OCRService) buildOCRMetadata(existingMeta *string, ocrText string) string {
	var metaMap map[string]interface{}

	if existingMeta != nil && *existingMeta != "" && *existingMeta != "null" {
		if err := json.Unmarshal([]byte(*existingMeta), &metaMap); err != nil {
			metaMap = make(map[string]interface{})
		}
	} else {
		metaMap = make(map[string]interface{})
	}

	// Truncate if too long (keep first 50KB)
	if len(ocrText) > 50000 {
		ocrText = ocrText[:50000] + "...[truncated]"
	}

	metaMap["ocr_text"] = ocrText
	metaMap["ocr_at"] = time.Now().Format(time.RFC3339)

	result, err := json.Marshal(metaMap)
	if err != nil {
		return fmt.Sprintf(`{"ocr_text":"%s"}`, "error marshaling metadata")
	}
	return string(result)
}

// updateSearchVector adds OCR text to the full-text search vector
func (s *OCRService) updateSearchVector(documentID, ocrText string) {
	// Truncate for tsvector (PostgreSQL has limits)
	if len(ocrText) > 100000 {
		ocrText = ocrText[:100000]
	}
	// Use 'simple' config to match document_repository search queries
	sql := `UPDATE documents SET search_vector = 
		setweight(to_tsvector('simple', coalesce(document_number, '') || ' ' || coalesce(title, '')), 'A') ||
		setweight(to_tsvector('simple', coalesce(description, '') || ' ' || $1), 'C')
		WHERE id = $2`
	facades.Orm().Query().Exec(sql, ocrText, documentID)
}

func (s *OCRService) countPages(text string) int {
	count := 1
	for _, line := range strings.Split(text, "\n") {
		if strings.HasPrefix(strings.TrimSpace(line), "--- Page ") {
			count++
		}
	}
	return count
}

// CheckTesseract verifies if Tesseract and PDF tools are installed
func (s *OCRService) CheckTesseract() (bool, string) {
	cmd := exec.Command("tesseract", "--version")
	output, err := cmd.CombinedOutput()
	if err != nil {
		return false, "Tesseract not installed"
	}
	version := "installed"
	lines := strings.Split(string(output), "\n")
	if len(lines) > 0 {
		version = strings.TrimSpace(lines[0])
	}

	// Check pdftoppm for PDF support
	cmd2 := exec.Command("pdftoppm", "-v")
	if _, err := cmd2.CombinedOutput(); err != nil {
		return true, version + " (tanpa PDF support - install poppler-utils)"
	}

	return true, version
}
