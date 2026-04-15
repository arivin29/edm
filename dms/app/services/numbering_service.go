package services

import (
	"errors"
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/goravel/framework/contracts/http"

	"dms/app/facades"
	"dms/app/models"
	"dms/app/repositories"
)

var romanMonths = []string{"I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"}

var seqRegex = regexp.MustCompile(`\{SEQ:(\d+)\}`)

type NumberingService struct {
	repo repositories.NumberingRepository
}

func NewNumberingService() *NumberingService {
	return &NumberingService{
		repo: repositories.NewNumberingRepository(),
	}
}

func (s *NumberingService) List(ctx http.Context) ([]models.DocumentNumbering, map[string]any, error) {
	filters := buildFilters(ctx, []string{"company_id", "document_type_id"})
	items, total, err := s.repo.List(filters)
	if err != nil {
		return nil, nil, err
	}
	return items, paginationMeta(filters, total), nil
}

func (s *NumberingService) FindByID(id string) (*models.DocumentNumbering, error) {
	return s.repo.FindByID(id)
}

func (s *NumberingService) Create(dn *models.DocumentNumbering) error {
	existing, _ := s.repo.FindConfig(dn.CompanyID, dn.DocumentTypeID, dn.CategoryID, dn.OfficeID, dn.DepartmentID)
	if existing != nil {
		return errors.New("numbering config already exists for this combination")
	}
	return s.repo.Create(dn)
}

func (s *NumberingService) Update(id string, data map[string]any) (*models.DocumentNumbering, error) {
	dn, err := s.repo.FindByID(id)
	if err != nil {
		return nil, errors.New("numbering config not found")
	}

	if v, ok := data["prefix"].(string); ok {
		dn.Prefix = &v
	}
	if v, ok := data["separator"].(string); ok {
		dn.Separator = v
	}
	if v, ok := data["format"].(string); ok {
		dn.Format = v
	}
	if v, ok := data["reset_period"].(string); ok {
		if v == "" {
			dn.ResetPeriod = nil
		} else {
			dn.ResetPeriod = &v
		}
	}
	if v, ok := data["document_type_id"].(string); ok {
		dn.DocumentTypeID = v
	}
	if v, ok := data["category_id"].(string); ok {
		if v == "" {
			dn.CategoryID = nil
		} else {
			dn.CategoryID = &v
		}
	}
	if v, ok := data["office_id"].(string); ok {
		if v == "" {
			dn.OfficeID = nil
		} else {
			dn.OfficeID = &v
		}
	}
	if v, ok := data["department_id"].(string); ok {
		if v == "" {
			dn.DepartmentID = nil
		} else {
			dn.DepartmentID = &v
		}
	}

	if err := s.repo.Update(dn); err != nil {
		return nil, err
	}
	return dn, nil
}

func (s *NumberingService) Delete(id string) error {
	if _, err := s.repo.FindByID(id); err != nil {
		return errors.New("numbering config not found")
	}
	return s.repo.Delete(id)
}

// GenerateNumber finds the matching config, handles reset, increments sequence atomically, and returns the formatted number.
func (s *NumberingService) GenerateNumber(companyID, documentTypeID string, categoryID, officeID, departmentID *string) (string, error) {
	config, err := s.repo.FindConfig(companyID, documentTypeID, categoryID, officeID, departmentID)
	if err != nil || config == nil {
		return "", errors.New("no numbering config found")
	}

	if err := s.checkAndResetSequence(config); err != nil {
		return "", err
	}

	newSeq, err := s.repo.IncrementSequence(config.ID)
	if err != nil {
		return "", fmt.Errorf("failed to increment sequence: %w", err)
	}

	tokens, err := s.resolveTokens(config, companyID, documentTypeID, categoryID, officeID, departmentID, newSeq)
	if err != nil {
		return "", err
	}

	return renderFormat(config.Format, tokens), nil
}

