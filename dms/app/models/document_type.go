package models

import "time"

type DocumentType struct {
	ID          string  `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	Name        string  `gorm:"size:255;not null" json:"name"`
	Code        string  `gorm:"size:50;not null;uniqueIndex" json:"code"`
	Description *string `json:"description"`
	Icon        *string `gorm:"size:100" json:"icon"`
	SortOrder   int     `gorm:"default:0" json:"sort_order"`
	IsActive    bool    `gorm:"default:true" json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (DocumentType) TableName() string { return "document_types" }
