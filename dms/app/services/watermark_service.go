package services

import (
	"bytes"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	pdfcpuapi "github.com/pdfcpu/pdfcpu/pkg/api"
	"github.com/pdfcpu/pdfcpu/pkg/pdfcpu/model"
	"github.com/pdfcpu/pdfcpu/pkg/pdfcpu/types"
)

type WatermarkService struct {
	settingService *SettingService
}

func NewWatermarkService() *WatermarkService {
	return &WatermarkService{
		settingService: NewSettingService(),
	}
}

type WatermarkConfig struct {
	Enabled    bool    `json:"enabled"`
	Text       string  `json:"text"`
	Color      string  `json:"color"`
	Opacity    float64 `json:"opacity"`
	FontSize   int     `json:"font_size"`
	Rotation   int     `json:"rotation"`
	Position   string  `json:"position"` // "diagonal", "center", "header", "footer"
}

// GetWatermarkConfig returns watermark config for a given classification
func (s *WatermarkService) GetWatermarkConfig(classification string) WatermarkConfig {
	defaults := map[string]WatermarkConfig{
		"public": {
			Enabled: false, Text: "", Color: "#22c55e", Opacity: 0.15,
			FontSize: 48, Rotation: 45, Position: "diagonal",
		},
		"internal": {
			Enabled: true, Text: "INTERNAL", Color: "#3b82f6", Opacity: 0.12,
			FontSize: 48, Rotation: 45, Position: "diagonal",
		},
		"confidential": {
			Enabled: true, Text: "CONFIDENTIAL", Color: "#f97316", Opacity: 0.15,
			FontSize: 48, Rotation: 45, Position: "diagonal",
		},
		"secret": {
			Enabled: true, Text: "RAHASIA - SANGAT RAHASIA", Color: "#ef4444", Opacity: 0.20,
			FontSize: 48, Rotation: 45, Position: "diagonal",
		},
	}

	cfg, ok := defaults[classification]
	if !ok {
		cfg = defaults["internal"]
	}

	// Override from settings if available
	if setting, err := s.settingService.GetByKey(nil, nil, fmt.Sprintf("watermark.%s.enabled", classification)); err == nil && setting != nil {
		cfg.Enabled = setting.Value == "true"
	}
	if setting, err := s.settingService.GetByKey(nil, nil, fmt.Sprintf("watermark.%s.text", classification)); err == nil && setting != nil && setting.Value != "" {
		cfg.Text = setting.Value
	}
	if setting, err := s.settingService.GetByKey(nil, nil, "watermark.global.enabled"); err == nil && setting != nil {
		if setting.Value == "false" {
			cfg.Enabled = false
		}
	}

	return cfg
}

// ApplyWatermarkToPDF adds a text watermark to a PDF file
func (s *WatermarkService) ApplyWatermarkToPDF(inputPath string, classification string) ([]byte, error) {
	cfg := s.GetWatermarkConfig(classification)
	if !cfg.Enabled || cfg.Text == "" {
		// No watermark needed, return original
		data, err := os.ReadFile(inputPath)
		if err != nil {
			return nil, fmt.Errorf("failed to read file: %w", err)
		}
		return data, nil
	}

	data, err := os.ReadFile(inputPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read PDF: %w", err)
	}

	in := bytes.NewReader(data)
	var out bytes.Buffer

	// Build pdfcpu watermark description
	desc := fmt.Sprintf("font:Helvetica, points:%d, col:%s, rot:%d, op:%.2f, sc:1 abs, pos:c",
		cfg.FontSize, s.hexToRGB(cfg.Color), cfg.Rotation, cfg.Opacity)

	onTop := true
	wm, err := pdfcpuapi.TextWatermark(cfg.Text, desc, onTop, false, types.POINTS)
	if err != nil {
		return nil, fmt.Errorf("failed to create watermark: %w", err)
	}

	conf := model.NewDefaultConfiguration()
	if err := pdfcpuapi.AddWatermarks(in, &out, nil, wm, conf); err != nil {
		return nil, fmt.Errorf("failed to apply watermark: %w", err)
	}

	return out.Bytes(), nil
}

