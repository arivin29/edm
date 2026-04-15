package migrations

import (
	"dms/app/facades"
)

type M20250414000013CreateSystemSettingsTable struct{}

func (r *M20250414000013CreateSystemSettingsTable) Signature() string {
	return "20250414000013_create_system_settings_table"
}

func (r *M20250414000013CreateSystemSettingsTable) Up() error {
	if _, err := facades.Orm().Query().Exec(`CREATE TABLE system_settings (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		company_id UUID REFERENCES companies(id),
		office_id UUID REFERENCES offices(id),
		key VARCHAR(255) NOT NULL,
		value TEXT,
		type VARCHAR(50) DEFAULT 'string',
		description TEXT,
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW(),
		UNIQUE(company_id, office_id, key)
	)`); err != nil {
		return err
	}
	return nil
}

func (r *M20250414000013CreateSystemSettingsTable) Down() error {
	if _, err := facades.Orm().Query().Exec(`DROP TABLE IF EXISTS system_settings CASCADE`); err != nil {
		return err
	}
	return nil
}
