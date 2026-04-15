package types

import (
	"github.com/goravel/framework/contracts/http"
)

const CurrentUserKey = "current_user"

type UserContext struct {
	ID           string
	CompanyID    string
	OfficeID     string
	DepartmentID *string
	SectionID    *string
	Roles        []string
	Permissions  []string
}

func (u *UserContext) HasPermission(permission string) bool {
	for _, p := range u.Permissions {
		if p == permission {
			return true
		}
	}
	return false
}

func (u *UserContext) HasRole(role string) bool {
	for _, r := range u.Roles {
		if r == role {
			return true
		}
	}
	return false
}

func (u *UserContext) HasAnyPermission(permissions ...string) bool {
	for _, p := range permissions {
		if u.HasPermission(p) {
			return true
		}
	}
	return false
}

func (u *UserContext) HasAllPermissions(permissions ...string) bool {
	for _, p := range permissions {
		if !u.HasPermission(p) {
			return false
		}
	}
	return true
}

func GetCurrentUser(ctx http.Context) *UserContext {
	if user, ok := ctx.Value(CurrentUserKey).(*UserContext); ok {
		return user
	}
	return nil
}
