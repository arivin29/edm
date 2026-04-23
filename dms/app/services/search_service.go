package services

import (
	"fmt"
	"strings"

	"dms/app/facades"
)

type SearchService struct{}

func NewSearchService() *SearchService { return &SearchService{} }

// SearchResult represents a single search hit
type SearchResult struct {
	ID          string  `json:"id"`
	Type        string  `json:"type"`
	Title       string  `json:"title"`
	Subtitle    string  `json:"subtitle,omitempty"`
	Description string  `json:"description,omitempty"`
	Status      string  `json:"status,omitempty"`
	URL         string  `json:"url,omitempty"`
	Rank        float64 `json:"rank,omitempty"`
}

// SearchGroup is a category of results
type SearchGroup struct {
	Type    string         `json:"type"`
	Label   string         `json:"label"`
	Icon    string         `json:"icon"`
	Total   int            `json:"total"`
	Results []SearchResult `json:"results"`
}

// GlobalSearchResponse is the full response
type GlobalSearchResponse struct {
	Query  string        `json:"query"`
	Groups []SearchGroup `json:"groups"`
	Total  int           `json:"total"`
}

// GlobalSearch searches across all modules
func (s *SearchService) GlobalSearch(query string, limit int) (*GlobalSearchResponse, error) {
	if strings.TrimSpace(query) == "" {
		return &GlobalSearchResponse{Query: query}, nil
	}

	if limit <= 0 {
		limit = 5
	}

	resp := &GlobalSearchResponse{Query: query}

	// 1. Documents (full-text search with tsvector — highest priority)
	docGroup, err := s.searchDocuments(query, limit)
	if err == nil && docGroup.Total > 0 {
		resp.Groups = append(resp.Groups, *docGroup)
		resp.Total += docGroup.Total
	}

	// 2. Users
	userGroup, err := s.searchUsers(query, limit)
	if err == nil && userGroup.Total > 0 {
		resp.Groups = append(resp.Groups, *userGroup)
		resp.Total += userGroup.Total
	}

	// 3. Workflows
	wfGroup, err := s.searchWorkflows(query, limit)
	if err == nil && wfGroup.Total > 0 {
		resp.Groups = append(resp.Groups, *wfGroup)
		resp.Total += wfGroup.Total
	}

	// 4. Document Types
	dtGroup, err := s.searchDocumentTypes(query, limit)
	if err == nil && dtGroup.Total > 0 {
		resp.Groups = append(resp.Groups, *dtGroup)
		resp.Total += dtGroup.Total
	}

	// 5. Templates
	tmplGroup, err := s.searchTemplates(query, limit)
	if err == nil && tmplGroup.Total > 0 {
		resp.Groups = append(resp.Groups, *tmplGroup)
		resp.Total += tmplGroup.Total
	}

	return resp, nil
}

