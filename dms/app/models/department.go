package models

import "time"

type Department struct {
	ID         string     `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	OfficeID   string     `gorm:"type:uuid;not null" json:"office_id"`
	Name       string     `gorm:"size:255;not null" json:"name"`
	Code       string     `gorm:"size:50;not null" json:"code"`
	ParentID   *string    `gorm:"type:uuid" json:"parent_id"`
	HeadUserID *string    `gorm:"type:uuid" json:"head_user_id"`
	SortOrder  int        `gorm:"default:0" json:"sort_order"`
	IsActive   bool       `gorm:"default:true" json:"is_active"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`
	DeletedAt  *time.Time `gorm:"index" json:"-"`
}

func (Department) TableName() string { return "departments" }
