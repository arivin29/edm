package controllers

import (
	"github.com/goravel/framework/contracts/http"

	"dms/app/facades"
	"dms/app/services"
)

type AuthController struct {
	authService *services.AuthService
	ssoService  *services.SSOService
}

func NewAuthController() *AuthController {
	return &AuthController{
		authService: services.NewAuthService(),
		ssoService:  services.NewSSOService(),
	}
}

func (c *AuthController) Login(ctx http.Context) http.Response {
	validator, err := facades.Validation().Make(ctx, ctx.Request().All(), map[string]string{
		"email":    "required|email",
		"password": "required|min_len:6",
	})
	if err != nil {
		return ctx.Response().Json(http.StatusUnprocessableEntity, http.Json{
			"error": "Validation error",
		})
	}
	if validator.Fails() {
		return ctx.Response().Json(http.StatusUnprocessableEntity, http.Json{
			"error":  "Validation failed",
			"errors": validator.Errors().All(),
		})
	}

	email := ctx.Request().Input("email")
	password := ctx.Request().Input("password")

	user, token, err := c.authService.Login(ctx, email, password)
	if err != nil {
		return ctx.Response().Json(http.StatusUnauthorized, http.Json{
			"error": err.Error(),
		})
	}

	permissions := []string{}
	roleNames := []string{}
	for _, role := range user.Roles {
		roleNames = append(roleNames, role.Name)
		for _, perm := range role.Permissions {
			permissions = append(permissions, perm.Name)
		}
	}

	return ctx.Response().Success().Json(http.Json{
		"data": http.Json{
			"user": http.Json{
				"id":          user.ID,
				"name":        user.Name,
				"email":       user.Email,
				"employee_id": user.EmployeeID,
				"company":     user.Company,
				"office":      user.Office,
				"department":  user.Department,
				"section":     user.Section,
				"position":    user.Position,
				"roles":       roleNames,
				"permissions": permissions,
			},
			"token": token,
		},
	})
}

func (c *AuthController) Logout(ctx http.Context) http.Response {
	if err := facades.Auth(ctx).Logout(); err != nil {
		return ctx.Response().Json(http.StatusInternalServerError, http.Json{
			"error": "Failed to logout",
		})
	}
	return ctx.Response().Success().Json(http.Json{
		"message": "Logged out successfully",
	})
}

func (c *AuthController) Refresh(ctx http.Context) http.Response {
	token, err := facades.Auth(ctx).Refresh()
	if err != nil {
		return ctx.Response().Json(http.StatusUnauthorized, http.Json{
			"error": "Failed to refresh token",
		})
	}
	return ctx.Response().Success().Json(http.Json{
		"data": http.Json{
			"token": token,
		},
	})
}

func (c *AuthController) Me(ctx http.Context) http.Response {
	user, err := c.authService.GetProfile(ctx)
	if err != nil {
		return ctx.Response().Json(http.StatusUnauthorized, http.Json{
			"error": err.Error(),
		})
	}

	permissions := []string{}
	roleNames := []string{}
	for _, role := range user.Roles {
		roleNames = append(roleNames, role.Name)
		for _, perm := range role.Permissions {
			permissions = append(permissions, perm.Name)
		}
	}

	return ctx.Response().Success().Json(http.Json{
		"data": http.Json{
			"id":          user.ID,
			"name":        user.Name,
			"email":       user.Email,
			"employee_id": user.EmployeeID,
			"company":     user.Company,
			"office":      user.Office,
			"department":  user.Department,
			"section":     user.Section,
			"position":    user.Position,
			"roles":       roleNames,
			"permissions": permissions,
		},
	})
}

func (c *AuthController) ChangePassword(ctx http.Context) http.Response {
	validator, err := facades.Validation().Make(ctx, ctx.Request().All(), map[string]string{
		"current_password": "required",
		"new_password":     "required|min_len:8",
	})
	if err != nil {
		return ctx.Response().Json(http.StatusUnprocessableEntity, http.Json{
			"error": "Validation error",
		})
	}
	if validator.Fails() {
		return ctx.Response().Json(http.StatusUnprocessableEntity, http.Json{
			"error":  "Validation failed",
			"errors": validator.Errors().All(),
		})
	}

	userID, err := facades.Auth(ctx).ID()
	if err != nil {
		return ctx.Response().Json(http.StatusUnauthorized, http.Json{
			"error": "Unauthorized",
		})
	}

	if err := c.authService.ChangePassword(
		userID,
		ctx.Request().Input("current_password"),
		ctx.Request().Input("new_password"),
	); err != nil {
		return ctx.Response().Json(http.StatusBadRequest, http.Json{
			"error": err.Error(),
		})
	}

	return ctx.Response().Success().Json(http.Json{
		"message": "Password changed successfully",
	})
}

// SSOLogin handles SSO authentication
func (c *AuthController) SSOLogin(ctx http.Context) http.Response {
	provider := ctx.Request().Input("provider", "ldap")
	username := ctx.Request().Input("username")
	password := ctx.Request().Input("password")
	token := ctx.Request().Input("token")

	user, jwtToken, err := c.ssoService.Login(ctx, services.SSOLoginRequest{
		Provider: provider,
		Username: username,
		Password: password,
		Token:    token,
	})
	if err != nil {
		return ctx.Response().Json(http.StatusUnauthorized, http.Json{
			"error": err.Error(),
		})
	}

	permissions := []string{}
	roleNames := []string{}
	for _, role := range user.Roles {
		roleNames = append(roleNames, role.Name)
		for _, perm := range role.Permissions {
			permissions = append(permissions, perm.Name)
		}
	}

	return ctx.Response().Success().Json(http.Json{
		"data": http.Json{
			"user": http.Json{
				"id":          user.ID,
				"name":        user.Name,
				"email":       user.Email,
				"employee_id": user.EmployeeID,
				"company":     user.Company,
				"office":      user.Office,
				"department":  user.Department,
				"section":     user.Section,
				"position":    user.Position,
				"roles":       roleNames,
				"permissions": permissions,
			},
			"token": jwtToken,
		},
		"message": "Login SSO berhasil",
	})
}

// SSOConfig returns SSO configuration (public — login page needs to know if SSO is enabled)
func (c *AuthController) SSOConfig(ctx http.Context) http.Response {
	config, err := c.ssoService.GetConfig()
	if err != nil {
		return ctx.Response().Json(http.StatusInternalServerError, http.Json{
			"error": err.Error(),
		})
	}

	// Only expose safe fields to public endpoint
	return ctx.Response().Success().Json(http.Json{
		"data": http.Json{
			"enabled":  config.Enabled,
			"provider": config.Provider,
		},
	})
}

// SSOStatus returns full SSO status (admin only)
func (c *AuthController) SSOStatus(ctx http.Context) http.Response {
	status := c.ssoService.GetStatus()
	return ctx.Response().Success().Json(http.Json{
		"data": status,
	})
}
