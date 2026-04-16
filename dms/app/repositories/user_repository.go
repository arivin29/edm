package repositories

import (
	"fmt"
	"math"

	"dms/app/facades"
	"dms/app/models"
)

type UserRepository interface {
	FindByEmail(email string) (*models.User, error)
	FindByID(id string) (*models.User, error)
	FindByIDWithRelations(id string) (*models.User, error)
	FindByIDWithRoles(id string) (*models.User, error)
	FindByEmployeeID(employeeID string) (*models.User, error)
	UpdateFields(user *models.User, fields map[string]any) error
	ListUsers(filters map[string]any) ([]models.User, int64, error)
	CreateUser(user *models.User) error
	UpdateUser(user *models.User) error
	DeleteUser(id string) error
	AssignRoles(userID string, roleIDs []string) error
}

type userRepository struct{}

func NewUserRepository() UserRepository {
	return &userRepository{}
}

func (r *userRepository) FindByEmail(email string) (*models.User, error) {
	var user models.User
	if err := facades.Orm().Query().
		Model(&models.User{}).
		Where("email = ?", email).
		First(&user); err != nil {
		return nil, err
	}
	if user.ID == "" {
		return nil, nil
	}
	return &user, nil
}

func (r *userRepository) FindByID(id string) (*models.User, error) {
	var user models.User
	if err := facades.Orm().Query().
		Where("id = ?", id).
		First(&user); err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) FindByIDWithRelations(id string) (*models.User, error) {
	var user models.User
	if err := facades.Orm().Query().
		With("Company").
		With("Office").
		With("Department").
		With("Section").
		With("Position").
		With("Roles").
		Where("id = ?", id).
		First(&user); err != nil {
		return nil, err
	}
	// Load permissions for each role
	for i, role := range user.Roles {
		var perms []models.Permission
		var rolePerms []models.RolePermission
		if err := facades.Orm().Query().Where("role_id = ?", role.ID).Get(&rolePerms); err == nil && len(rolePerms) > 0 {
			permIDs := make([]any, len(rolePerms))
			for j, rp := range rolePerms {
				permIDs[j] = rp.PermissionID
			}
			_ = facades.Orm().Query().WhereIn("id", permIDs).Get(&perms)
		}
		user.Roles[i].Permissions = perms
	}
	return &user, nil
}

func (r *userRepository) FindByEmployeeID(employeeID string) (*models.User, error) {
	var user models.User
	if err := facades.Orm().Query().
		Where("employee_id = ?", employeeID).
		First(&user); err != nil {
		return nil, err
	}
	if user.ID == "" {
		return nil, nil
	}
	return &user, nil
}

func (r *userRepository) FindByIDWithRoles(id string) (*models.User, error) {
	var user models.User
	if err := facades.Orm().Query().
		With("Roles").
		Where("id = ?", id).
		First(&user); err != nil {
		return nil, err
	}
	if user.ID == "" {
		return nil, nil
	}
	return &user, nil
}

func (r *userRepository) UpdateFields(user *models.User, fields map[string]any) error {
	for key, val := range fields {
		if _, err := facades.Orm().Query().Model(user).Update(key, val); err != nil {
			return err
		}
	}
	return nil
}

