package migrations

import (
	"dms/app/facades"

	"golang.org/x/crypto/bcrypt"
)

type M20250414000015SeedAdminUser struct{}

func (r *M20250414000015SeedAdminUser) Signature() string {
	return "20250414000015_seed_admin_user"
}

func (r *M20250414000015SeedAdminUser) Up() error {
	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	// Create admin user
	if _, err := facades.Orm().Query().Exec(`
		INSERT INTO users (name, email, password, is_active, created_at, updated_at) 
		VALUES ('Super Admin', 'admin@askara.com', ?, TRUE, NOW(), NOW())
		ON CONFLICT (email) DO UPDATE SET name = 'Super Admin', is_active = TRUE
	`, string(hashedPassword)); err != nil {
		return err
	}

	// Assign super_admin role to admin user
	if _, err := facades.Orm().Query().Exec(`
		INSERT INTO user_roles (user_id, role_id)
		SELECT u.id, r.id FROM users u, roles r 
		WHERE u.email = 'admin@askara.com' AND r.name = 'super_admin'
		ON CONFLICT DO NOTHING
	`); err != nil {
		return err
	}

	// Assign ALL permissions to super_admin role
	if _, err := facades.Orm().Query().Exec(`
		INSERT INTO role_permissions (role_id, permission_id)
		SELECT r.id, p.id FROM roles r, permissions p 
		WHERE r.name = 'super_admin'
		ON CONFLICT DO NOTHING
	`); err != nil {
		return err
	}

	return nil
}

func (r *M20250414000015SeedAdminUser) Down() error {
	// Remove role_permissions for super_admin
	if _, err := facades.Orm().Query().Exec(`
		DELETE FROM role_permissions WHERE role_id IN (SELECT id FROM roles WHERE name = 'super_admin')
	`); err != nil {
		return err
	}

	// Remove user_roles for admin
	if _, err := facades.Orm().Query().Exec(`
		DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE email = 'admin@askara.com')
	`); err != nil {
		return err
	}

	// Remove admin user
	if _, err := facades.Orm().Query().Exec(`
		DELETE FROM users WHERE email = 'admin@askara.com'
	`); err != nil {
		return err
	}

	return nil
}
