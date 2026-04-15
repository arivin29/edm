package migrations

import (
	"dms/app/facades"
)

type M20250414000012CreateFileStorageTable struct{}

func (r *M20250414000012CreateFileStorageTable) Signature() string {
	return "20250414000012_create_file_storage_table"
}

func (r *M20250414000012CreateFileStorageTable) Up() error {
	if _, err := facades.Orm().Query().Exec(`CREATE TABLE file_storage (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		company_id UUID NOT NULL REFERENCES companies(id),
		file_name VARCHAR(500) NOT NULL,
		original_name VARCHAR(500) NOT NULL,
		file_path VARCHAR(500) NOT NULL,
		file_size BIGINT NOT NULL,
		mime_type VARCHAR(100) NOT NULL,
		file_hash VARCHAR(64),
		module VARCHAR(50) NOT NULL,
		category_code VARCHAR(50),
		storage_year INT,
		storage_month INT,
		entity_type VARCHAR(100),
		entity_id UUID,
		storage_type VARCHAR(50) DEFAULT 'local',
		storage_bucket VARCHAR(100),
		uploaded_by UUID NOT NULL REFERENCES users(id),
		created_at TIMESTAMP DEFAULT NOW(),
		deleted_at TIMESTAMP
	)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX idx_file_entity ON file_storage(entity_type, entity_id)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX idx_file_hash ON file_storage(file_hash)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX idx_file_module ON file_storage(module, category_code, storage_year, storage_month)`); err != nil {
		return err
	}
	return nil
}

func (r *M20250414000012CreateFileStorageTable) Down() error {
	if _, err := facades.Orm().Query().Exec(`DROP TABLE IF EXISTS file_storage CASCADE`); err != nil {
		return err
	}
	return nil
}
