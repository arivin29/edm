package models

import "time"

type Role struct {
	ID          string    `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	CompanyID   *string   `gorm:"type:uuid" json:"company_id"`
	Name        string    `gorm:"size:100;not null" json:"name"`
	DisplayName string    `gorm:"size:255;not null" json:"display_name"`
	Description *string   `json:"description"`
	IsSystem    bool      `gorm:"default:false" json:"is_system"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	Permissions []Permission `gorm:"many2many:role_permissions;joinForeignKey:role_id;joinReferences:permission_id" json:"permissions,omitempty"`
}

func (Role) TableName() string { return "roles" }
