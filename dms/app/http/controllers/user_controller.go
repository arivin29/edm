package controllers

import (
	"github.com/goravel/framework/contracts/http"

	"dms/app/facades"
	"dms/app/services"
	"dms/app/types"
)

type UserController struct {
	userService services.UserService
}

func NewUserController() *UserController {
	return &UserController{
		userService: services.NewUserService(),
	}
}

func (c *UserController) Index(ctx http.Context) http.Response {
	filters := map[string]any{
		"search":        ctx.Request().Input("search"),
		"company_id":    ctx.Request().Input("company_id"),
		"office_id":     ctx.Request().Input("office_id"),
		"department_id": ctx.Request().Input("department_id"),
		"section_id":    ctx.Request().Input("section_id"),
		"position_id":   ctx.Request().Input("position_id"),
		"role":          ctx.Request().Input("role"),
		"is_active":     ctx.Request().Input("is_active"),
		"sort_by":       ctx.Request().Input("sort_by"),
		"sort_dir":      ctx.Request().Input("sort_dir"),
		"page":          ctx.Request().InputInt("page", 1),
		"per_page":      ctx.Request().InputInt("per_page", 20),
	}

	users, meta, err := c.userService.List(ctx, filters)
	if err != nil {
		return serverError(ctx, "Failed to list users")
	}

	return ctx.Response().Success().Json(http.Json{
		"data": users,
		"meta": meta,
	})
}

