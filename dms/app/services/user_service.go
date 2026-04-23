package services

import (
	"errors"
	"math"
	"time"

	"github.com/goravel/framework/contracts/http"

	"dms/app/facades"
	"dms/app/models"
	"dms/app/repositories"
)

type CreateUserInput struct {
	CompanyID    string  `json:"company_id"`
	OfficeID     string  `json:"office_id"`
	DepartmentID *string `json:"department_id"`
	SectionID    *string `json:"section_id"`
	PositionID   *string `json:"position_id"`
	EmployeeID   *string `json:"employee_id"`
	Name         string  `json:"name"`
	Email        string  `json:"email"`
	Password     string  `json:"password"`
	Phone        *string `json:"phone"`
	JoinDate     *string `json:"join_date"`
	IsActive     bool    `json:"is_active"`
}

type UpdateUserInput struct {
	CompanyID    *string `json:"company_id"`
	OfficeID     *string `json:"office_id"`
	DepartmentID *string `json:"department_id"`
	SectionID    *string `json:"section_id"`
	PositionID   *string `json:"position_id"`
	EmployeeID   *string `json:"employee_id"`
	Name         *string `json:"name"`
	Email        *string `json:"email"`
	Password     *string `json:"password"`
	Phone        *string `json:"phone"`
	JoinDate     *string `json:"join_date"`
	IsActive     *bool   `json:"is_active"`
}

type UserService interface {
	List(ctx http.Context, filters map[string]any) ([]models.User, map[string]any, error)
	Create(ctx http.Context, input CreateUserInput) (*models.User, error)
	Show(id string) (*models.User, error)
	Update(id string, input UpdateUserInput) (*models.User, error)
	Delete(id string) error
	UploadSignature(ctx http.Context, userID string) (string, error)
	DeleteSignature(userID string) error
	UploadAvatar(ctx http.Context, userID string) (string, error)
	AssignRoles(userID string, roleIDs []string) error
	ListRoles() ([]models.Role, error)
	ShowRole(id string) (*models.Role, error)
	CreateRole(name, description string, permissionIDs []string) (*models.Role, error)
	UpdateRole(id string, name, description string, permissionIDs []string) (*models.Role, error)
	DeleteRole(id string) error
	ListPermissions() ([]models.Permission, error)
}

type userService struct {
	userRepo    repositories.UserRepository
	roleRepo    repositories.RoleRepository
	fileService FileService
}

func NewUserService() UserService {
	return &userService{
		userRepo:    repositories.NewUserRepository(),
		roleRepo:    repositories.NewRoleRepository(),
		fileService: NewFileService(),
	}
}

func (s *userService) List(ctx http.Context, filters map[string]any) ([]models.User, map[string]any, error) {
	users, total, err := s.userRepo.ListUsers(filters)
	if err != nil {
		return nil, nil, err
	}

	page := 1
	perPage := 20
	if v, ok := filters["page"].(int); ok && v > 0 {
		page = v
	}
	if v, ok := filters["per_page"].(int); ok && v > 0 {
		if v > 100 {
			v = 100
		}
		perPage = v
	}
	totalPages := int(math.Ceil(float64(total) / float64(perPage)))

	meta := map[string]any{
		"page":        page,
		"per_page":    perPage,
		"total":       total,
		"total_pages": totalPages,
	}

	return users, meta, nil
}

