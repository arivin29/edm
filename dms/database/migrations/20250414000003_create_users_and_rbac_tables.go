package migrations

import (
	"dms/app/facades"
)

type M20250414000003CreateUsersAndRbacTables struct{}

func (r *M20250414000003CreateUsersAndRbacTables) Signature() string {
	return "20250414000003_create_users_and_rbac_tables"
}

func (r *M20250414000003CreateUsersAndRbacTables) Up() error {
	if _, err := facades.Orm().Query().Exec(`CREATE TABLE roles (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		company_id UUID REFERENCES companies(id),
		name VARCHAR(100) NOT NULL,
		display_name VARCHAR(255) NOT NULL,
		description TEXT,
		is_system BOOLEAN DEFAULT FALSE,
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW(),
		UNIQUE(company_id, name)
	)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE TABLE users (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		company_id UUID NOT NULL REFERENCES companies(id),
		office_id UUID NOT NULL REFERENCES offices(id),
		department_id UUID REFERENCES departments(id),
		section_id UUID REFERENCES sections(id),
		position_id UUID REFERENCES positions(id),
		employee_id VARCHAR(100),
		name VARCHAR(255) NOT NULL,
		email VARCHAR(255) NOT NULL UNIQUE,
		password VARCHAR(255) NOT NULL,
		phone VARCHAR(50),
		join_date DATE,
		signature_path VARCHAR(500),
		signature_uploaded_at TIMESTAMP,
		avatar_path VARCHAR(500),
		is_active BOOLEAN DEFAULT TRUE,
		email_verified_at TIMESTAMP,
		last_login_at TIMESTAMP,
		last_login_ip INET,
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW(),
		deleted_at TIMESTAMP
	)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX idx_users_company ON users(company_id)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX idx_users_office ON users(office_id)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX idx_users_department ON users(department_id)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX idx_users_section ON users(section_id)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX idx_users_position ON users(position_id)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`ALTER TABLE departments ADD CONSTRAINT fk_dept_head FOREIGN KEY (head_user_id) REFERENCES users(id)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`ALTER TABLE sections ADD CONSTRAINT fk_section_head FOREIGN KEY (head_user_id) REFERENCES users(id)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE TABLE user_roles (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		user_id UUID NOT NULL REFERENCES users(id),
		role_id UUID NOT NULL REFERENCES roles(id),
		assigned_by UUID REFERENCES users(id),
		created_at TIMESTAMP DEFAULT NOW(),
		UNIQUE(user_id, role_id)
	)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE TABLE permissions (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		name VARCHAR(100) NOT NULL UNIQUE,
		module VARCHAR(100) NOT NULL,
		description TEXT,
		created_at TIMESTAMP DEFAULT NOW()
	)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE TABLE role_permissions (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		role_id UUID NOT NULL REFERENCES roles(id),
		permission_id UUID NOT NULL REFERENCES permissions(id),
		created_at TIMESTAMP DEFAULT NOW(),
		UNIQUE(role_id, permission_id)
	)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE TABLE refresh_tokens (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		user_id UUID NOT NULL REFERENCES users(id),
		token_hash VARCHAR(64) NOT NULL UNIQUE,
		device_name VARCHAR(255),
		ip_address VARCHAR(45),
		user_agent TEXT,
		is_revoked BOOLEAN DEFAULT FALSE,
		last_used_at TIMESTAMP,
		expires_at TIMESTAMP NOT NULL,
		created_at TIMESTAMP DEFAULT NOW()
	)`); err != nil {
		return err
	}
	return nil
}

func (r *M20250414000003CreateUsersAndRbacTables) Down() error {
	if _, err := facades.Orm().Query().Exec(`DROP TABLE IF EXISTS refresh_tokens CASCADE`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`DROP TABLE IF EXISTS role_permissions CASCADE`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`DROP TABLE IF EXISTS permissions CASCADE`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`DROP TABLE IF EXISTS user_roles CASCADE`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`ALTER TABLE departments DROP CONSTRAINT IF EXISTS fk_dept_head`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`ALTER TABLE sections DROP CONSTRAINT IF EXISTS fk_section_head`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`DROP TABLE IF EXISTS users CASCADE`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`DROP TABLE IF EXISTS roles CASCADE`); err != nil {
		return err
	}
	return nil
}
