package tests

import (
	"encoding/json"
	"net/http"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
)

type UserTestSuite struct {
	suite.Suite
	baseURL string
	token   string
}

func TestUserSuite(t *testing.T) {
	suite.Run(t, new(UserTestSuite))
}

func (s *UserTestSuite) SetupSuite() {
	s.baseURL = "http://127.0.0.1:3000/api/v1"
	s.login()
}

func (s *UserTestSuite) login() {
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

func (s *UserTestSuite) parseJSON(resp *http.Response) map[string]interface{} {
	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)
	resp.Body.Close()
	return result
}

func (s *UserTestSuite) authRequest(method, url string, body string) (*http.Response, error) {
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

// ============ LIST USERS ============

func (s *UserTestSuite) Test01_ListUsers() {
	resp, err := s.authRequest("GET", s.baseURL+"/users", "")
	
	assert.NoError(s.T(), err)
	assert.Equal(s.T(), http.StatusOK, resp.StatusCode)
	resp.Body.Close()
}

func (s *UserTestSuite) Test02_ListUsersWithPagination() {
	resp, err := s.authRequest("GET", s.baseURL+"/users?page=1&per_page=5", "")
	
	assert.NoError(s.T(), err)
	assert.Equal(s.T(), http.StatusOK, resp.StatusCode)
	resp.Body.Close()
}

func (s *UserTestSuite) Test03_ListUsersWithSearch() {
	resp, err := s.authRequest("GET", s.baseURL+"/users?search=admin", "")
	
	assert.NoError(s.T(), err)
	assert.Equal(s.T(), http.StatusOK, resp.StatusCode)
	resp.Body.Close()
}

// ============ GET USER ============

func (s *UserTestSuite) Test04_GetUser() {
	// First get list to get an ID
	resp, _ := s.authRequest("GET", s.baseURL+"/users", "")
	result := s.parseJSON(resp)
	
	data, ok := result["data"].([]interface{})
	if !ok || len(data) == 0 {
		s.T().Skip("No users to test")
		return
	}
	
	userID := data[0].(map[string]interface{})["id"].(string)
	
	resp, err := s.authRequest("GET", s.baseURL+"/users/"+userID, "")
	assert.NoError(s.T(), err)
	assert.Equal(s.T(), http.StatusOK, resp.StatusCode)
	resp.Body.Close()
}

func (s *UserTestSuite) Test05_UserNotFound() {
	resp, err := s.authRequest("GET", s.baseURL+"/users/nonexistent-id", "")
	assert.NoError(s.T(), err)
	assert.True(s.T(), resp.StatusCode == http.StatusNotFound || resp.StatusCode == http.StatusBadRequest)
	resp.Body.Close()
}

// ============ ROLES ============

func (s *UserTestSuite) Test06_ListRoles() {
	resp, err := s.authRequest("GET", s.baseURL+"/roles", "")
	
	assert.NoError(s.T(), err)
	assert.Equal(s.T(), http.StatusOK, resp.StatusCode)
	resp.Body.Close()
}

func (s *UserTestSuite) Test07_ListPermissions() {
	resp, err := s.authRequest("GET", s.baseURL+"/permissions", "")
	
	assert.NoError(s.T(), err)
	assert.Equal(s.T(), http.StatusOK, resp.StatusCode)
	resp.Body.Close()
}

// ============ UNAUTHORIZED ============

func (s *UserTestSuite) Test08_UnauthorizedAccess() {
	req, _ := http.NewRequest("GET", s.baseURL+"/users", nil)
	resp, err := (&http.Client{}).Do(req)
	
	assert.NoError(s.T(), err)
	assert.Equal(s.T(), http.StatusUnauthorized, resp.StatusCode)
	resp.Body.Close()
}
