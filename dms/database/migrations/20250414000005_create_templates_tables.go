package migrations

import (
	"dms/app/facades"
)

type M20250414000005CreateTemplatesTables struct{}

func (r *M20250414000005CreateTemplatesTables) Signature() string {
	return "20250414000005_create_templates_tables"
}

func (r *M20250414000005CreateTemplatesTables) Up() error {
	if _, err := facades.Orm().Query().Exec(`CREATE TABLE document_templates (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		company_id UUID NOT NULL REFERENCES companies(id),
		document_type_id UUID NOT NULL REFERENCES document_types(id),
		category_id UUID REFERENCES document_categories(id),
		name VARCHAR(255) NOT NULL,
		code VARCHAR(50),
		description TEXT,
		file_path VARCHAR(500) NOT NULL,
		file_name VARCHAR(255) NOT NULL,
		file_size BIGINT,
		file_hash VARCHAR(64),
		version INT DEFAULT 1,
		version_notes TEXT,
		status VARCHAR(50) DEFAULT 'active',
		is_active BOOLEAN DEFAULT TRUE,
		created_by UUID NOT NULL REFERENCES users(id),
		updated_by UUID REFERENCES users(id),
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW(),
		deleted_at TIMESTAMP
	)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX idx_templates_company ON document_templates(company_id)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX idx_templates_type ON document_templates(document_type_id)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE TABLE template_tags (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		template_id UUID NOT NULL REFERENCES document_templates(id) ON DELETE CASCADE,
		tag_key VARCHAR(100) NOT NULL,
		tag_placeholder VARCHAR(150) NOT NULL,
		label VARCHAR(255) NOT NULL,
		description TEXT,
		data_type VARCHAR(50) NOT NULL DEFAULT 'text',
		source_type VARCHAR(50) DEFAULT 'static',
		source_config JSONB,
		format_pattern VARCHAR(255),
		default_value TEXT,
		placeholder_text VARCHAR(255),
		is_required BOOLEAN DEFAULT FALSE,
		is_readonly BOOLEAN DEFAULT FALSE,
		is_hidden BOOLEAN DEFAULT FALSE,
		min_length INT,
		max_length INT,
		min_value NUMERIC,
		max_value NUMERIC,
		validation_regex VARCHAR(500),
		validation_message VARCHAR(500),
		group_name VARCHAR(100),
		group_order INT DEFAULT 0,
		field_order INT DEFAULT 0,
		col_span INT DEFAULT 12,
		table_config JSONB,
		signature_config JSONB,
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW(),
		UNIQUE(template_id, tag_key)
	)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX idx_template_tags_template ON template_tags(template_id)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX idx_template_tags_source ON template_tags(source_type)`); err != nil {
		return err
	}
	return nil
}

func (r *M20250414000005CreateTemplatesTables) Down() error {
	if _, err := facades.Orm().Query().Exec(`DROP TABLE IF EXISTS template_tags CASCADE`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`DROP TABLE IF EXISTS document_templates CASCADE`); err != nil {
		return err
	}
	return nil
}
