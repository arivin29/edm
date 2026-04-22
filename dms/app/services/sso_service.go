package services

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/goravel/framework/contracts/http"
	"github.com/google/uuid"

	"dms/app/facades"
	"dms/app/models"
	"dms/app/repositories"
)

type SSOService struct {
	userRepo    repositories.UserRepository
	roleRepo    repositories.RoleRepository
	orgRepo     repositories.OrganizationRepository
	settingRepo repositories.SettingRepository
}

func NewSSOService() *SSOService {
	return &SSOService{
		userRepo:    repositories.NewUserRepository(),
		roleRepo:    repositories.NewRoleRepository(),
		orgRepo:     repositories.NewOrganizationRepository(),
		settingRepo: repositories.NewSettingRepository(),
	}
}

type SSOConfig struct {
	Enabled    bool   `json:"enabled"`
	Provider   string `json:"provider"`   // ldap, saml, azure_ad
	LDAPHost   string `json:"ldap_host"`
	LDAPPort   string `json:"ldap_port"`
	LDAPBaseDN string `json:"ldap_base_dn"`
	LDAPBindDN string `json:"ldap_bind_dn"`
	SAMLMetadataURL string `json:"saml_metadata_url"`
	SAMLEntityID    string `json:"saml_entity_id"`
	AzureTenantID   string `json:"azure_tenant_id"`
	AzureClientID   string `json:"azure_client_id"`
	AutoProvision   bool   `json:"auto_provision"`
	DefaultRoleID   string `json:"default_role_id"`
	DefaultCompanyID string `json:"default_company_id"`
	DefaultOfficeID  string `json:"default_office_id"`
}

type SSOLoginRequest struct {
	Provider string `json:"provider"`
	Token    string `json:"token"`    // SAML assertion or OAuth token
	Username string `json:"username"` // LDAP username
	Password string `json:"password"` // LDAP password
}

type SSOUserInfo struct {
	Email      string
	Name       string
	EmployeeID string
	Department string
	Position   string
	Phone      string
}

// GetConfig returns SSO configuration from system settings
func (s *SSOService) GetConfig() (*SSOConfig, error) {
	config := &SSOConfig{
		Provider: "ldap",
		LDAPPort: "389",
	}

	settings, err := s.settingRepo.GetByPrefix(nil, nil, "sso_")
	if err != nil {
		return config, nil
	}

	for _, setting := range settings {
		switch setting.Key {
		case "sso_enabled":
			config.Enabled = setting.Value == "true"
		case "sso_provider":
			config.Provider = setting.Value
		case "sso_ldap_host":
			config.LDAPHost = setting.Value
		case "sso_ldap_port":
			config.LDAPPort = setting.Value
		case "sso_ldap_base_dn":
			config.LDAPBaseDN = setting.Value
		case "sso_ldap_bind_dn":
			config.LDAPBindDN = setting.Value
		case "sso_saml_metadata_url":
			config.SAMLMetadataURL = setting.Value
		case "sso_saml_entity_id":
			config.SAMLEntityID = setting.Value
		case "sso_azure_tenant_id":
			config.AzureTenantID = setting.Value
		case "sso_azure_client_id":
			config.AzureClientID = setting.Value
		case "sso_auto_provision":
			config.AutoProvision = setting.Value == "true"
		case "sso_default_role_id":
			config.DefaultRoleID = setting.Value
		case "sso_default_company_id":
			config.DefaultCompanyID = setting.Value
		case "sso_default_office_id":
			config.DefaultOfficeID = setting.Value
		}
	}

	return config, nil
}

