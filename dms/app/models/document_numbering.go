package models

import "time"

type DocumentNumbering struct {
	ID              string     `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	CompanyID       string     `gorm:"type:uuid;not null" json:"company_id"`
	OfficeID        *string    `gorm:"type:uuid" json:"office_id"`
	DocumentTypeID  string     `gorm:"type:uuid;not null" json:"document_type_id"`
	CategoryID      *string    `gorm:"type:uuid" json:"category_id"`
	DepartmentID    *string    `gorm:"type:uuid" json:"department_id"`
	Prefix          *string    `gorm:"size:50" json:"prefix"`
	Separator       string     `gorm:"size:10;default:'/'" json:"separator"`
	Format          string     `gorm:"size:255;not null" json:"format"`
	CurrentSequence int        `gorm:"default:0" json:"current_sequence"`
	ResetPeriod     *string    `gorm:"size:20" json:"reset_period"`
	LastResetAt     *time.Time `json:"last_reset_at"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

func (DocumentNumbering) TableName() string { return "document_numbering" }