// searchDocuments uses PostgreSQL full-text search (tsvector) + ILIKE fallback
func (s *SearchService) searchDocuments(query string, limit int) (*SearchGroup, error) {
	type docRow struct {
		ID             string  `json:"id"`
		DocumentNumber string  `json:"document_number"`
		Title          string  `json:"title"`
		Description    *string `json:"description"`
		Status         string  `json:"status"`
		TypeName       *string `json:"type_name"`
		DeptName       *string `json:"dept_name"`
		MatchSource    string  `json:"match_source"`
	}

	likePattern := "%" + strings.ToLower(query) + "%"

	// Count total: ILIKE + tsvector (includes attachment OCR via weight D) + direct attachment OCR text
	var total int64
	countSQL := `SELECT COUNT(DISTINCT d.id) FROM documents d
		LEFT JOIN file_storage fs ON fs.entity_type = 'document' AND fs.entity_id = d.id AND fs.deleted_at IS NULL
		WHERE d.deleted_at IS NULL AND (
			LOWER(d.document_number) LIKE ? OR LOWER(d.title) LIKE ? OR LOWER(COALESCE(d.description,'')) LIKE ?
			OR d.search_vector @@ websearch_to_tsquery('simple', ?)
			OR LOWER(COALESCE(fs.ocr_text,'')) LIKE ?
		)`
	_ = facades.Orm().Query().Raw(countSQL, likePattern, likePattern, likePattern, query, likePattern).Scan(&total)

	// Fetch results with match source indicator
	searchSQL := fmt.Sprintf(`SELECT DISTINCT ON (d.id) d.id, d.document_number, d.title, d.description, d.status,
		dt.name as type_name, dep.name as dept_name,
		CASE
			WHEN LOWER(d.document_number) LIKE ? OR LOWER(d.title) LIKE ? THEN 'direct'
			WHEN d.search_vector @@ websearch_to_tsquery('simple', ?) THEN 'fulltext'
			WHEN LOWER(COALESCE(fs.ocr_text,'')) LIKE ? THEN 'ocr'
			ELSE 'other'
		END as match_source
		FROM documents d
		LEFT JOIN document_types dt ON dt.id = d.document_type_id
		LEFT JOIN departments dep ON dep.id = d.department_id
		LEFT JOIN file_storage fs ON fs.entity_type = 'document' AND fs.entity_id = d.id AND fs.deleted_at IS NULL
		WHERE d.deleted_at IS NULL AND (
			LOWER(d.document_number) LIKE ? OR LOWER(d.title) LIKE ? OR LOWER(COALESCE(d.description,'')) LIKE ?
			OR d.search_vector @@ websearch_to_tsquery('simple', ?)
			OR LOWER(COALESCE(fs.ocr_text,'')) LIKE ?
		)
		ORDER BY d.id,
			CASE WHEN LOWER(d.document_number) LIKE ? THEN 0 ELSE 1 END,
			CASE WHEN LOWER(d.title) LIKE ? THEN 0 ELSE 1 END,
			d.updated_at DESC
		LIMIT %d`, limit)

	var rows []docRow
	if err := facades.Orm().Query().Raw(searchSQL,
		likePattern, likePattern, query, likePattern,
		likePattern, likePattern, likePattern, query, likePattern,
		likePattern, likePattern,
	).Scan(&rows); err != nil {
		return nil, err
	}

	group := &SearchGroup{
		Type:  "document",
		Label: "Dokumen",
		Icon:  "file-text",
		Total: int(total),
	}

	for _, r := range rows {
		subtitle := r.DocumentNumber
		if r.TypeName != nil && *r.TypeName != "" {
			subtitle += " · " + *r.TypeName
		}
		if r.DeptName != nil && *r.DeptName != "" {
			subtitle += " · " + *r.DeptName
		}
		if r.MatchSource == "ocr" {
			subtitle += " · 📄 Ditemukan di file OCR"
		}

		desc := ""
		if r.Description != nil {
			desc = *r.Description
			if len(desc) > 120 {
				desc = desc[:120] + "..."
			}
		}

		group.Results = append(group.Results, SearchResult{
			ID:          r.ID,
			Type:        "document",
			Title:       r.Title,
			Subtitle:    subtitle,
			Description: desc,
			Status:      r.Status,
			URL:         "/documents/" + r.ID,
		})
	}

	return group, nil
}

// searchUsers searches users by name, email, employee_id
func (s *SearchService) searchUsers(query string, limit int) (*SearchGroup, error) {
	type userRow struct {
		ID         string  `json:"id"`
		Name       string  `json:"name"`
		Email      string  `json:"email"`
		EmployeeID *string `json:"employee_id"`
		DeptName   *string `json:"dept_name"`
	}

	likePattern := "%" + strings.ToLower(query) + "%"
	var rows []userRow
	var total int64

	countSQL := `SELECT COUNT(*) FROM users WHERE deleted_at IS NULL AND (LOWER(name) LIKE ? OR LOWER(email) LIKE ? OR LOWER(COALESCE(employee_id,'')) LIKE ?)`
	_ = facades.Orm().Query().Raw(countSQL, likePattern, likePattern, likePattern).Scan(&total)

	searchSQL := fmt.Sprintf(`SELECT u.id, u.name, u.email, u.employee_id, d.name as dept_name
		FROM users u LEFT JOIN departments d ON d.id = u.department_id
		WHERE u.deleted_at IS NULL AND (LOWER(u.name) LIKE ? OR LOWER(u.email) LIKE ? OR LOWER(COALESCE(u.employee_id,'')) LIKE ?)
		ORDER BY u.name LIMIT %d`, limit)

	if err := facades.Orm().Query().Raw(searchSQL, likePattern, likePattern, likePattern).Scan(&rows); err != nil {
		return nil, err
	}

	group := &SearchGroup{Type: "user", Label: "Pengguna", Icon: "user", Total: int(total)}
	for _, r := range rows {
		subtitle := r.Email
		if r.DeptName != nil && *r.DeptName != "" {
			subtitle += " · " + *r.DeptName
		}
		group.Results = append(group.Results, SearchResult{
			ID:       r.ID,
			Type:     "user",
			Title:    r.Name,
			Subtitle: subtitle,
			URL:      "/master/users/" + r.ID,
		})
	}
	return group, nil
}

