package services

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
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

	// Extract ocr_text from metadata JSON
	// Simple approach: parse and look for ocr_text field
	metadata := *doc.Metadata
	idx := strings.Index(metadata, `"ocr_text":"`)
	if idx == -1 {
		return "", nil
	}
	start := idx + len(`"ocr_text":"`)
	end := strings.Index(metadata[start:], `"`)
	if end == -1 {
		return "", nil
	}
	text := metadata[start : start+end]
	// Unescape basic JSON escapes
	text = strings.ReplaceAll(text, `\n`, "\n")
	text = strings.ReplaceAll(text, `\t`, "\t")
	text = strings.ReplaceAll(text, `\\`, "\\")
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

	// Find generated images
	matches, err := filepath.Glob(filepath.Join(tmpDir, "page*.png"))
	if err != nil || len(matches) == 0 {
		return "", fmt.Errorf("no page images generated")
	}

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
	// Escape OCR text for JSON
	escaped := strings.ReplaceAll(ocrText, "\\", "\\\\")
	escaped = strings.ReplaceAll(escaped, "\"", "\\\"")
	escaped = strings.ReplaceAll(escaped, "\n", "\\n")
	escaped = strings.ReplaceAll(escaped, "\t", "\\t")
	escaped = strings.ReplaceAll(escaped, "\r", "")

	// Truncate if too long (keep first 50KB for metadata)
	if len(escaped) > 50000 {
		escaped = escaped[:50000] + "...[truncated]"
	}

	ocrField := fmt.Sprintf(`"ocr_text":"%s","ocr_at":"%s"`, escaped, time.Now().Format(time.RFC3339))

	if existingMeta == nil || *existingMeta == "" || *existingMeta == "{}" || *existingMeta == "null" {
		return fmt.Sprintf(`{%s}`, ocrField)
	}

	// Remove existing ocr fields and append new ones
	meta := *existingMeta
	meta = s.removeJSONField(meta, "ocr_text")
	meta = s.removeJSONField(meta, "ocr_at")

	// Insert before closing brace
	if strings.HasSuffix(strings.TrimSpace(meta), "}") {
		trimmed := strings.TrimSpace(meta)
		inner := trimmed[1 : len(trimmed)-1]
		inner = strings.TrimSpace(inner)
		if inner != "" {
			return fmt.Sprintf(`{%s,%s}`, inner, ocrField)
		}
		return fmt.Sprintf(`{%s}`, ocrField)
	}
	return fmt.Sprintf(`{%s}`, ocrField)
}

func (s *OCRService) removeJSONField(json, field string) string {
	// Simple removal of "field":"value" patterns (handles basic cases)
	patterns := []string{
		fmt.Sprintf(`"%s":"`, field),
	}
	for _, pattern := range patterns {
		idx := strings.Index(json, pattern)
		if idx == -1 {
			continue
		}
		// Find end of value
		start := idx
		valStart := idx + len(pattern)
		end := valStart
		escaped := false
		for end < len(json) {
			if escaped {
				escaped = false
				end++
				continue
			}
			if json[end] == '\\' {
				escaped = true
				end++
				continue
			}
			if json[end] == '"' {
				end++ // include closing quote
				break
			}
			end++
		}
		// Remove trailing comma if present
		if end < len(json) && json[end] == ',' {
			end++
		} else if start > 0 && json[start-1] == ',' {
			start--
		}
		json = json[:start] + json[end:]
	}
	return json
}

// updateSearchVector adds OCR text to the full-text search vector
func (s *OCRService) updateSearchVector(documentID, ocrText string) {
	// Truncate for tsvector (PostgreSQL has limits)
	if len(ocrText) > 100000 {
		ocrText = ocrText[:100000]
	}
	sql := `UPDATE documents SET search_vector = 
		setweight(to_tsvector('indonesian', coalesce(document_number, '') || ' ' || coalesce(title, '')), 'A') ||
		setweight(to_tsvector('indonesian', coalesce(description, '') || ' ' || $1), 'C')
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

// CheckTesseract verifies if Tesseract is installed
func (s *OCRService) CheckTesseract() (bool, string) {
	cmd := exec.Command("tesseract", "--version")
	output, err := cmd.CombinedOutput()
	if err != nil {
		return false, "Tesseract not installed"
	}
	lines := strings.Split(string(output), "\n")
	if len(lines) > 0 {
		return true, strings.TrimSpace(lines[0])
	}
	return true, "installed"
}