// Login handles SSO authentication based on provider
func (s *SSOService) Login(ctx http.Context, req SSOLoginRequest) (*models.User, string, error) {
	config, err := s.GetConfig()
	if err != nil {
		return nil, "", errors.New("gagal memuat konfigurasi SSO")
	}

	if !config.Enabled {
		return nil, "", errors.New("SSO belum diaktifkan")
	}

	var userInfo *SSOUserInfo

	switch config.Provider {
	case "ldap":
		userInfo, err = s.authenticateLDAP(config, req)
	case "saml":
		userInfo, err = s.authenticateSAML(config, req)
	case "azure_ad":
		userInfo, err = s.authenticateAzureAD(config, req)
	default:
		return nil, "", fmt.Errorf("provider SSO tidak didukung: %s", config.Provider)
	}

	if err != nil {
		return nil, "", err
	}

	// Find or create user
	user, err := s.findOrProvisionUser(config, userInfo)
	if err != nil {
		return nil, "", err
	}

	if !user.IsActive {
		return nil, "", errors.New("akun tidak aktif")
	}

	// Generate JWT token
	token, err := facades.Auth(ctx).LoginUsingID(user.ID)
	if err != nil {
		return nil, "", errors.New("gagal membuat token autentikasi")
	}

	// Update last login
	now := time.Now()
	ip := ctx.Request().Ip()
	_ = s.userRepo.UpdateFields(user, map[string]any{
		"last_login_at": now,
		"last_login_ip": ip,
	})

	// Load relations for response
	s.loadUserRelations(user)
	user.Roles = s.loadUserRolesWithPermissions(user.ID)

	return user, token, nil
}

// authenticateLDAP performs LDAP bind authentication
func (s *SSOService) authenticateLDAP(config *SSOConfig, req SSOLoginRequest) (*SSOUserInfo, error) {
	if req.Username == "" || req.Password == "" {
		return nil, errors.New("username dan password diperlukan untuk LDAP")
	}

	if config.LDAPHost == "" {
		return nil, errors.New("LDAP server belum dikonfigurasi")
	}

	// LDAP authentication scaffolding
	// In production, this would use go-ldap library:
	//   conn, err := ldap.DialURL(fmt.Sprintf("ldap://%s:%s", config.LDAPHost, config.LDAPPort))
	//   err = conn.Bind(fmt.Sprintf("uid=%s,%s", req.Username, config.LDAPBaseDN), req.Password)
	//   searchResult, err = conn.Search(ldap.NewSearchRequest(...))

	// Demo mode: authenticate against local DB by email/employee_id
	email := req.Username
	if !strings.Contains(email, "@") {
		// Try to find user by employee_id
		user, err := s.findUserByEmployeeID(email)
		if err != nil {
			return nil, errors.New("user tidak ditemukan di LDAP")
		}
		email = user.Email
	}

	user, err := s.userRepo.FindByEmail(email)
	if err != nil || user.ID == "" {
		return nil, errors.New("autentikasi LDAP gagal")
	}

	// In demo mode, verify password against local DB
	if !facades.Hash().Check(req.Password, user.Password) {
		return nil, errors.New("autentikasi LDAP gagal")
	}

	dept := ""
	if user.DepartmentID != nil {
		if d, err := s.orgRepo.FindDepartmentByID(*user.DepartmentID); err == nil {
			dept = d.Name
		}
	}

	empID := ""
	if user.EmployeeID != nil {
		empID = *user.EmployeeID
	}

	return &SSOUserInfo{
		Email:      user.Email,
		Name:       user.Name,
		EmployeeID: empID,
		Department: dept,
	}, nil
}

// authenticateSAML validates SAML assertion (scaffolding)
func (s *SSOService) authenticateSAML(config *SSOConfig, req SSOLoginRequest) (*SSOUserInfo, error) {
	if req.Token == "" {
		return nil, errors.New("SAML assertion diperlukan")
	}

	// SAML assertion validation scaffolding
	// In production: parse XML assertion, validate signature against IdP cert, extract attributes
	return nil, errors.New("SAML authentication belum diimplementasikan — membutuhkan konfigurasi IdP")
}

// authenticateAzureAD validates Azure AD OAuth token (scaffolding)
func (s *SSOService) authenticateAzureAD(config *SSOConfig, req SSOLoginRequest) (*SSOUserInfo, error) {
	if req.Token == "" {
		return nil, errors.New("Azure AD token diperlukan")
	}

	// Azure AD token validation scaffolding
	// In production: validate JWT from Azure AD, extract claims (email, name, oid)
	return nil, errors.New("Azure AD authentication belum diimplementasikan — membutuhkan konfigurasi tenant")
}

