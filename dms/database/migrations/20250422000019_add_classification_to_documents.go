package migrations

import (
	"dms/app/facades"
)

type M20250422000019AddClassificationToDocuments struct{}

func (m *M20250422000019AddClassificationToDocuments) Signature() string {
	return "20250422000019_add_classification_to_documents"
}

func (m *M20250422000019AddClassificationToDocuments) Up() error {
	_, err := facades.Orm().Query().Exec(
		`ALTER TABLE documents ADD COLUMN IF NOT EXISTS classification VARCHAR(50) DEFAULT 'internal'`)
	return err
}

func (m *M20250422000019AddClassificationToDocuments) Down() error {
	_, err := facades.Orm().Query().Exec(
		`ALTER TABLE documents DROP COLUMN IF EXISTS classification`)
	return err
}
