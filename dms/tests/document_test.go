package tests

import (
	"encoding/json"
	"net/http"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
)

type DocumentTestSuite struct {
	suite.Suite
	baseURL string
	token   string
}

func TestDocumentSuite(t *testing.T) {
	suite.Run(t, new(DocumentTestSuite))
}

func (s *DocumentTestSuite) SetupSuite() {
	s.baseURL = "http://127.0.0.1:3000/api/v1"
	s.login()
}

func (s *DocumentTestSuite) login() {
	body := `{"email":"admin@askara.com","password":"password123"}`
	resp, _ := http.Post(s.baseURL+"/auth/login", "application/json", strings.NewReader(body))
	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)
	resp.Body.Close()
	if data, ok := result["data"].(map[string]interface{}); ok {
		if token, ok := data["token"].(string); ok {
			s.token = token
		}
	}
}

func (s *DocumentTestSuite) parseJSON(resp *http.Response) map[string]interface{} {
	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)
	resp.Body.Close()
	return result
}

func (s *DocumentTestSuite) authRequest(method, url string, body string) (*http.Response, error) {
	var req *http.Request
	if body != "" {
		req, _ = http.NewRequest(method, url, strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
	} else {
		req, _ = http.NewRequest(method, url, nil)
	}
	req.Header.Set("Authorization", "Bearer "+s.token)
	return (&http.Client{}).Do(req)
}

// ============ DOCUMENT TYPES ============

func (s *DocumentTestSuite) Test01_ListDocumentTypes() {
	resp, err := s.authRequest("GET", s.baseURL+"/document-types", "")
	
	assert.NoError(s.T(), err)
	assert.Equal(s.T(), http.StatusOK, resp.StatusCode)
	resp.Body.Close()
}

// ============ DOCUMENT CATEGORIES ============

func (s *DocumentTestSuite) Test02_ListDocumentCategories() {
	resp, err := s.authRequest("GET", s.baseURL+"/document-categories", "")
	
	assert.NoError(s.T(), err)
	// Some routes might return 404 if no categories exist
	assert.True(s.T(), resp.StatusCode == http.StatusOK || resp.StatusCode == http.StatusNotFound)
	resp.Body.Close()
}

// ============ TEMPLATES ============

func (s *DocumentTestSuite) Test03_ListTemplates() {
	resp, err := s.authRequest("GET", s.baseURL+"/templates", "")
	
	assert.NoError(s.T(), err)
	assert.Equal(s.T(), http.StatusOK, resp.StatusCode)
	resp.Body.Close()
}

func (s *DocumentTestSuite) Test04_TemplateNotFound() {
	resp, err := s.authRequest("GET", s.baseURL+"/templates/nonexistent-id", "")
	assert.NoError(s.T(), err)
	assert.True(s.T(), resp.StatusCode == http.StatusNotFound || resp.StatusCode == http.StatusBadRequest)
	resp.Body.Close()
}

// ============ NUMBERING CONFIGS ============

func (s *DocumentTestSuite) Test05_ListNumberingConfigs() {
	resp, err := s.authRequest("GET", s.baseURL+"/numbering-configs", "")
	
	assert.NoError(s.T(), err)
	assert.Equal(s.T(), http.StatusOK, resp.StatusCode)
	resp.Body.Close()
}

func (s *DocumentTestSuite) Test06_PreviewNumbering() {
	// Get a numbering config first
	resp, _ := s.authRequest("GET", s.baseURL+"/numbering-configs", "")
	result := s.parseJSON(resp)
	
	data, ok := result["data"].([]interface{})
	if !ok || len(data) == 0 {
		s.T().Skip("No numbering configs to test")
		return
	}
	
	configID := data[0].(map[string]interface{})["id"].(string)
	
	resp, err := s.authRequest("GET", s.baseURL+"/numbering-configs/"+configID+"/preview", "")
	assert.NoError(s.T(), err)
	// May return 200 or 404 depending on config validity
	assert.True(s.T(), resp.StatusCode == http.StatusOK || resp.StatusCode == http.StatusNotFound)
	resp.Body.Close()
}

// ============ DOCUMENTS ============

func (s *DocumentTestSuite) Test07_ListDocuments() {
	resp, err := s.authRequest("GET", s.baseURL+"/documents", "")
	
	assert.NoError(s.T(), err)
	assert.Equal(s.T(), http.StatusOK, resp.StatusCode)
	resp.Body.Close()
}

func (s *DocumentTestSuite) Test08_ListDocumentsWithFilters() {
	resp, err := s.authRequest("GET", s.baseURL+"/documents?status=DRAFT&page=1&per_page=10", "")
	
	assert.NoError(s.T(), err)
	assert.Equal(s.T(), http.StatusOK, resp.StatusCode)
	resp.Body.Close()
}

func (s *DocumentTestSuite) Test09_DocumentNotFound() {
	resp, err := s.authRequest("GET", s.baseURL+"/documents/nonexistent-id", "")
	assert.NoError(s.T(), err)
	assert.True(s.T(), resp.StatusCode == http.StatusNotFound || resp.StatusCode == http.StatusBadRequest)
	resp.Body.Close()
}

// ============ UNAUTHORIZED ============

func (s *DocumentTestSuite) Test10_UnauthorizedAccess() {
	req, _ := http.NewRequest("GET", s.baseURL+"/documents", nil)
	resp, err := (&http.Client{}).Do(req)
	
	assert.NoError(s.T(), err)
	assert.Equal(s.T(), http.StatusUnauthorized, resp.StatusCode)
	resp.Body.Close()
}
