package migrations

import (
	"dms/app/facades"
)

type M20250414000004CreateDocumentTypesCategories struct{}

func (r *M20250414000004CreateDocumentTypesCategories) Signature() string {
	return "20250414000004_create_document_types_categories"
}

func (r *M20250414000004CreateDocumentTypesCategories) Up() error {
	if _, err := facades.Orm().Query().Exec(`CREATE TABLE document_categories (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		company_id UUID NOT NULL REFERENCES companies(id),
		name VARCHAR(255) NOT NULL,
		code VARCHAR(50) NOT NULL,
		description TEXT,
		color VARCHAR(7),
		icon VARCHAR(100),
		parent_id UUID REFERENCES document_categories(id),
		sort_order INT DEFAULT 0,
		is_active BOOLEAN DEFAULT TRUE,
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW(),
		deleted_at TIMESTAMP,
		UNIQUE(company_id, code)
	)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE TABLE document_types (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		name VARCHAR(255) NOT NULL,
		code VARCHAR(50) NOT NULL UNIQUE,
		description TEXT,
		icon VARCHAR(100),
		sort_order INT DEFAULT 0,
		is_active BOOLEAN DEFAULT TRUE,
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW()
	)`); err != nil {
		return err
	}
	return nil
}

func (r *M20250414000004CreateDocumentTypesCategories) Down() error {
	if _, err := facades.Orm().Query().Exec(`DROP TABLE IF EXISTS document_types CASCADE`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`DROP TABLE IF EXISTS document_categories CASCADE`); err != nil {
		return err
	}
	return nil
}
