package repositories

import (
	"dms/app/facades"
	"dms/app/models"
	"dms/app/types"
)

type RBACRepository interface {
	LoadUserContext(userID string) (*types.UserContext, error)
}

type rbacRepository struct{}

func NewRBACRepository() RBACRepository {
	return &rbacRepository{}
}

func (r *rbacRepository) LoadUserContext(userID string) (*types.UserContext, error) {
	var user models.User
	if err := facades.Orm().Query().Where("id = ?", userID).First(&user); err != nil {
		return nil, err
	}

	var userRoles []models.UserRole
	if err := facades.Orm().Query().Where("user_id = ?", userID).Get(&userRoles); err != nil {
		return nil, err
	}

	var roleNames []string
	permissionSet := make(map[string]struct{})

	if len(userRoles) > 0 {
		roleIDs := make([]any, len(userRoles))
		for i, ur := range userRoles {
			roleIDs[i] = ur.RoleID
		}

		var roles []models.Role
		if err := facades.Orm().Query().WhereIn("id", roleIDs).Get(&roles); err != nil {
			return nil, err
		}

		for _, role := range roles {
			roleNames = append(roleNames, role.Name)
		}

		// Load permissions for all roles
		var rolePerms []models.RolePermission
		if err := facades.Orm().Query().WhereIn("role_id", roleIDs).Get(&rolePerms); err != nil {
			return nil, err
		}

		if len(rolePerms) > 0 {
			permIDs := make([]any, 0, len(rolePerms))
			seen := make(map[string]struct{})
			for _, rp := range rolePerms {
				if _, ok := seen[rp.PermissionID]; !ok {
					permIDs = append(permIDs, rp.PermissionID)
					seen[rp.PermissionID] = struct{}{}
				}
			}

			var permissions []models.Permission
			if err := facades.Orm().Query().WhereIn("id", permIDs).Get(&permissions); err != nil {
				return nil, err
			}

			for _, p := range permissions {
				permissionSet[p.Name] = struct{}{}
			}
		}
	}

	permissionNames := make([]string, 0, len(permissionSet))
	for name := range permissionSet {
		permissionNames = append(permissionNames, name)
	}

	return &types.UserContext{
		ID:           user.ID,
		CompanyID:    user.CompanyID,
		OfficeID:     user.OfficeID,
		DepartmentID: user.DepartmentID,
		SectionID:    user.SectionID,
		Roles:        roleNames,
		Permissions:  permissionNames,
	}, nil
}
