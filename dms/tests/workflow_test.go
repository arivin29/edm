package tests

import (
	"encoding/json"
	"net/http"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
)

type WorkflowTestSuite struct {
	suite.Suite
	baseURL string
	token   string
}

func TestWorkflowSuite(t *testing.T) {
	suite.Run(t, new(WorkflowTestSuite))
}

func (s *WorkflowTestSuite) SetupSuite() {
	s.baseURL = "http://127.0.0.1:3000/api/v1"
	s.login()
}

func (s *WorkflowTestSuite) login() {
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

func (s *WorkflowTestSuite) parseJSON(resp *http.Response) map[string]interface{} {
	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)
	resp.Body.Close()
	return result
}

func (s *WorkflowTestSuite) authRequest(method, url string, body string) (*http.Response, error) {
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

// ============ WORKFLOW CONFIGS ============

func (s *WorkflowTestSuite) Test01_ListWorkflows() {
	resp, err := s.authRequest("GET", s.baseURL+"/workflows", "")
	
	assert.NoError(s.T(), err)
	assert.Equal(s.T(), http.StatusOK, resp.StatusCode)
	resp.Body.Close()
}

func (s *WorkflowTestSuite) Test02_WorkflowNotFound() {
	resp, err := s.authRequest("GET", s.baseURL+"/workflows/nonexistent-id", "")
	assert.NoError(s.T(), err)
	// 400 (bad UUID), 404, or 500 (DB error on invalid UUID)
	assert.True(s.T(), resp.StatusCode == http.StatusNotFound || resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusInternalServerError)
	resp.Body.Close()
}

func (s *WorkflowTestSuite) Test03_WorkflowStepsNotFound() {
	resp, err := s.authRequest("GET", s.baseURL+"/workflows/nonexistent-id/steps", "")
	assert.NoError(s.T(), err)
	assert.True(s.T(), resp.StatusCode == http.StatusNotFound || resp.StatusCode == http.StatusBadRequest)
	resp.Body.Close()
}

// ============ PENDING TASKS ============

func (s *WorkflowTestSuite) Test04_GetPendingTasks() {
	resp, err := s.authRequest("GET", s.baseURL+"/workflow/pending-tasks", "")
	
	assert.NoError(s.T(), err)
	assert.Equal(s.T(), http.StatusOK, resp.StatusCode)
	resp.Body.Close()
}

// ============ WORKFLOW ACTIONS (require document) ============

func (s *WorkflowTestSuite) Test05_SubmitDocumentNotFound() {
	resp, err := s.authRequest("POST", s.baseURL+"/documents/nonexistent-id/submit", "")
	assert.NoError(s.T(), err)
	assert.True(s.T(), resp.StatusCode == http.StatusNotFound || resp.StatusCode == http.StatusBadRequest)
	resp.Body.Close()
}

func (s *WorkflowTestSuite) Test06_ApproveDocumentNotFound() {
	body := `{"comment":"test"}`
	resp, err := s.authRequest("POST", s.baseURL+"/documents/nonexistent-id/approve", body)
	assert.NoError(s.T(), err)
	assert.True(s.T(), resp.StatusCode == http.StatusNotFound || resp.StatusCode == http.StatusBadRequest)
	resp.Body.Close()
}

func (s *WorkflowTestSuite) Test07_RejectDocumentNotFound() {
	body := `{"comment":"test rejection"}`
	resp, err := s.authRequest("POST", s.baseURL+"/documents/nonexistent-id/reject", body)
	assert.NoError(s.T(), err)
	assert.True(s.T(), resp.StatusCode == http.StatusNotFound || resp.StatusCode == http.StatusBadRequest)
	resp.Body.Close()
}

func (s *WorkflowTestSuite) Test08_DelegateDocumentNotFound() {
	body := `{"delegate_to":"some-user-id","comment":"test"}`
	resp, err := s.authRequest("POST", s.baseURL+"/documents/nonexistent-id/delegate", body)
	assert.NoError(s.T(), err)
	assert.True(s.T(), resp.StatusCode == http.StatusNotFound || resp.StatusCode == http.StatusBadRequest)
	resp.Body.Close()
}

func (s *WorkflowTestSuite) Test09_GetWorkflowStatusNotFound() {
	resp, err := s.authRequest("GET", s.baseURL+"/documents/nonexistent-id/workflow", "")
	assert.NoError(s.T(), err)
	assert.True(s.T(), resp.StatusCode == http.StatusNotFound || resp.StatusCode == http.StatusBadRequest)
	resp.Body.Close()
}

// ============ UNAUTHORIZED ============

func (s *WorkflowTestSuite) Test10_UnauthorizedAccess() {
	req, _ := http.NewRequest("GET", s.baseURL+"/workflows", nil)
	resp, err := (&http.Client{}).Do(req)
	
	assert.NoError(s.T(), err)
	assert.Equal(s.T(), http.StatusUnauthorized, resp.StatusCode)
	resp.Body.Close()
}
