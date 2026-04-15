package migrations

import (
	"dms/app/facades"
)

type M20250414000002CreateOrganizationTables struct{}

func (r *M20250414000002CreateOrganizationTables) Signature() string {
	return "20250414000002_create_organization_tables"
}

func (r *M20250414000002CreateOrganizationTables) Up() error {
	if _, err := facades.Orm().Query().Exec(`CREATE TABLE companies (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		name VARCHAR(255) NOT NULL,
		code VARCHAR(50) NOT NULL UNIQUE,
		logo_path VARCHAR(500),
		address TEXT,
		phone VARCHAR(50),
		email VARCHAR(255),
		website VARCHAR(255),
		npwp VARCHAR(50),
		is_active BOOLEAN DEFAULT TRUE,
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW(),
		deleted_at TIMESTAMP
	)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE TABLE offices (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		company_id UUID NOT NULL REFERENCES companies(id),
		name VARCHAR(255) NOT NULL,
		code VARCHAR(50) NOT NULL,
		type VARCHAR(50) NOT NULL DEFAULT 'branch',
		address TEXT,
		city VARCHAR(100),
		province VARCHAR(100),
		postal_code VARCHAR(20),
		phone VARCHAR(50),
		email VARCHAR(255),
		is_default BOOLEAN DEFAULT FALSE,
		is_active BOOLEAN DEFAULT TRUE,
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW(),
		deleted_at TIMESTAMP,
		UNIQUE(company_id, code)
	)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE TABLE departments (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		office_id UUID NOT NULL REFERENCES offices(id),
		name VARCHAR(255) NOT NULL,
		code VARCHAR(50) NOT NULL,
		parent_id UUID REFERENCES departments(id),
		head_user_id UUID,
		sort_order INT DEFAULT 0,
		is_active BOOLEAN DEFAULT TRUE,
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW(),
		deleted_at TIMESTAMP,
		UNIQUE(office_id, code)
	)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE TABLE sections (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		department_id UUID NOT NULL REFERENCES departments(id),
		name VARCHAR(255) NOT NULL,
		code VARCHAR(50) NOT NULL,
		head_user_id UUID,
		sort_order INT DEFAULT 0,
		is_active BOOLEAN DEFAULT TRUE,
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW(),
		deleted_at TIMESTAMP,
		UNIQUE(department_id, code)
	)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE TABLE positions (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		company_id UUID NOT NULL REFERENCES companies(id),
		name VARCHAR(255) NOT NULL,
		code VARCHAR(50) NOT NULL,
		level INT NOT NULL DEFAULT 0,
		description TEXT,
		is_active BOOLEAN DEFAULT TRUE,
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW(),
		deleted_at TIMESTAMP,
		UNIQUE(company_id, code)
	)`); err != nil {
		return err
	}
	return nil
}

func (r *M20250414000002CreateOrganizationTables) Down() error {
	if _, err := facades.Orm().Query().Exec(`DROP TABLE IF EXISTS positions CASCADE`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`DROP TABLE IF EXISTS sections CASCADE`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`DROP TABLE IF EXISTS departments CASCADE`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`DROP TABLE IF EXISTS offices CASCADE`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`DROP TABLE IF EXISTS companies CASCADE`); err != nil {
		return err
	}
	return nil
}
