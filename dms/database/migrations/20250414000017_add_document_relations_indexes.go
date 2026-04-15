package migrations

import (
	"dms/app/facades"
)

type M20250414000017AddDocumentRelationsIndexes struct{}

func (r *M20250414000017AddDocumentRelationsIndexes) Signature() string {
	return "20250414000017_add_document_relations_indexes"
}

func (r *M20250414000017AddDocumentRelationsIndexes) Up() error {
	// Prevent self-links
	if _, err := facades.Orm().Query().Exec(`
		ALTER TABLE document_relations
		ADD CONSTRAINT chk_no_self_relation CHECK (document_id <> related_document_id)
	`); err != nil {
		return err
	}

	// Indexes for efficient lookups
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX IF NOT EXISTS idx_document_relations_document_id ON document_relations(document_id)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX IF NOT EXISTS idx_document_relations_related_document_id ON document_relations(related_document_id)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX IF NOT EXISTS idx_document_relations_type ON document_relations(document_id, relation_type)`); err != nil {
		return err
	}

	return nil
}

func (r *M20250414000017AddDocumentRelationsIndexes) Down() error {
	facades.Orm().Query().Exec(`DROP INDEX IF EXISTS idx_document_relations_type`)
	facades.Orm().Query().Exec(`DROP INDEX IF EXISTS idx_document_relations_related_document_id`)
	facades.Orm().Query().Exec(`DROP INDEX IF EXISTS idx_document_relations_document_id`)
	facades.Orm().Query().Exec(`ALTER TABLE document_relations DROP CONSTRAINT IF EXISTS chk_no_self_relation`)
	return nil
}
