package migrations

import (
	"dms/app/facades"
)

type M20250414000010CreateAuditLogsTable struct{}

func (r *M20250414000010CreateAuditLogsTable) Signature() string {
	return "20250414000010_create_audit_logs_table"
}

func (r *M20250414000010CreateAuditLogsTable) Up() error {
	if _, err := facades.Orm().Query().Exec(`CREATE TABLE audit_logs (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		company_id UUID REFERENCES companies(id),
		office_id UUID REFERENCES offices(id),
		user_id UUID REFERENCES users(id),
		user_name VARCHAR(255),
		user_email VARCHAR(255),
		user_position VARCHAR(255),
		action VARCHAR(100) NOT NULL,
		entity_type VARCHAR(100) NOT NULL,
		entity_id UUID,
		entity_name VARCHAR(500),
		description TEXT,
		old_values JSONB,
		new_values JSONB,
		metadata JSONB,
		ip_address INET,
		user_agent TEXT,
		created_at TIMESTAMP DEFAULT NOW()
	)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX idx_audit_company ON audit_logs(company_id)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX idx_audit_office ON audit_logs(office_id)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX idx_audit_user ON audit_logs(user_id)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX idx_audit_action ON audit_logs(action)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX idx_audit_created ON audit_logs(created_at)`); err != nil {
		return err
	}
	return nil
}

func (r *M20250414000010CreateAuditLogsTable) Down() error {
	if _, err := facades.Orm().Query().Exec(`DROP TABLE IF EXISTS audit_logs CASCADE`); err != nil {
		return err
	}
	return nil
}