// Preview returns what the next number would be WITHOUT incrementing the sequence.
func (s *NumberingService) Preview(companyID, documentTypeID string, categoryID, officeID, departmentID *string) (map[string]any, error) {
	config, err := s.repo.FindConfig(companyID, documentTypeID, categoryID, officeID, departmentID)
	if err != nil || config == nil {
		return nil, errors.New("no numbering config found")
	}

	nextSeq := config.CurrentSequence + 1

	// Check if sequence would be reset
	if s.shouldReset(config) {
		nextSeq = 1
	}

	tokens, err := s.resolveTokens(config, companyID, documentTypeID, categoryID, officeID, departmentID, nextSeq)
	if err != nil {
		return nil, err
	}

	return map[string]any{
		"format":        config.Format,
		"preview":       renderFormat(config.Format, tokens),
		"next_sequence": nextSeq,
		"tokens":        tokens,
	}, nil
}

func (s *NumberingService) shouldReset(config *models.DocumentNumbering) bool {
	if config.ResetPeriod == nil {
		return false
	}
	now := time.Now()
	switch *config.ResetPeriod {
	case "yearly":
		if config.LastResetAt == nil || config.LastResetAt.Year() != now.Year() {
			return true
		}
	case "monthly":
		if config.LastResetAt == nil || config.LastResetAt.Year() != now.Year() || config.LastResetAt.Month() != now.Month() {
			return true
		}
	}
	return false
}

func (s *NumberingService) checkAndResetSequence(config *models.DocumentNumbering) error {
	if s.shouldReset(config) {
		return s.repo.ResetSequence(config.ID)
	}
	return nil
}

func (s *NumberingService) resolveTokens(config *models.DocumentNumbering, companyID, documentTypeID string, categoryID, officeID, departmentID *string, seq int) (map[string]string, error) {
	tokens := make(map[string]string)
	now := time.Now()

	tokens["YEAR"] = strconv.Itoa(now.Year())
	tokens["YEAR2"] = fmt.Sprintf("%02d", now.Year()%100)
	tokens["MONTH"] = fmt.Sprintf("%02d", int(now.Month()))
	tokens["ROMAN_MONTH"] = romanMonths[int(now.Month())-1]

	if config.Prefix != nil {
		tokens["PREFIX"] = *config.Prefix
	} else {
		tokens["PREFIX"] = ""
	}

	// Resolve SEQ with padding
	matches := seqRegex.FindStringSubmatch(config.Format)
	if len(matches) == 2 {
		pad, _ := strconv.Atoi(matches[1])
		tokens["SEQ"] = fmt.Sprintf("%0*d", pad, seq)
	}

	// Resolve TYPE
	if code, err := resolveCode("document_types", documentTypeID); err == nil {
		tokens["TYPE"] = code
	}

	// Resolve CAT
	if categoryID != nil && *categoryID != "" {
		if code, err := resolveCode("document_categories", *categoryID); err == nil {
			tokens["CAT"] = code
		}
	}

	// Resolve DEPT
	if departmentID != nil && *departmentID != "" {
		if code, err := resolveCode("departments", *departmentID); err == nil {
			tokens["DEPT"] = code
		}
	}

	// Resolve OFFICE
	if officeID != nil && *officeID != "" {
		if code, err := resolveCode("offices", *officeID); err == nil {
			tokens["OFFICE"] = code
		}
	}

	// Resolve COMPANY
	if code, err := resolveCode("companies", companyID); err == nil {
		tokens["COMPANY"] = code
	}

	// Resolve SECTION – requires department to find section
	if departmentID != nil && *departmentID != "" {
		var sec struct {
			Code string `gorm:"column:code"`
		}
		if err := facades.Orm().Query().Raw(
			"SELECT code FROM sections WHERE department_id = ? AND is_active = true ORDER BY sort_order LIMIT 1", *departmentID,
		).Scan(&sec); err == nil && sec.Code != "" {
			tokens["SECTION"] = sec.Code
		}
	}

	return tokens, nil
}

func resolveCode(table, id string) (string, error) {
	var result struct {
		Code string `gorm:"column:code"`
	}
	if err := facades.Orm().Query().Raw(
		fmt.Sprintf("SELECT code FROM %s WHERE id = ?", table), id,
	).Scan(&result); err != nil {
		return "", err
	}
	return result.Code, nil
}

func renderFormat(format string, tokens map[string]string) string {
	result := format

	// Replace {SEQ:N} with the pre-computed SEQ token
	result = seqRegex.ReplaceAllString(result, "{SEQ}")

	for key, val := range tokens {
		result = strings.ReplaceAll(result, "{"+key+"}", val)
	}

	return result
}