// searchWorkflows searches workflow templates
func (s *SearchService) searchWorkflows(query string, limit int) (*SearchGroup, error) {
	type wfRow struct {
		ID          string  `json:"id"`
		Name        string  `json:"name"`
		Description *string `json:"description"`
	}

	likePattern := "%" + strings.ToLower(query) + "%"
	var rows []wfRow
	var total int64

	_ = facades.Orm().Query().Raw(`SELECT COUNT(*) FROM workflows WHERE deleted_at IS NULL AND (LOWER(name) LIKE ? OR LOWER(COALESCE(description,'')) LIKE ?)`, likePattern, likePattern).Scan(&total)

	searchSQL := fmt.Sprintf(`SELECT id, name, description FROM workflows WHERE deleted_at IS NULL AND (LOWER(name) LIKE ? OR LOWER(COALESCE(description,'')) LIKE ?) ORDER BY name LIMIT %d`, limit)
	if err := facades.Orm().Query().Raw(searchSQL, likePattern, likePattern).Scan(&rows); err != nil {
		return nil, err
	}

	group := &SearchGroup{Type: "workflow", Label: "Workflow", Icon: "apartment", Total: int(total)}
	for _, r := range rows {
		desc := ""
		if r.Description != nil {
			desc = *r.Description
		}
		group.Results = append(group.Results, SearchResult{
			ID:          r.ID,
			Type:        "workflow",
			Title:       r.Name,
			Description: desc,
			URL:         "/workflows/" + r.ID,
		})
	}
	return group, nil
}

// searchDocumentTypes searches document types + categories
func (s *SearchService) searchDocumentTypes(query string, limit int) (*SearchGroup, error) {
	type dtRow struct {
		ID   string `json:"id"`
		Name string `json:"name"`
		Code string `json:"code"`
	}

	likePattern := "%" + strings.ToLower(query) + "%"
	var rows []dtRow
	var total int64

	_ = facades.Orm().Query().Raw(`SELECT COUNT(*) FROM document_types WHERE deleted_at IS NULL AND (LOWER(name) LIKE ? OR LOWER(COALESCE(code,'')) LIKE ?)`, likePattern, likePattern).Scan(&total)

	searchSQL := fmt.Sprintf(`SELECT id, name, code FROM document_types WHERE deleted_at IS NULL AND (LOWER(name) LIKE ? OR LOWER(COALESCE(code,'')) LIKE ?) ORDER BY name LIMIT %d`, limit)
	if err := facades.Orm().Query().Raw(searchSQL, likePattern, likePattern).Scan(&rows); err != nil {
		return nil, err
	}

	group := &SearchGroup{Type: "document_type", Label: "Tipe Dokumen", Icon: "folder", Total: int(total)}
	for _, r := range rows {
		group.Results = append(group.Results, SearchResult{
			ID:       r.ID,
			Type:     "document_type",
			Title:    r.Name,
			Subtitle: r.Code,
			URL:      "/master/document-types",
		})
	}
	return group, nil
}

// searchTemplates searches document templates
func (s *SearchService) searchTemplates(query string, limit int) (*SearchGroup, error) {
	type tmplRow struct {
		ID       string  `json:"id"`
		Name     string  `json:"name"`
		TypeName *string `json:"type_name"`
	}

	likePattern := "%" + strings.ToLower(query) + "%"
	var rows []tmplRow
	var total int64

	_ = facades.Orm().Query().Raw(`SELECT COUNT(*) FROM document_templates WHERE deleted_at IS NULL AND LOWER(name) LIKE ?`, likePattern).Scan(&total)

	searchSQL := fmt.Sprintf(`SELECT t.id, t.name, dt.name as type_name FROM document_templates t LEFT JOIN document_types dt ON dt.id = t.document_type_id WHERE t.deleted_at IS NULL AND LOWER(t.name) LIKE ? ORDER BY t.name LIMIT %d`, limit)
	if err := facades.Orm().Query().Raw(searchSQL, likePattern).Scan(&rows); err != nil {
		return nil, err
	}

	group := &SearchGroup{Type: "template", Label: "Template", Icon: "file-done", Total: int(total)}
	for _, r := range rows {
		subtitle := ""
		if r.TypeName != nil {
			subtitle = *r.TypeName
		}
		group.Results = append(group.Results, SearchResult{
			ID:       r.ID,
			Type:     "template",
			Title:    r.Name,
			Subtitle: subtitle,
			URL:      "/templates/" + r.ID,
		})
	}
	return group, nil
}
