package migrations

import (
	"dms/app/facades"
)

type M20250414000011CreateNotificationsTables struct{}

func (r *M20250414000011CreateNotificationsTables) Signature() string {
	return "20250414000011_create_notifications_tables"
}

func (r *M20250414000011CreateNotificationsTables) Up() error {
	if _, err := facades.Orm().Query().Exec(`CREATE TABLE notifications (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		user_id UUID NOT NULL REFERENCES users(id),
		company_id UUID NOT NULL REFERENCES companies(id),
		title VARCHAR(500) NOT NULL,
		message TEXT NOT NULL,
		type VARCHAR(100) NOT NULL,
		entity_type VARCHAR(100),
		entity_id UUID,
		action_url VARCHAR(500),
		is_read BOOLEAN DEFAULT FALSE,
		read_at TIMESTAMP,
		email_sent BOOLEAN DEFAULT FALSE,
		email_sent_at TIMESTAMP,
		push_sent BOOLEAN DEFAULT FALSE,
		push_sent_at TIMESTAMP,
		created_at TIMESTAMP DEFAULT NOW()
	)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX idx_notif_user ON notifications(user_id)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX idx_notif_unread ON notifications(user_id, is_read) WHERE is_read = FALSE`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX idx_notif_created ON notifications(created_at)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE TABLE notification_preferences (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		user_id UUID NOT NULL REFERENCES users(id),
		notification_type VARCHAR(100) NOT NULL,
		channel_email BOOLEAN DEFAULT TRUE,
		channel_push BOOLEAN DEFAULT TRUE,
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW(),
		UNIQUE(user_id, notification_type)
	)`); err != nil {
		return err
	}
	return nil
}

func (r *M20250414000011CreateNotificationsTables) Down() error {
	if _, err := facades.Orm().Query().Exec(`DROP TABLE IF EXISTS notification_preferences CASCADE`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`DROP TABLE IF EXISTS notifications CASCADE`); err != nil {
		return err
	}
	return nil
}
