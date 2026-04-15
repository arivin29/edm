package models

import "time"

type SystemSetting struct {
	ID          string  `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	CompanyID   *string `gorm:"type:uuid" json:"company_id"`
	OfficeID    *string `gorm:"type:uuid" json:"office_id"`
	Key         string  `gorm:"size:255;not null" json:"key"`
	Value       string  `json:"value"`
	Type        string  `gorm:"size:50;default:'string'" json:"type"`
	Description *string `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (SystemSetting) TableName() string { return "system_settings" }
