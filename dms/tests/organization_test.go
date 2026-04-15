package tests

import (
	"encoding/json"
	"net/http"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
)

type OrganizationTestSuite struct {
	suite.Suite
	baseURL string
	token   string
}

func TestOrganizationSuite(t *testing.T) {
	suite.Run(t, new(OrganizationTestSuite))
}

func (s *OrganizationTestSuite) SetupSuite() {
	s.baseURL = "http://127.0.0.1:3000/api/v1"
	s.login()
}

func (s *OrganizationTestSuite) login() {
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

func (s *OrganizationTestSuite) parseJSON(resp *http.Response) map[string]interface{} {
	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)
	resp.Body.Close()
	return result
}

func (s *OrganizationTestSuite) authRequest(method, url string, body string) (*http.Response, error) {
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

// ============ COMPANY TESTS ============

func (s *OrganizationTestSuite) Test01_ListCompanies() {
	resp, err := s.authRequest("GET", s.baseURL+"/companies", "")
	
	assert.NoError(s.T(), err)
	assert.Equal(s.T(), http.StatusOK, resp.StatusCode)
	resp.Body.Close()
}

func (s *OrganizationTestSuite) Test02_GetCompany() {
	// First get list to get an ID
	resp, _ := s.authRequest("GET", s.baseURL+"/companies", "")
	result := s.parseJSON(resp)
	
	data, ok := result["data"].([]interface{})
	if !ok || len(data) == 0 {
		s.T().Skip("No companies to test")
		return
	}
	
	companyID := data[0].(map[string]interface{})["id"].(string)
	
	resp, err := s.authRequest("GET", s.baseURL+"/companies/"+companyID, "")
	assert.NoError(s.T(), err)
	assert.Equal(s.T(), http.StatusOK, resp.StatusCode)
	resp.Body.Close()
}

func (s *OrganizationTestSuite) Test03_CompanyNotFound() {
	resp, err := s.authRequest("GET", s.baseURL+"/companies/nonexistent-id", "")
	assert.NoError(s.T(), err)
	assert.True(s.T(), resp.StatusCode == http.StatusNotFound || resp.StatusCode == http.StatusBadRequest)
	resp.Body.Close()
}

// ============ OFFICE TESTS ============

func (s *OrganizationTestSuite) Test04_ListOffices() {
	resp, err := s.authRequest("GET", s.baseURL+"/offices", "")
	
	assert.NoError(s.T(), err)
	assert.Equal(s.T(), http.StatusOK, resp.StatusCode)
	resp.Body.Close()
}

func (s *OrganizationTestSuite) Test05_OfficeNotFound() {
	resp, err := s.authRequest("GET", s.baseURL+"/offices/nonexistent-id", "")
	assert.NoError(s.T(), err)
	assert.True(s.T(), resp.StatusCode == http.StatusNotFound || resp.StatusCode == http.StatusBadRequest)
	resp.Body.Close()
}

// ============ DEPARTMENT TESTS ============

func (s *OrganizationTestSuite) Test06_ListDepartments() {
	resp, err := s.authRequest("GET", s.baseURL+"/departments", "")
	
	assert.NoError(s.T(), err)
	assert.Equal(s.T(), http.StatusOK, resp.StatusCode)
	resp.Body.Close()
}

func (s *OrganizationTestSuite) Test07_DepartmentNotFound() {
	resp, err := s.authRequest("GET", s.baseURL+"/departments/nonexistent-id", "")
	assert.NoError(s.T(), err)
	assert.True(s.T(), resp.StatusCode == http.StatusNotFound || resp.StatusCode == http.StatusBadRequest)
	resp.Body.Close()
}

// ============ SECTION TESTS ============

func (s *OrganizationTestSuite) Test08_ListSections() {
	resp, err := s.authRequest("GET", s.baseURL+"/sections", "")
	
	assert.NoError(s.T(), err)
	assert.Equal(s.T(), http.StatusOK, resp.StatusCode)
	resp.Body.Close()
}

// ============ POSITION TESTS ============

func (s *OrganizationTestSuite) Test09_ListPositions() {
	resp, err := s.authRequest("GET", s.baseURL+"/positions", "")
	
	assert.NoError(s.T(), err)
	assert.Equal(s.T(), http.StatusOK, resp.StatusCode)
	resp.Body.Close()
}

// ============ UNAUTHORIZED TESTS ============

func (s *OrganizationTestSuite) Test10_UnauthorizedAccess() {
	req, _ := http.NewRequest("GET", s.baseURL+"/companies", nil)
	resp, err := (&http.Client{}).Do(req)
	
	assert.NoError(s.T(), err)
	assert.Equal(s.T(), http.StatusUnauthorized, resp.StatusCode)
	resp.Body.Close()
}
