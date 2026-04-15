package models

import "time"

type Position struct {
	ID          string     `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	CompanyID   string     `gorm:"type:uuid;not null" json:"company_id"`
	Name        string     `gorm:"size:255;not null" json:"name"`
	Code        string     `gorm:"size:50;not null" json:"code"`
	Level       int        `gorm:"not null;default:0" json:"level"`
	Description *string    `json:"description"`
	IsActive    bool       `gorm:"default:true" json:"is_active"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	DeletedAt   *time.Time `gorm:"index" json:"-"`
}

func (Position) TableName() string { return "positions" }