func (r *userRepository) ListUsers(filters map[string]any) ([]models.User, int64, error) {
	query := facades.Orm().Query().Model(&models.User{})

	// Search filter (name, email, employee_id)
	if search, ok := filters["search"].(string); ok && search != "" {
		like := "%" + search + "%"
		query = query.Where("name ILIKE ? OR email ILIKE ? OR employee_id ILIKE ?", like, like, like)
	}

	// Exact filters
	if v, ok := filters["company_id"].(string); ok && v != "" {
		query = query.Where("company_id = ?", v)
	}
	if v, ok := filters["office_id"].(string); ok && v != "" {
		query = query.Where("office_id = ?", v)
	}
	if v, ok := filters["department_id"].(string); ok && v != "" {
		query = query.Where("department_id = ?", v)
	}
	if v, ok := filters["section_id"].(string); ok && v != "" {
		query = query.Where("section_id = ?", v)
	}
	if v, ok := filters["position_id"].(string); ok && v != "" {
		query = query.Where("position_id = ?", v)
	}
	if v, ok := filters["is_active"].(string); ok && v != "" {
		if v == "true" {
			query = query.Where("is_active = ?", true)
		} else if v == "false" {
			query = query.Where("is_active = ?", false)
		}
	}

	// Role filter via subquery
	if role, ok := filters["role"].(string); ok && role != "" {
		query = query.Where("id IN (SELECT user_id FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE r.name = ?)", role)
	}

	// Count total
	var total int64
	var countModel []models.User
	countQuery := facades.Orm().Query().Model(&models.User{})

	// Re-apply filters for count
	if search, ok := filters["search"].(string); ok && search != "" {
		like := "%" + search + "%"
		countQuery = countQuery.Where("name ILIKE ? OR email ILIKE ? OR employee_id ILIKE ?", like, like, like)
	}
	if v, ok := filters["company_id"].(string); ok && v != "" {
		countQuery = countQuery.Where("company_id = ?", v)
	}
	if v, ok := filters["office_id"].(string); ok && v != "" {
		countQuery = countQuery.Where("office_id = ?", v)
	}
	if v, ok := filters["department_id"].(string); ok && v != "" {
		countQuery = countQuery.Where("department_id = ?", v)
	}
	if v, ok := filters["section_id"].(string); ok && v != "" {
		countQuery = countQuery.Where("section_id = ?", v)
	}
	if v, ok := filters["position_id"].(string); ok && v != "" {
		countQuery = countQuery.Where("position_id = ?", v)
	}
	if v, ok := filters["is_active"].(string); ok && v != "" {
		if v == "true" {
			countQuery = countQuery.Where("is_active = ?", true)
		} else if v == "false" {
			countQuery = countQuery.Where("is_active = ?", false)
		}
	}
	if role, ok := filters["role"].(string); ok && role != "" {
		countQuery = countQuery.Where("id IN (SELECT user_id FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE r.name = ?)", role)
	}
	if err := countQuery.Get(&countModel); err != nil {
		return nil, 0, err
	}
	total = int64(len(countModel))

	// Sorting
	sortBy := "created_at"
	sortDir := "desc"
	if v, ok := filters["sort_by"].(string); ok && v != "" {
		allowedSorts := map[string]bool{"name": true, "email": true, "created_at": true, "updated_at": true, "is_active": true}
		if allowedSorts[v] {
			sortBy = v
		}
	}
	if v, ok := filters["sort_dir"].(string); ok && v != "" {
		if v == "asc" {
			sortDir = "asc"
		}
	}
	query = query.Order(fmt.Sprintf("%s %s", sortBy, sortDir))

	// Pagination
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
	offset := (page - 1) * perPage
	query = query.Offset(offset).Limit(perPage)

	// Load with basic relations
	query = query.With("Company").With("Office").With("Roles")

	var users []models.User
	if err := query.Get(&users); err != nil {
		return nil, 0, err
	}

	_ = math.Ceil(float64(total) / float64(perPage))
	return users, total, nil
}

func (r *userRepository) CreateUser(user *models.User) error {
	return facades.Orm().Query().Create(user)
}

func (r *userRepository) UpdateUser(user *models.User) error {
	return facades.Orm().Query().Save(user)
}

func (r *userRepository) DeleteUser(id string) error {
	_, err := facades.Orm().Query().Where("id = ?", id).Delete(&models.User{})
	return err
}

func (r *userRepository) AssignRoles(userID string, roleIDs []string) error {
	// Delete existing roles
	if _, err := facades.Orm().Query().Where("user_id = ?", userID).Delete(&models.UserRole{}); err != nil {
		return err
	}

	// Insert new roles
	for _, roleID := range roleIDs {
		ur := models.UserRole{
			UserID: userID,
			RoleID: roleID,
		}
		if err := facades.Orm().Query().Create(&ur); err != nil {
			return err
		}
	}

	return nil
}
