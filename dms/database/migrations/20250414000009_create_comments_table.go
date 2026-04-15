package migrations

import (
	"dms/app/facades"
)

type M20250414000009CreateCommentsTable struct{}

func (r *M20250414000009CreateCommentsTable) Signature() string {
	return "20250414000009_create_comments_table"
}

func (r *M20250414000009CreateCommentsTable) Up() error {
	if _, err := facades.Orm().Query().Exec(`CREATE TABLE document_comments (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		document_id UUID NOT NULL REFERENCES documents(id),
		document_version_id UUID REFERENCES document_versions(id),
		workflow_step_instance_id UUID REFERENCES workflow_step_instances(id),
		user_id UUID NOT NULL REFERENCES users(id),
		parent_comment_id UUID REFERENCES document_comments(id),
		content TEXT NOT NULL,
		comment_type VARCHAR(50) DEFAULT 'general',
		is_resolved BOOLEAN DEFAULT FALSE,
		resolved_by UUID REFERENCES users(id),
		resolved_at TIMESTAMP,
		is_internal BOOLEAN DEFAULT FALSE,
		annotation_id VARCHAR(255),
		page_number INT,
		position_data JSONB,
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW(),
		deleted_at TIMESTAMP
	)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX idx_doc_comments_document ON document_comments(document_id)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX idx_doc_comments_step ON document_comments(workflow_step_instance_id)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX idx_doc_comments_user ON document_comments(user_id)`); err != nil {
		return err
	}
	return nil
}

func (r *M20250414000009CreateCommentsTable) Down() error {
	if _, err := facades.Orm().Query().Exec(`DROP TABLE IF EXISTS document_comments CASCADE`); err != nil {
		return err
	}
	return nil
}
