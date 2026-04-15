package migrations

import (
	"dms/app/facades"
)

type M20250414000007CreateDocumentsTables struct{}

func (r *M20250414000007CreateDocumentsTables) Signature() string {
	return "20250414000007_create_documents_tables"
}

func (r *M20250414000007CreateDocumentsTables) Up() error {
	if _, err := facades.Orm().Query().Exec(`CREATE TABLE documents (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		company_id UUID NOT NULL REFERENCES companies(id),
		office_id UUID NOT NULL REFERENCES offices(id),
		department_id UUID NOT NULL REFERENCES departments(id),
		section_id UUID REFERENCES sections(id),
		document_type_id UUID NOT NULL REFERENCES document_types(id),
		category_id UUID NOT NULL REFERENCES document_categories(id),
		template_id UUID REFERENCES document_templates(id),
		document_number VARCHAR(100) NOT NULL,
		folder_name VARCHAR(100) NOT NULL,
		title VARCHAR(500) NOT NULL,
		description TEXT,
		from_module VARCHAR(100),
		from_module_id UUID,
		from_module_number VARCHAR(100),
		status VARCHAR(50) NOT NULL DEFAULT 'draft',
		revision_from_step_id UUID,
		revision_notes TEXT,
		revision_count INT DEFAULT 0,
		current_version INT DEFAULT 1,
		major_version INT DEFAULT 1,
		minor_version INT DEFAULT 0,
		priority VARCHAR(20) DEFAULT 'normal',
		confidentiality VARCHAR(50) DEFAULT 'internal',
		access_level VARCHAR(50) DEFAULT 'raw',
		metadata JSONB,
		draft_file_path VARCHAR(500),
		final_file_path VARCHAR(500),
		final_docx_path VARCHAR(500),
		onlyoffice_key VARCHAR(255),
		onlyoffice_lock_by UUID REFERENCES users(id),
		onlyoffice_lock_at TIMESTAMP,
		submitted_at TIMESTAMP,
		approved_at TIMESTAMP,
		finalized_at TIMESTAMP,
		effective_date DATE,
		review_date DATE,
		expiry_date DATE,
		obsoleted_at TIMESTAMP,
		archived_at TIMESTAMP,
		parent_document_id UUID REFERENCES documents(id),
		supersedes_document_id UUID REFERENCES documents(id),
		page_count INT,
		word_count INT,
		created_by UUID NOT NULL REFERENCES users(id),
		updated_by UUID REFERENCES users(id),
		submitted_by UUID REFERENCES users(id),
		finalized_by UUID REFERENCES users(id),
		obsoleted_by UUID REFERENCES users(id),
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW(),
		deleted_at TIMESTAMP,
		UNIQUE(company_id, document_number)
	)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX idx_documents_status ON documents(status)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX idx_documents_company ON documents(company_id)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX idx_documents_office ON documents(office_id)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX idx_documents_department ON documents(department_id)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX idx_documents_section ON documents(section_id)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX idx_documents_type ON documents(document_type_id)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX idx_documents_category ON documents(category_id)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX idx_documents_created_by ON documents(created_by)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX idx_documents_number ON documents(document_number)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX idx_documents_from_module ON documents(from_module, from_module_id)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX idx_documents_effective ON documents(effective_date)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX idx_documents_priority ON documents(priority)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE TABLE document_versions (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		document_id UUID NOT NULL REFERENCES documents(id),
		version_number INT NOT NULL,
		major_version INT NOT NULL,
		minor_version INT NOT NULL,
		file_path VARCHAR(500) NOT NULL,
		file_name VARCHAR(255) NOT NULL,
		file_size BIGINT,
		file_hash VARCHAR(64),
		change_summary TEXT,
		change_type VARCHAR(50),
		metadata_snapshot JSONB,
		source VARCHAR(50) DEFAULT 'editor',
		created_by UUID NOT NULL REFERENCES users(id),
		created_at TIMESTAMP DEFAULT NOW(),
		UNIQUE(document_id, version_number)
	)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX idx_doc_versions_document ON document_versions(document_id)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE TABLE document_tags (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		document_id UUID NOT NULL REFERENCES documents(id),
		tag_name VARCHAR(100) NOT NULL,
		created_at TIMESTAMP DEFAULT NOW(),
		UNIQUE(document_id, tag_name)
	)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE TABLE document_relations (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		document_id UUID NOT NULL REFERENCES documents(id),
		related_document_id UUID NOT NULL REFERENCES documents(id),
		relation_type VARCHAR(50) NOT NULL,
		notes TEXT,
		created_by UUID NOT NULL REFERENCES users(id),
		created_at TIMESTAMP DEFAULT NOW(),
		UNIQUE(document_id, related_document_id, relation_type)
	)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE TABLE document_distributions (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		document_id UUID NOT NULL REFERENCES documents(id),
		distribution_type VARCHAR(50) NOT NULL,
		target_id UUID,
		access_level VARCHAR(50) NOT NULL,
		distributed_by UUID NOT NULL REFERENCES users(id),
		distributed_at TIMESTAMP DEFAULT NOW(),
		acknowledged_at TIMESTAMP,
		created_at TIMESTAMP DEFAULT NOW()
	)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX idx_doc_dist_document ON document_distributions(document_id)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX idx_doc_dist_target ON document_distributions(distribution_type, target_id)`); err != nil {
		return err
	}
	return nil
}

func (r *M20250414000007CreateDocumentsTables) Down() error {
	if _, err := facades.Orm().Query().Exec(`DROP TABLE IF EXISTS document_distributions CASCADE`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`DROP TABLE IF EXISTS document_relations CASCADE`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`DROP TABLE IF EXISTS document_tags CASCADE`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`DROP TABLE IF EXISTS document_versions CASCADE`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`DROP TABLE IF EXISTS documents CASCADE`); err != nil {
		return err
	}
	return nil
}