func (c *UserController) Store(ctx http.Context) http.Response {
	validator, err := facades.Validation().Make(ctx, ctx.Request().All(), map[string]string{
		"company_id": "required",
		"office_id":  "required",
		"name":       "required|max_len:255",
		"email":      "required|email|max_len:255",
		"password":   "required|min_len:8|max_len:128",
	})
	if err != nil {
		return validationError(ctx, err)
	}
	if validator.Fails() {
		return validationFailed(ctx, validator.Errors().All())
	}

	input := services.CreateUserInput{
		CompanyID: ctx.Request().Input("company_id"),
		OfficeID:  ctx.Request().Input("office_id"),
		Name:      ctx.Request().Input("name"),
		Email:     ctx.Request().Input("email"),
		Password:  ctx.Request().Input("password"),
		IsActive:  ctx.Request().InputBool("is_active", true),
	}

	if v := ctx.Request().Input("department_id"); v != "" {
		input.DepartmentID = &v
	}
	if v := ctx.Request().Input("section_id"); v != "" {
		input.SectionID = &v
	}
	if v := ctx.Request().Input("position_id"); v != "" {
		input.PositionID = &v
	}
	if v := ctx.Request().Input("employee_id"); v != "" {
		input.EmployeeID = &v
	}
	if v := ctx.Request().Input("phone"); v != "" {
		input.Phone = &v
	}
	if v := ctx.Request().Input("join_date"); v != "" {
		input.JoinDate = &v
	}

	user, err := c.userService.Create(ctx, input)
	if err != nil {
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Json(http.StatusCreated, http.Json{
		"data": user,
	})
}

func (c *UserController) Show(ctx http.Context) http.Response {
	id := ctx.Request().Route("id")
	user, err := c.userService.Show(id)
	if err != nil {
		return notFoundError(ctx, "User not found")
	}
	return ctx.Response().Success().Json(http.Json{
		"data": user,
	})
}

func (c *UserController) Update(ctx http.Context) http.Response {
	id := ctx.Request().Route("id")

	input := services.UpdateUserInput{}

	if v := ctx.Request().Input("company_id"); v != "" {
		input.CompanyID = &v
	}
	if v := ctx.Request().Input("office_id"); v != "" {
		input.OfficeID = &v
	}
	if v := ctx.Request().Input("department_id"); v != "" {
		input.DepartmentID = &v
	}
	if v := ctx.Request().Input("section_id"); v != "" {
		input.SectionID = &v
	}
	if v := ctx.Request().Input("position_id"); v != "" {
		input.PositionID = &v
	}
	if v := ctx.Request().Input("employee_id"); v != "" {
		input.EmployeeID = &v
	}
	if v := ctx.Request().Input("name"); v != "" {
		input.Name = &v
	}
	if v := ctx.Request().Input("email"); v != "" {
		input.Email = &v
	}
	if v := ctx.Request().Input("password"); v != "" {
		input.Password = &v
	}
	if v := ctx.Request().Input("phone"); v != "" {
		input.Phone = &v
	}
	if v := ctx.Request().Input("join_date"); v != "" {
		input.JoinDate = &v
	}
	if v := ctx.Request().Input("is_active"); v != "" {
		b := ctx.Request().InputBool("is_active")
		input.IsActive = &b
	}

	user, err := c.userService.Update(id, input)
	if err != nil {
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Success().Json(http.Json{
		"data": user,
	})
}

func (c *UserController) Delete(ctx http.Context) http.Response {
	id := ctx.Request().Route("id")
	if err := c.userService.Delete(id); err != nil {
		return badRequestError(ctx, err.Error())
	}
	return ctx.Response().Success().Json(http.Json{
		"message": "User deleted successfully",
	})
}

func (c *UserController) UploadSignature(ctx http.Context) http.Response {
	id := ctx.Request().Route("id")

	// Self or user.edit permission check
	currentUser := types.GetCurrentUser(ctx)
	if currentUser == nil {
		return ctx.Response().Json(http.StatusUnauthorized, http.Json{"error": "Unauthorized"})
	}
	if currentUser.ID != id && !currentUser.HasPermission("user.edit") {
		return ctx.Response().Json(http.StatusForbidden, http.Json{"error": "Insufficient permission"})
	}

	path, err := c.userService.UploadSignature(ctx, id)
	if err != nil {
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Success().Json(http.Json{
		"data": http.Json{
			"signature_path": path,
		},
	})
}

func (c *UserController) DeleteSignature(ctx http.Context) http.Response {
	id := ctx.Request().Route("id")

	currentUser := types.GetCurrentUser(ctx)
	if currentUser == nil {
		return ctx.Response().Json(http.StatusUnauthorized, http.Json{"error": "Unauthorized"})
	}
	if currentUser.ID != id && !currentUser.HasPermission("user.edit") {
		return ctx.Response().Json(http.StatusForbidden, http.Json{"error": "Insufficient permission"})
	}

	if err := c.userService.DeleteSignature(id); err != nil {
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Success().Json(http.Json{
		"message": "Signature deleted successfully",
	})
}

func (c *UserController) UploadAvatar(ctx http.Context) http.Response {
	id := ctx.Request().Route("id")

	currentUser := types.GetCurrentUser(ctx)
	if currentUser == nil {
		return ctx.Response().Json(http.StatusUnauthorized, http.Json{"error": "Unauthorized"})
	}
	if currentUser.ID != id && !currentUser.HasPermission("user.edit") {
		return ctx.Response().Json(http.StatusForbidden, http.Json{"error": "Insufficient permission"})
	}

	path, err := c.userService.UploadAvatar(ctx, id)
	if err != nil {
		return badRequestError(ctx, err.Error())
	}

	return ctx.Response().Success().Json(http.Json{
		"data": http.Json{
			"avatar_path": path,
		},
	})
}

func (c *UserController) AssignRoles(ctx http.Context) http.Response {
	validator, err := facades.Validation().Make(ctx, ctx.Request().All(), map[string]string{
		"role_ids": "required",
	})
	if err != nil {
		return validationError(ctx, err)
	}
	if validator.Fails() {
		return validationFailed(ctx, validator.Errors().All())
	}

	id := ctx.Request().Route("id")

	// Parse role_ids from request
	roleIDsRaw := ctx.Request().Input("role_ids")
	var roleIDs []string
	if roleIDsRaw != "" {
		// Try to get as array
		all := ctx.Request().All()
		if ids, ok := all["role_ids"].([]any); ok {
			for _, rid := range ids {
				if s, ok := rid.(string); ok {
					roleIDs = append(roleIDs, s)
				}
			}
		}
	}

	if len(roleIDs) == 0 {
		return badRequestError(ctx, "role_ids must be a non-empty array of UUIDs")
	}

	if err := c.userService.AssignRoles(id, roleIDs); err != nil {
		return badRequestError(ctx, err.Error())
	}

	// Return updated user with roles
	user, err := c.userService.Show(id)
	if err != nil {
		return ctx.Response().Success().Json(http.Json{
			"message": "Roles assigned successfully",
		})
	}

	return ctx.Response().Success().Json(http.Json{
		"data": user,
	})
}

func (c *UserController) ListRoles(ctx http.Context) http.Response {
	roles, err := c.userService.ListRoles()
	if err != nil {
		return serverError(ctx, "Failed to list roles")
	}
	return ctx.Response().Success().Json(http.Json{
		"data": roles,
	})
}

func (c *UserController) ShowRole(ctx http.Context) http.Response {
	id := ctx.Request().Route("id")
	role, err := c.userService.ShowRole(id)
	if err != nil {
		return notFoundError(ctx, "Role not found")
	}
	return ctx.Response().Success().Json(http.Json{
		"data": role,
	})
}

func (c *UserController) CreateRole(ctx http.Context) http.Response {
	name := ctx.Request().Input("name")
	description := ctx.Request().Input("description")

	if name == "" {
		return badRequestError(ctx, "Name is required")
	}

	var permissionIDs []string
	ctx.Request().Bind(&struct {
		PermissionIDs []string `json:"permission_ids"`
	}{})
	if rawIDs := ctx.Request().All()["permission_ids"]; rawIDs != nil {
		if ids, ok := rawIDs.([]any); ok {
			for _, id := range ids {
				if v, ok := id.(string); ok {
					permissionIDs = append(permissionIDs, v)
				}
			}
		}
	}

	role, err := c.userService.CreateRole(name, description, permissionIDs)
	if err != nil {
		return serverError(ctx, "Failed to create role")
	}

	return ctx.Response().Success().Json(http.Json{
		"data":    role,
		"message": "Role created successfully",
	})
}

func (c *UserController) UpdateRole(ctx http.Context) http.Response {
	id := ctx.Request().Route("id")
	name := ctx.Request().Input("name")
	description := ctx.Request().Input("description")

	if name == "" {
		return badRequestError(ctx, "Name is required")
	}

	var permissionIDs []string
	if rawIDs := ctx.Request().All()["permission_ids"]; rawIDs != nil {
		if ids, ok := rawIDs.([]any); ok {
			for _, id := range ids {
				if v, ok := id.(string); ok {
					permissionIDs = append(permissionIDs, v)
				}
			}
		}
	}

	role, err := c.userService.UpdateRole(id, name, description, permissionIDs)
	if err != nil {
		if err.Error() == "cannot modify system role" {
			return badRequestError(ctx, "Cannot modify system role")
		}
		return serverError(ctx, "Failed to update role")
	}

	return ctx.Response().Success().Json(http.Json{
		"data":    role,
		"message": "Role updated successfully",
	})
}

func (c *UserController) DeleteRole(ctx http.Context) http.Response {
	id := ctx.Request().Route("id")

	err := c.userService.DeleteRole(id)
	if err != nil {
		if err.Error() == "cannot delete system role" {
			return badRequestError(ctx, "Cannot delete system role")
		}
		return serverError(ctx, "Failed to delete role")
	}

	return ctx.Response().Success().Json(http.Json{
		"message": "Role deleted successfully",
	})
}

func (c *UserController) ListPermissions(ctx http.Context) http.Response {
	perms, err := c.userService.ListPermissions()
	if err != nil {
		return serverError(ctx, "Failed to list permissions")
	}
	return ctx.Response().Success().Json(http.Json{
		"data": perms,
	})
}