// ConvertDocxToPDF converts DOCX to PDF using LibreOffice (if available)
func (s *WatermarkService) ConvertDocxToPDF(inputPath string) (string, error) {
	// Check if libreoffice/soffice is available
	soffice, err := exec.LookPath("soffice")
	if err != nil {
		soffice, err = exec.LookPath("libreoffice")
		if err != nil {
			return "", fmt.Errorf("LibreOffice not found - install for DOCX to PDF conversion")
		}
	}

	tmpDir, err := os.MkdirTemp("", "watermark-*")
	if err != nil {
		return "", fmt.Errorf("failed to create temp dir: %w", err)
	}

	cmd := exec.Command(soffice, "--headless", "--convert-to", "pdf", "--outdir", tmpDir, inputPath)
	if output, err := cmd.CombinedOutput(); err != nil {
		os.RemoveAll(tmpDir)
		return "", fmt.Errorf("conversion failed: %s - %w", string(output), err)
	}

	// Find the output PDF
	baseName := strings.TrimSuffix(filepath.Base(inputPath), filepath.Ext(inputPath))
	pdfPath := filepath.Join(tmpDir, baseName+".pdf")

	if _, err := os.Stat(pdfPath); os.IsNotExist(err) {
		os.RemoveAll(tmpDir)
		return "", fmt.Errorf("converted PDF not found")
	}

	return pdfPath, nil
}

// GetWatermarkedFile returns the file bytes with watermark applied
// For PDFs: direct watermark. For DOCX: convert to PDF then watermark (if LibreOffice available)
func (s *WatermarkService) GetWatermarkedFile(filePath string, classification string) ([]byte, string, error) {
	ext := strings.ToLower(filepath.Ext(filePath))

	switch ext {
	case ".pdf":
		data, err := s.ApplyWatermarkToPDF(filePath, classification)
		if err != nil {
			return nil, "", err
		}
		return data, "application/pdf", nil

	case ".docx", ".doc", ".xlsx", ".xls", ".pptx", ".ppt":
		// Try to convert to PDF and watermark
		pdfPath, err := s.ConvertDocxToPDF(filePath)
		if err != nil {
			// LibreOffice not available — return original file without watermark
			data, readErr := os.ReadFile(filePath)
			if readErr != nil {
				return nil, "", readErr
			}
			mimeType := getMimeType(ext)
			return data, mimeType, nil
		}
		defer os.RemoveAll(filepath.Dir(pdfPath))

		data, err := s.ApplyWatermarkToPDF(pdfPath, classification)
		if err != nil {
			return nil, "", err
		}
		return data, "application/pdf", nil

	default:
		// Unsupported format, return as-is
		data, err := os.ReadFile(filePath)
		if err != nil {
			return nil, "", err
		}
		return data, getMimeType(ext), nil
	}
}

// hexToRGB converts hex color to pdfcpu RGB format
func (s *WatermarkService) hexToRGB(hex string) string {
	hex = strings.TrimPrefix(hex, "#")
	if len(hex) != 6 {
		return "0.5 0.5 0.5" // default gray
	}

	r := hexToDec(hex[0:2])
	g := hexToDec(hex[2:4])
	b := hexToDec(hex[4:6])

	return fmt.Sprintf("%.2f %.2f %.2f", float64(r)/255, float64(g)/255, float64(b)/255)
}

func hexToDec(s string) int {
	val := 0
	for _, c := range strings.ToLower(s) {
		val *= 16
		if c >= '0' && c <= '9' {
			val += int(c - '0')
		} else if c >= 'a' && c <= 'f' {
			val += int(c-'a') + 10
		}
	}
	return val
}

func getMimeType(ext string) string {
	types := map[string]string{
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
	}
	if t, ok := types[ext]; ok {
		return t
	}
	return "application/octet-stream"
}
