package services

import (
	"errors"
	"time"

	"github.com/goravel/framework/contracts/http"

	"dms/app/facades"
	"dms/app/models"
	"dms/app/repositories"
)

type AuthService struct {
	userRepo repositories.UserRepository
	roleRepo repositories.RoleRepository
	orgRepo  repositories.OrganizationRepository
}

func NewAuthService() *AuthService {
	return &AuthService{
		userRepo: repositories.NewUserRepository(),
		roleRepo: repositories.NewRoleRepository(),
		orgRepo:  repositories.NewOrganizationRepository(),
	}
}

func (s *AuthService) Login(ctx http.Context, email, password string) (*models.User, string, error) {
	user, err := s.userRepo.FindByEmail(email)
	if err != nil || user == nil {
		return nil, "", errors.New("invalid credentials")
	}

	if !user.IsActive {
		return nil, "", errors.New("invalid credentials: user inactive")
	}

	if !facades.Hash().Check(password, user.Password) {
		return nil, "", errors.New("invalid credentials")
	}

	user.Roles = s.loadUserRolesWithPermissions(user.ID)

	token, err := facades.Auth(ctx).LoginUsingID(user.ID)
	if err != nil {
		return nil, "", errors.New("failed to generate token")
	}

	now := time.Now()
	ip := ctx.Request().Ip()
	_ = s.userRepo.UpdateFields(user, map[string]any{
		"last_login_at": now,
		"last_login_ip": ip,
	})

	s.loadUserRelations(user)

	return user, token, nil
}

func (s *AuthService) GetProfile(ctx http.Context) (*models.User, error) {
	userID, err := facades.Auth(ctx).ID()
	if err != nil {
		return nil, errors.New("unauthorized")
	}

	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	s.loadUserRelations(user)
	user.Roles = s.loadUserRolesWithPermissions(user.ID)

	return user, nil
}

func (s *AuthService) ChangePassword(userID, oldPassword, newPassword string) error {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return errors.New("user not found")
	}

	if !facades.Hash().Check(oldPassword, user.Password) {
		return errors.New("current password is incorrect")
	}

	hashed, err := facades.Hash().Make(newPassword)
	if err != nil {
		return err
	}

	return s.userRepo.UpdateFields(user, map[string]any{"password": hashed})
}

func (s *AuthService) loadUserRelations(user *models.User) {
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

func (s *AuthService) loadUserRolesWithPermissions(userID string) []models.Role {
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
