package migrations

import (
	"dms/app/facades"
)

type M20250414000016AddFulltextSearch struct{}

func (r *M20250414000016AddFulltextSearch) Signature() string {
	return "20250414000016_add_fulltext_search"
}

func (r *M20250414000016AddFulltextSearch) Up() error {
	// Add tsvector column
	if _, err := facades.Orm().Query().Exec(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS search_vector tsvector`); err != nil {
		return err
	}

	// Create partial GIN index (only non-deleted rows)
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX IF NOT EXISTS idx_documents_search_vector
		ON documents USING GIN(search_vector)
		WHERE deleted_at IS NULL`); err != nil {
		return err
	}

	// Create trigger function with weighted vectors: doc number=A, title=A, description=C
	if _, err := facades.Orm().Query().Exec(`
		CREATE OR REPLACE FUNCTION documents_search_vector_update() RETURNS trigger AS $$
		BEGIN
			NEW.search_vector :=
				setweight(to_tsvector('simple', coalesce(NEW.document_number, '')), 'A') ||
				setweight(to_tsvector('simple', coalesce(NEW.title, '')), 'A') ||
				setweight(to_tsvector('simple', coalesce(NEW.description, '')), 'C');
			RETURN NEW;
		END;
		$$ LANGUAGE plpgsql
	`); err != nil {
		return err
	}

	// Create trigger
	if _, err := facades.Orm().Query().Exec(`
		DROP TRIGGER IF EXISTS trg_documents_search_vector ON documents;
		CREATE TRIGGER trg_documents_search_vector
		BEFORE INSERT OR UPDATE OF document_number, title, description
		ON documents
		FOR EACH ROW
		EXECUTE FUNCTION documents_search_vector_update()
	`); err != nil {
		return err
	}

	// Backfill existing rows
	if _, err := facades.Orm().Query().Exec(`
		UPDATE documents SET search_vector =
			setweight(to_tsvector('simple', coalesce(document_number, '')), 'A') ||
			setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
			setweight(to_tsvector('simple', coalesce(description, '')), 'C')
	`); err != nil {
		return err
	}

	return nil
}

func (r *M20250414000016AddFulltextSearch) Down() error {
	if _, err := facades.Orm().Query().Exec(`DROP TRIGGER IF EXISTS trg_documents_search_vector ON documents`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`DROP FUNCTION IF EXISTS documents_search_vector_update()`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`DROP INDEX IF EXISTS idx_documents_search_vector`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`ALTER TABLE documents DROP COLUMN IF EXISTS search_vector`); err != nil {
		return err
	}
	return nil
}