func (s *userService) Create(ctx http.Context, input CreateUserInput) (*models.User, error) {
	// Check email uniqueness
	existing, _ := s.userRepo.FindByEmail(input.Email)
	if existing != nil {
		return nil, errors.New("email already in use")
	}

	// Check employee_id uniqueness if provided
	if input.EmployeeID != nil && *input.EmployeeID != "" {
		existingEmp, _ := s.userRepo.FindByEmployeeID(*input.EmployeeID)
		if existingEmp != nil {
			return nil, errors.New("employee ID already in use")
		}
	}

	// Validate company exists
	var company models.Company
	if err := facades.Orm().Query().Where("id = ?", input.CompanyID).First(&company); err != nil {
		return nil, errors.New("company not found")
	}

	// Validate office exists
	var office models.Office
	if err := facades.Orm().Query().Where("id = ?", input.OfficeID).First(&office); err != nil {
		return nil, errors.New("office not found")
	}

	// Hash password
	hashedPassword, err := facades.Hash().Make(input.Password)
	if err != nil {
		return nil, errors.New("failed to hash password")
	}

	user := models.User{
		CompanyID:    input.CompanyID,
		OfficeID:     input.OfficeID,
		DepartmentID: input.DepartmentID,
		SectionID:    input.SectionID,
		PositionID:   input.PositionID,
		EmployeeID:   input.EmployeeID,
		Name:         input.Name,
		Email:        input.Email,
		Password:     hashedPassword,
		Phone:        input.Phone,
		IsActive:     input.IsActive,
	}

	if input.JoinDate != nil && *input.JoinDate != "" {
		t, err := time.Parse("2006-01-02", *input.JoinDate)
		if err == nil {
			user.JoinDate = &t
		}
	}

	if err := s.userRepo.CreateUser(&user); err != nil {
		return nil, err
	}

	// Reload with relations
	created, err := s.userRepo.FindByIDWithRelations(user.ID)
	if err != nil {
		return &user, nil
	}
	return created, nil
}

func (s *userService) Show(id string) (*models.User, error) {
	return s.userRepo.FindByIDWithRelations(id)
}

func (s *userService) Update(id string, input UpdateUserInput) (*models.User, error) {
	user, err := s.userRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("user not found")
	}

	// Check email uniqueness if changed
	if input.Email != nil && *input.Email != user.Email {
		existing, _ := s.userRepo.FindByEmail(*input.Email)
		if existing != nil {
			return nil, errors.New("email already in use")
		}
		user.Email = *input.Email
	}

	// Check employee_id uniqueness if changed
	if input.EmployeeID != nil {
		if *input.EmployeeID != "" {
			existingEmp, _ := s.userRepo.FindByEmployeeID(*input.EmployeeID)
			if existingEmp != nil && existingEmp.ID != id {
				return nil, errors.New("employee ID already in use")
			}
		}
		user.EmployeeID = input.EmployeeID
	}

	if input.CompanyID != nil {
		user.CompanyID = *input.CompanyID
	}
	if input.OfficeID != nil {
		user.OfficeID = *input.OfficeID
	}
	if input.DepartmentID != nil {
		user.DepartmentID = input.DepartmentID
	}
	if input.SectionID != nil {
		user.SectionID = input.SectionID
	}
	if input.PositionID != nil {
		user.PositionID = input.PositionID
	}
	if input.Name != nil {
		user.Name = *input.Name
	}
	if input.Phone != nil {
		user.Phone = input.Phone
	}
	if input.IsActive != nil {
		user.IsActive = *input.IsActive
	}
	if input.JoinDate != nil && *input.JoinDate != "" {
		t, err := time.Parse("2006-01-02", *input.JoinDate)
		if err == nil {
			user.JoinDate = &t
		}
	}

	// Hash password if provided
	if input.Password != nil && *input.Password != "" {
		hashedPassword, err := facades.Hash().Make(*input.Password)
		if err != nil {
			return nil, errors.New("failed to hash password")
		}
		user.Password = hashedPassword
	}

	if err := s.userRepo.UpdateUser(user); err != nil {
		return nil, err
	}

	// Reload with relations
	updated, err := s.userRepo.FindByIDWithRelations(user.ID)
	if err != nil {
		return user, nil
	}
	return updated, nil
}

func (s *userService) Delete(id string) error {
	_, err := s.userRepo.FindByID(id)
	if err != nil {
		return errors.New("user not found")
	}
	return s.userRepo.DeleteUser(id)
}

func (s *userService) UploadSignature(ctx http.Context, userID string) (string, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return "", errors.New("user not found")
	}

	// Get company code for path
	var company models.Company
	if err := facades.Orm().Query().Where("id = ?", user.CompanyID).First(&company); err != nil {
		return "", errors.New("company not found")
	}

	// Delete old signature if exists
	if user.SignaturePath != nil && *user.SignaturePath != "" {
		_ = s.fileService.Delete(*user.SignaturePath)
	}

	path, err := s.fileService.Upload(ctx, "signature", FileUploadOptions{
		CompanyCode: company.Code,
		Module:      "signatures",
		Category:    "user",
		Filename:    "signature.png",
	})
	if err != nil {
		return "", err
	}

	now := time.Now()
	if err := s.userRepo.UpdateFields(user, map[string]any{
		"signature_path":        path,
		"signature_uploaded_at": now,
	}); err != nil {
		return "", err
	}

	return path, nil
}

