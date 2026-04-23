package repositories

import (
	"dms/app/facades"
	"dms/app/models"
)

type RoleRepository interface {
	FindRolesByUserID(userID string) ([]models.Role, error)
	FindPermissionsByRoleID(roleID string) ([]models.Permission, error)
	ListRoles() ([]models.Role, error)
	FindRoleByID(id string) (*models.Role, error)
	ListPermissions() ([]models.Permission, error)
	CreateRole(role *models.Role) error
	UpdateRole(role *models.Role) error
	DeleteRole(id string) error
	SyncRolePermissions(roleID string, permissionIDs []string) error
}

type roleRepository struct{}

func NewRoleRepository() RoleRepository {
	return &roleRepository{}
}

func (r *roleRepository) FindRolesByUserID(userID string) ([]models.Role, error) {
	var userRoles []models.UserRole
	if err := facades.Orm().Query().Where("user_id = ?", userID).Get(&userRoles); err != nil {
		return nil, err
	}
	if len(userRoles) == 0 {
		return nil, nil
	}

	roleIDs := make([]any, len(userRoles))
	for i, ur := range userRoles {
		roleIDs[i] = ur.RoleID
	}

	var roles []models.Role
	if err := facades.Orm().Query().WhereIn("id", roleIDs).Get(&roles); err != nil {
		return nil, err
	}

	return roles, nil
}

func (r *roleRepository) FindPermissionsByRoleID(roleID string) ([]models.Permission, error) {
	var rolePerms []struct {
		PermissionID string `gorm:"column:permission_id"`
	}
	if err := facades.Orm().Query().
		Model(&models.RolePermission{}).
		Where("role_id = ?", roleID).
		Get(&rolePerms); err != nil {
		return nil, err
	}
	if len(rolePerms) == 0 {
		return nil, nil
	}

	permIDs := make([]any, len(rolePerms))
	for j, rp := range rolePerms {
		permIDs[j] = rp.PermissionID
	}

	var perms []models.Permission
	if err := facades.Orm().Query().WhereIn("id", permIDs).Get(&perms); err != nil {
		return nil, err
	}

	return perms, nil
}

func (r *roleRepository) ListRoles() ([]models.Role, error) {
	var roles []models.Role
	if err := facades.Orm().Query().Order("name asc").Get(&roles); err != nil {
		return nil, err
	}
	return roles, nil
}

func (r *roleRepository) FindRoleByID(id string) (*models.Role, error) {
	var role models.Role
	if err := facades.Orm().Query().
		With("Permissions").
		Where("id = ?", id).
		First(&role); err != nil {
		return nil, err
	}
	return &role, nil
}

func (r *roleRepository) ListPermissions() ([]models.Permission, error) {
	var perms []models.Permission
	if err := facades.Orm().Query().Order("module asc, name asc").Get(&perms); err != nil {
		return nil, err
	}
	return perms, nil
}

func (r *roleRepository) CreateRole(role *models.Role) error {
	return facades.Orm().Query().Create(role)
}

func (r *roleRepository) UpdateRole(role *models.Role) error {
	return facades.Orm().Query().Save(role)
}

func (r *roleRepository) DeleteRole(id string) error {
	// Delete role permissions first
	facades.Orm().Query().Where("role_id = ?", id).Delete(&models.RolePermission{})
	// Delete user roles
	facades.Orm().Query().Where("role_id = ?", id).Delete(&models.UserRole{})
	// Delete role
	_, err := facades.Orm().Query().Where("id = ?", id).Delete(&models.Role{})
	return err
}

func (r *roleRepository) SyncRolePermissions(roleID string, permissionIDs []string) error {
	// Delete existing permissions
	facades.Orm().Query().Where("role_id = ?", roleID).Delete(&models.RolePermission{})

	// Insert new permissions
	for _, permID := range permissionIDs {
		rp := models.RolePermission{
			RoleID:       roleID,
			PermissionID: permID,
		}
		if err := facades.Orm().Query().Create(&rp); err != nil {
			return err
		}
	}
	return nil
}
