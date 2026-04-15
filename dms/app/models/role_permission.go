package models

import "time"

type RolePermission struct {
	ID           string    `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	RoleID       string    `gorm:"type:uuid;not null" json:"role_id"`
	PermissionID string    `gorm:"type:uuid;not null" json:"permission_id"`
	CreatedAt    time.Time `json:"created_at"`
}

func (RolePermission) TableName() string { return "role_permissions" }
