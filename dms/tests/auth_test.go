package tests

import (
	"encoding/json"
	"net/http"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
)

type AuthTestSuite struct {
	suite.Suite
	baseURL string
	token   string
}

func TestAuthSuite(t *testing.T) {
	suite.Run(t, new(AuthTestSuite))
}

func (s *AuthTestSuite) SetupSuite() {
	s.baseURL = "http://127.0.0.1:3000/api/v1"
}

func (s *AuthTestSuite) parseJSON(resp *http.Response) map[string]interface{} {
	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)
	resp.Body.Close()
	return result
}

// ============ LOGIN TESTS ============

func (s *AuthTestSuite) Test01_LoginSuccess() {
	body := `{"email":"admin@askara.com","password":"password123"}`
	resp, err := http.Post(s.baseURL+"/auth/login", "application/json", strings.NewReader(body))
	
	assert.NoError(s.T(), err)
	assert.Equal(s.T(), http.StatusOK, resp.StatusCode)
	
	result := s.parseJSON(resp)
	
	data, ok := result["data"].(map[string]interface{})
	assert.True(s.T(), ok, "data should be a map")
	if ok {
		assert.NotEmpty(s.T(), data["token"])
		assert.NotEmpty(s.T(), data["user"])
		s.token = data["token"].(string)
	}
}

func (s *AuthTestSuite) Test02_LoginInvalidEmail() {
	body := `{"email":"notexist@test.com","password":"password123"}`
	resp, err := http.Post(s.baseURL+"/auth/login", "application/json", strings.NewReader(body))
	
	assert.NoError(s.T(), err)
	assert.Equal(s.T(), http.StatusUnauthorized, resp.StatusCode)
	resp.Body.Close()
}

func (s *AuthTestSuite) Test03_LoginInvalidPassword() {
	body := `{"email":"admin@askara.com","password":"wrongpass"}`
	resp, err := http.Post(s.baseURL+"/auth/login", "application/json", strings.NewReader(body))
	
	assert.NoError(s.T(), err)
	assert.Equal(s.T(), http.StatusUnauthorized, resp.StatusCode)
	resp.Body.Close()
}

func (s *AuthTestSuite) Test04_LoginMissingFields() {
	body := `{"email":"admin@askara.com"}`
	resp, err := http.Post(s.baseURL+"/auth/login", "application/json", strings.NewReader(body))
	
	assert.NoError(s.T(), err)
	// 400 or 422 both valid for validation errors
	assert.True(s.T(), resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusUnprocessableEntity)
	resp.Body.Close()
}

// ============ ME TESTS ============

func (s *AuthTestSuite) Test05_MeSuccess() {
	// Login first
	body := `{"email":"admin@askara.com","password":"password123"}`
	loginResp, _ := http.Post(s.baseURL+"/auth/login", "application/json", strings.NewReader(body))
	loginResult := s.parseJSON(loginResp)
	
	data, ok := loginResult["data"].(map[string]interface{})
	if !ok {
		s.T().Skip("Could not login")
		return
	}
	token := data["token"].(string)
	
	// Call /auth/me
	req, _ := http.NewRequest("GET", s.baseURL+"/auth/me", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	client := &http.Client{}
	resp, err := client.Do(req)
	
	assert.NoError(s.T(), err)
	assert.Equal(s.T(), http.StatusOK, resp.StatusCode)
	
	result := s.parseJSON(resp)
	meData, ok := result["data"].(map[string]interface{})
	assert.True(s.T(), ok)
	if ok {
		assert.Equal(s.T(), "admin@askara.com", meData["email"])
	}
}

func (s *AuthTestSuite) Test06_MeUnauthorized() {
	req, _ := http.NewRequest("GET", s.baseURL+"/auth/me", nil)
	client := &http.Client{}
	resp, err := client.Do(req)
	
	assert.NoError(s.T(), err)
	assert.Equal(s.T(), http.StatusUnauthorized, resp.StatusCode)
	resp.Body.Close()
}

func (s *AuthTestSuite) Test07_MeInvalidToken() {
	req, _ := http.NewRequest("GET", s.baseURL+"/auth/me", nil)
	req.Header.Set("Authorization", "Bearer invalidtoken123")
	client := &http.Client{}
	resp, err := client.Do(req)
	
	assert.NoError(s.T(), err)
	assert.Equal(s.T(), http.StatusUnauthorized, resp.StatusCode)
	resp.Body.Close()
}

// ============ REFRESH TOKEN TESTS ============

func (s *AuthTestSuite) Test08_RefreshTokenSuccess() {
	// Login first
	body := `{"email":"admin@askara.com","password":"password123"}`
	loginResp, _ := http.Post(s.baseURL+"/auth/login", "application/json", strings.NewReader(body))
	loginResult := s.parseJSON(loginResp)
	
	data, ok := loginResult["data"].(map[string]interface{})
	if !ok {
		s.T().Skip("Could not login")
		return
	}
	token := data["token"].(string)
	
	// Call refresh (using same token as refresh token for now)
	refreshBody := `{}`
	req, _ := http.NewRequest("POST", s.baseURL+"/auth/refresh", strings.NewReader(refreshBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	client := &http.Client{}
	resp, err := client.Do(req)
	
	assert.NoError(s.T(), err)
	assert.Equal(s.T(), http.StatusOK, resp.StatusCode)
	
	result := s.parseJSON(resp)
	newData, ok := result["data"].(map[string]interface{})
	assert.True(s.T(), ok)
	if ok {
		assert.NotEmpty(s.T(), newData["token"])
	}
}

// ============ CHANGE PASSWORD TESTS ============

func (s *AuthTestSuite) Test09_ChangePasswordValidation() {
	// Login first
	body := `{"email":"admin@askara.com","password":"password123"}`
	loginResp, _ := http.Post(s.baseURL+"/auth/login", "application/json", strings.NewReader(body))
	loginResult := s.parseJSON(loginResp)
	
	data, ok := loginResult["data"].(map[string]interface{})
	if !ok {
		s.T().Skip("Could not login")
		return
	}
	token := data["token"].(string)
	
	// Try change with wrong current password
	changeBody := `{"current_password":"wrongcurrent","new_password":"newpass123","new_password_confirmation":"newpass123"}`
	req, _ := http.NewRequest("PUT", s.baseURL+"/auth/password", strings.NewReader(changeBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	client := &http.Client{}
	resp, err := client.Do(req)
	
	assert.NoError(s.T(), err)
	assert.Equal(s.T(), http.StatusBadRequest, resp.StatusCode)
	resp.Body.Close()
}

// ============ LOGOUT TESTS ============

func (s *AuthTestSuite) Test10_LogoutSuccess() {
	// Login first
	body := `{"email":"admin@askara.com","password":"password123"}`
	loginResp, _ := http.Post(s.baseURL+"/auth/login", "application/json", strings.NewReader(body))
	loginResult := s.parseJSON(loginResp)
	
	data, ok := loginResult["data"].(map[string]interface{})
	if !ok {
		s.T().Skip("Could not login")
		return
	}
	token := data["token"].(string)
	
	// Logout
	req, _ := http.NewRequest("POST", s.baseURL+"/auth/logout", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	client := &http.Client{}
	resp, err := client.Do(req)
	
	assert.NoError(s.T(), err)
	assert.Equal(s.T(), http.StatusOK, resp.StatusCode)
	resp.Body.Close()
}
