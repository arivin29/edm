package tests

import (
	"encoding/json"
	"net/http"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
)

type MiscTestSuite struct {
	suite.Suite
	baseURL string
	token   string
}

func TestMiscSuite(t *testing.T) {
	suite.Run(t, new(MiscTestSuite))
}

func (s *MiscTestSuite) SetupSuite() {
	s.baseURL = "http://127.0.0.1:3000/api/v1"
	s.login()
}

func (s *MiscTestSuite) login() {
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

func (s *MiscTestSuite) parseJSON(resp *http.Response) map[string]interface{} {
	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)
	resp.Body.Close()
	return result
}

func (s *MiscTestSuite) authRequest(method, url string, body string) (*http.Response, error) {
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

// ============ NOTIFICATIONS ============

func (s *MiscTestSuite) Test01_ListNotifications() {
	resp, err := s.authRequest("GET", s.baseURL+"/notifications", "")
	
	assert.NoError(s.T(), err)
	assert.Equal(s.T(), http.StatusOK, resp.StatusCode)
	resp.Body.Close()
}

func (s *MiscTestSuite) Test02_GetUnreadCount() {
	resp, err := s.authRequest("GET", s.baseURL+"/notifications/unread-count", "")
	
	assert.NoError(s.T(), err)
	assert.Equal(s.T(), http.StatusOK, resp.StatusCode)
	resp.Body.Close()
}

func (s *MiscTestSuite) Test03_MarkAllRead() {
	resp, err := s.authRequest("POST", s.baseURL+"/notifications/read-all", "")
	
	assert.NoError(s.T(), err)
	assert.Equal(s.T(), http.StatusOK, resp.StatusCode)
	resp.Body.Close()
}

// ============ SETTINGS ============

func (s *MiscTestSuite) Test04_ListSettings() {
	resp, err := s.authRequest("GET", s.baseURL+"/settings", "")
	
	assert.NoError(s.T(), err)
	assert.Equal(s.T(), http.StatusOK, resp.StatusCode)
	resp.Body.Close()
}

// ============ AUDIT LOGS ============

func (s *MiscTestSuite) Test05_ListAuditLogs() {
	resp, err := s.authRequest("GET", s.baseURL+"/audit-logs", "")
	
	assert.NoError(s.T(), err)
	assert.Equal(s.T(), http.StatusOK, resp.StatusCode)
	resp.Body.Close()
}

func (s *MiscTestSuite) Test06_ListAuditLogsWithFilters() {
	resp, err := s.authRequest("GET", s.baseURL+"/audit-logs?action=LOGIN&page=1&per_page=10", "")
	
	assert.NoError(s.T(), err)
	assert.Equal(s.T(), http.StatusOK, resp.StatusCode)
	resp.Body.Close()
}

// ============ COMMENTS (require document) ============

func (s *MiscTestSuite) Test07_DocumentCommentsNotFound() {
	resp, err := s.authRequest("GET", s.baseURL+"/documents/nonexistent-id/comments", "")
	assert.NoError(s.T(), err)
	// May return 400/404 or 200 with empty list depending on implementation
	assert.True(s.T(), resp.StatusCode == http.StatusOK || resp.StatusCode == http.StatusNotFound || resp.StatusCode == http.StatusBadRequest)
	resp.Body.Close()
}

// ============ DISTRIBUTIONS ============

func (s *MiscTestSuite) Test08_DistributionInbox() {
	resp, err := s.authRequest("GET", s.baseURL+"/distributions/inbox", "")
	
	assert.NoError(s.T(), err)
	assert.Equal(s.T(), http.StatusOK, resp.StatusCode)
	resp.Body.Close()
}

func (s *MiscTestSuite) Test09_DistributionNotFound() {
	resp, err := s.authRequest("GET", s.baseURL+"/distributions/nonexistent-id", "")
	assert.NoError(s.T(), err)
	assert.True(s.T(), resp.StatusCode == http.StatusNotFound || resp.StatusCode == http.StatusBadRequest)
	resp.Body.Close()
}

// ============ ONLYOFFICE ============

func (s *MiscTestSuite) Test10_OnlyOfficeEditorNotFound() {
	resp, err := s.authRequest("GET", s.baseURL+"/documents/nonexistent-id/editor", "")
	assert.NoError(s.T(), err)
	assert.True(s.T(), resp.StatusCode == http.StatusNotFound || resp.StatusCode == http.StatusBadRequest)
	resp.Body.Close()
}

// ============ SWAGGER ============

func (s *MiscTestSuite) Test11_SwaggerUI() {
	resp, err := http.Get(s.baseURL[:strings.LastIndex(s.baseURL, "/api")] + "/swagger")
	assert.NoError(s.T(), err)
	assert.Equal(s.T(), http.StatusOK, resp.StatusCode)
	resp.Body.Close()
}

func (s *MiscTestSuite) Test12_OpenAPISpec() {
	resp, err := http.Get(s.baseURL + "/docs/openapi.json")
	assert.NoError(s.T(), err)
	assert.Equal(s.T(), http.StatusOK, resp.StatusCode)
	resp.Body.Close()
}
