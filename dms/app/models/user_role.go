package models

import "time"

type UserRole struct {
	ID         string    `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	UserID     string    `gorm:"type:uuid;not null" json:"user_id"`
	RoleID     string    `gorm:"type:uuid;not null" json:"role_id"`
	AssignedBy *string   `gorm:"type:uuid" json:"assigned_by"`
	CreatedAt  time.Time `json:"created_at"`
}

func (UserRole) TableName() string { return "user_roles" }
