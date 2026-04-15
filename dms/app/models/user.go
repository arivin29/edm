package models

import "time"

type User struct {
	ID                  string     `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	CompanyID           string     `gorm:"type:uuid;not null" json:"company_id"`
	OfficeID            string     `gorm:"type:uuid;not null" json:"office_id"`
	DepartmentID        *string    `gorm:"type:uuid" json:"department_id"`
	SectionID           *string    `gorm:"type:uuid" json:"section_id"`
	PositionID          *string    `gorm:"type:uuid" json:"position_id"`
	EmployeeID          *string    `gorm:"size:100" json:"employee_id"`
	Name                string     `gorm:"size:255;not null" json:"name"`
	Email               string     `gorm:"size:255;not null;uniqueIndex" json:"email"`
	Password            string     `gorm:"size:255;not null" json:"-"`
	Phone               *string    `gorm:"size:50" json:"phone"`
	JoinDate            *time.Time `gorm:"type:date" json:"join_date"`
	SignaturePath       *string    `gorm:"size:500" json:"signature_path"`
	SignatureUploadedAt *time.Time `json:"signature_uploaded_at"`
	AvatarPath          *string    `gorm:"size:500" json:"avatar_path"`
	IsActive            bool       `gorm:"default:true" json:"is_active"`
	EmailVerifiedAt     *time.Time `json:"email_verified_at"`
	LastLoginAt         *time.Time `json:"last_login_at"`
	LastLoginIP         *string    `gorm:"size:45" json:"last_login_ip"`
	CreatedAt           time.Time  `json:"created_at"`
	UpdatedAt           time.Time  `json:"updated_at"`
	DeletedAt           *time.Time `gorm:"index" json:"-"`

	Company    *Company    `json:"company,omitempty"`
	Office     *Office     `json:"office,omitempty"`
	Department *Department `json:"department,omitempty"`
	Section    *Section    `json:"section,omitempty"`
	Position   *Position   `json:"position,omitempty"`
	Roles      []Role      `gorm:"many2many:user_roles;joinForeignKey:user_id;joinReferences:role_id" json:"roles,omitempty"`
}

func (User) TableName() string { return "users" }
