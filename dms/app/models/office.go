package models

import "time"

type Office struct {
	ID         string     `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	CompanyID  string     `gorm:"type:uuid;not null" json:"company_id"`
	Name       string     `gorm:"size:255;not null" json:"name"`
	Code       string     `gorm:"size:50;not null" json:"code"`
	Type       string     `gorm:"size:50;not null;default:'branch'" json:"type"`
	Address    *string    `json:"address"`
	City       *string    `gorm:"size:100" json:"city"`
	Province   *string    `gorm:"size:100" json:"province"`
	PostalCode *string    `gorm:"size:20" json:"postal_code"`
	Phone      *string    `gorm:"size:50" json:"phone"`
	Email      *string    `gorm:"size:255" json:"email"`
	IsDefault  bool       `gorm:"default:false" json:"is_default"`
	IsActive   bool       `gorm:"default:true" json:"is_active"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`
	DeletedAt  *time.Time `gorm:"index" json:"-"`

	Company *Company `json:"company,omitempty"`
}

func (Office) TableName() string { return "offices" }
