package models

import "time"

type Permission struct {
	ID          string    `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	Name        string    `gorm:"size:100;not null;uniqueIndex" json:"name"`
	Module      string    `gorm:"size:100;not null" json:"module"`
	Description *string   `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
}

func (Permission) TableName() string { return "permissions" }
