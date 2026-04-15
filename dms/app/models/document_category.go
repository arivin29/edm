package models

import "time"

type DocumentCategory struct {
	ID        string  `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	CompanyID string  `gorm:"type:uuid;not null" json:"company_id"`
	Name      string  `gorm:"size:255;not null" json:"name"`
	Code      string  `gorm:"size:50;not null" json:"code"`
	Description *string `json:"description"`
	Color     *string `gorm:"size:7" json:"color"`
	Icon      *string `gorm:"size:100" json:"icon"`
	ParentID  *string `gorm:"type:uuid" json:"parent_id"`
	SortOrder int     `gorm:"default:0" json:"sort_order"`
	IsActive  bool    `gorm:"default:true" json:"is_active"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
	DeletedAt *time.Time `gorm:"index" json:"-"`
}

func (DocumentCategory) TableName() string { return "document_categories" }