func (s *userService) DeleteSignature(userID string) error {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return errors.New("user not found")
	}

	if user.SignaturePath != nil && *user.SignaturePath != "" {
		_ = s.fileService.Delete(*user.SignaturePath)
	}

	return s.userRepo.UpdateFields(user, map[string]any{
		"signature_path":        nil,
		"signature_uploaded_at": nil,
	})
}

func (s *userService) UploadAvatar(ctx http.Context, userID string) (string, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return "", errors.New("user not found")
	}

	var company models.Company
	if err := facades.Orm().Query().Where("id = ?", user.CompanyID).First(&company); err != nil {
		return "", errors.New("company not found")
	}

	// Delete old avatar if exists
	if user.AvatarPath != nil && *user.AvatarPath != "" {
		_ = s.fileService.Delete(*user.AvatarPath)
	}

	path, err := s.fileService.Upload(ctx, "avatar", FileUploadOptions{
		CompanyCode: company.Code,
		Module:      "avatars",
		Category:    "user",
		Filename:    "avatar.png",
	})
	if err != nil {
		return "", err
	}

	if err := s.userRepo.UpdateFields(user, map[string]any{
		"avatar_path": path,
	}); err != nil {
		return "", err
	}

	return path, nil
}

func (s *userService) AssignRoles(userID string, roleIDs []string) error {
	_, err := s.userRepo.FindByID(userID)
	if err != nil {
		return errors.New("user not found")
	}

	// Validate all role IDs exist
	for _, roleID := range roleIDs {
		role, err := s.roleRepo.FindRoleByID(roleID)
		if err != nil || role == nil {
			return errors.New("role not found: " + roleID)
		}
	}

	return s.userRepo.AssignRoles(userID, roleIDs)
}

func (s *userService) ListRoles() ([]models.Role, error) {
	return s.roleRepo.ListRoles()
}

func (s *userService) ShowRole(id string) (*models.Role, error) {
	role, err := s.roleRepo.FindRoleByID(id)
	if err != nil {
		return nil, errors.New("role not found")
	}

	// Load permissions
	perms, err := s.roleRepo.FindPermissionsByRoleID(role.ID)
	if err == nil {
		role.Permissions = perms
	}

	return role, nil
}

func (s *userService) CreateRole(name, description string, permissionIDs []string) (*models.Role, error) {
	role := &models.Role{
		Name:        name,
		Description: &description,
		IsSystem:    false,
	}

	if err := s.roleRepo.CreateRole(role); err != nil {
		return nil, err
	}

	// Sync permissions
	if len(permissionIDs) > 0 {
		if err := s.roleRepo.SyncRolePermissions(role.ID, permissionIDs); err != nil {
			return nil, err
		}
	}

	return s.ShowRole(role.ID)
}

func (s *userService) UpdateRole(id string, name, description string, permissionIDs []string) (*models.Role, error) {
	role, err := s.roleRepo.FindRoleByID(id)
	if err != nil {
		return nil, errors.New("role not found")
	}

	if role.IsSystem {
		return nil, errors.New("cannot modify system role")
	}

	role.Name = name
	role.Description = &description

	if err := s.roleRepo.UpdateRole(role); err != nil {
		return nil, err
	}

	// Sync permissions
	if err := s.roleRepo.SyncRolePermissions(role.ID, permissionIDs); err != nil {
		return nil, err
	}

	return s.ShowRole(role.ID)
}

func (s *userService) DeleteRole(id string) error {
	role, err := s.roleRepo.FindRoleByID(id)
	if err != nil {
		return errors.New("role not found")
	}

	if role.IsSystem {
		return errors.New("cannot delete system role")
	}

	return s.roleRepo.DeleteRole(id)
}

func (s *userService) ListPermissions() ([]models.Permission, error) {
	return s.roleRepo.ListPermissions()
}
