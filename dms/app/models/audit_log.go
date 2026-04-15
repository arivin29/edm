package models

import "time"

type AuditLog struct {
	ID           string    `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	CompanyID    *string   `gorm:"type:uuid" json:"company_id"`
	OfficeID     *string   `gorm:"type:uuid" json:"office_id"`
	UserID       *string   `gorm:"type:uuid" json:"user_id"`
	UserName     *string   `gorm:"size:255" json:"user_name"`
	UserEmail    *string   `gorm:"size:255" json:"user_email"`
	UserPosition *string   `gorm:"size:255" json:"user_position"`
	Action       string    `gorm:"size:100;not null" json:"action"`
	EntityType   string    `gorm:"size:100;not null" json:"entity_type"`
	EntityID     *string   `gorm:"type:uuid" json:"entity_id"`
	EntityName   *string   `gorm:"size:500" json:"entity_name"`
	Description  *string   `json:"description"`
	OldValues    *string   `gorm:"type:jsonb" json:"old_values"`
	NewValues    *string   `gorm:"type:jsonb" json:"new_values"`
	Metadata     *string   `gorm:"type:jsonb" json:"metadata"`
	IPAddress    *string   `gorm:"size:45" json:"ip_address"`
	UserAgent    *string   `json:"user_agent"`
	CreatedAt    time.Time `json:"created_at"`
}

func (AuditLog) TableName() string { return "audit_logs" }
