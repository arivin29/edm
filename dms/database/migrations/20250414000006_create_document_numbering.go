package migrations

import (
	"dms/app/facades"
)

type M20250414000006CreateDocumentNumbering struct{}

func (r *M20250414000006CreateDocumentNumbering) Signature() string {
	return "20250414000006_create_document_numbering"
}

func (r *M20250414000006CreateDocumentNumbering) Up() error {
	if _, err := facades.Orm().Query().Exec(`CREATE TABLE document_numbering (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		company_id UUID NOT NULL REFERENCES companies(id),
		office_id UUID REFERENCES offices(id),
		document_type_id UUID NOT NULL REFERENCES document_types(id),
		category_id UUID REFERENCES document_categories(id),
		department_id UUID REFERENCES departments(id),
		prefix VARCHAR(50),
		separator VARCHAR(10) DEFAULT '/',
		format VARCHAR(255) NOT NULL,
		current_sequence INT DEFAULT 0,
		reset_period VARCHAR(20),
		last_reset_at TIMESTAMP,
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW(),
		UNIQUE(company_id, office_id, document_type_id, category_id, department_id)
	)`); err != nil {
		return err
	}
	return nil
}

func (r *M20250414000006CreateDocumentNumbering) Down() error {
	if _, err := facades.Orm().Query().Exec(`DROP TABLE IF EXISTS document_numbering CASCADE`); err != nil {
		return err
	}
	return nil
}
