package models

import "time"

type Company struct {
	ID        string     `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	Name      string     `gorm:"size:255;not null" json:"name"`
	Code      string     `gorm:"size:50;not null;uniqueIndex" json:"code"`
	LogoPath  *string    `gorm:"size:500" json:"logo_path"`
	Address   *string    `json:"address"`
	Phone     *string    `gorm:"size:50" json:"phone"`
	Email     *string    `gorm:"size:255" json:"email"`
	Website   *string    `gorm:"size:255" json:"website"`
	NPWP      *string    `gorm:"size:50" json:"npwp"`
	IsActive  bool       `gorm:"default:true" json:"is_active"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
	DeletedAt *time.Time `gorm:"index" json:"-"`
}

func (Company) TableName() string { return "companies" }