// findOrProvisionUser finds existing user or creates new one from SSO data
func (s *SSOService) findOrProvisionUser(config *SSOConfig, info *SSOUserInfo) (*models.User, error) {
	user, err := s.userRepo.FindByEmail(info.Email)
	if err == nil && user.ID != "" {
		return user, nil
	}

	if !config.AutoProvision {
		return nil, errors.New("akun belum terdaftar dan auto-provisioning tidak aktif")
	}

	if config.DefaultCompanyID == "" || config.DefaultOfficeID == "" {
		return nil, errors.New("default company/office belum dikonfigurasi untuk auto-provisioning")
	}

	// Create new user
	hashedPw, _ := facades.Hash().Make(uuid.New().String()) // random password — SSO users don't need one
	newUser := &models.User{
		ID:         uuid.New().String(),
		CompanyID:  config.DefaultCompanyID,
		OfficeID:   config.DefaultOfficeID,
		EmployeeID: &info.EmployeeID,
		Name:       info.Name,
		Email:      info.Email,
		Password:   hashedPw,
		IsActive:   true,
	}
	if info.Phone != "" {
		newUser.Phone = &info.Phone
	}

	if err := facades.Orm().Query().Create(newUser); err != nil {
		return nil, fmt.Errorf("gagal membuat user: %v", err)
	}

	// Assign default role
	if config.DefaultRoleID != "" {
		_, _ = facades.Orm().Query().Exec(
			"INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
			newUser.ID, config.DefaultRoleID,
		)
	}

	return newUser, nil
}

func (s *SSOService) findUserByEmployeeID(employeeID string) (*models.User, error) {
	var user models.User
	err := facades.Orm().Query().Where("employee_id = ?", employeeID).First(&user)
	if err != nil || user.ID == "" {
		return nil, errors.New("user not found")
	}
	return &user, nil
}

// GetStatus returns SSO connection status info
// GetStatus returns SSO connection status info
func (s *SSOService) GetStatus() map[string]interface{} {
	config, _ := s.GetConfig()

	status := map[string]interface{}{
		"enabled":  config.Enabled,
		"provider": config.Provider,
	}

	switch config.Provider {
	case "ldap":
		status["configured"] = config.LDAPHost != ""
		status["host"] = config.LDAPHost
		status["port"] = config.LDAPPort
		// In production: attempt LDAP connection test
		if config.LDAPHost != "" {
			status["connection"] = "not_tested"
		} else {
			status["connection"] = "not_configured"
		}
	case "saml":
		status["configured"] = config.SAMLMetadataURL != ""
		status["metadata_url"] = config.SAMLMetadataURL
	case "azure_ad":
		status["configured"] = config.AzureTenantID != "" && config.AzureClientID != ""
		status["tenant_id"] = config.AzureTenantID
	}

	return status
}

func (s *SSOService) loadUserRelations(user *models.User) {
	if company, err := s.orgRepo.FindCompanyByID(user.CompanyID); err == nil {
		user.Company = company
	}
	if office, err := s.orgRepo.FindOfficeByID(user.OfficeID); err == nil {
		user.Office = office
	}
	if user.DepartmentID != nil {
		if dept, err := s.orgRepo.FindDepartmentByID(*user.DepartmentID); err == nil {
			user.Department = dept
		}
	}
	if user.SectionID != nil {
		if section, err := s.orgRepo.FindSectionByID(*user.SectionID); err == nil {
			user.Section = section
		}
	}
	if user.PositionID != nil {
		if position, err := s.orgRepo.FindPositionByID(*user.PositionID); err == nil {
			user.Position = position
		}
	}
}

func (s *SSOService) loadUserRolesWithPermissions(userID string) []models.Role {
	roles, err := s.roleRepo.FindRolesByUserID(userID)
	if err != nil || len(roles) == 0 {
		return nil
	}
	for i := range roles {
		if perms, err := s.roleRepo.FindPermissionsByRoleID(roles[i].ID); err == nil {
			roles[i].Permissions = perms
		}
	}
	return roles
}
