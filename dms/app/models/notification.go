package models

import "time"

type Notification struct {
	ID         string     `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	UserID     string     `gorm:"type:uuid;not null" json:"user_id"`
	Type       string     `gorm:"size:100;not null" json:"type"` // workflow_assigned, document_approved, comment_added, etc.
	Title      string     `gorm:"size:255;not null" json:"title"`
	Message    *string    `json:"message"`
	Data       *string    `gorm:"type:jsonb" json:"data"` // Store as JSON string
	DocumentID *string    `gorm:"type:uuid" json:"document_id"`
	IsRead     bool       `gorm:"default:false" json:"is_read"`
	ReadAt     *time.Time `json:"read_at"`
	CreatedAt  time.Time  `json:"created_at"`

	// Relations
	User     *User     `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Document *Document `gorm:"foreignKey:DocumentID" json:"document,omitempty"`
}

func (Notification) TableName() string { return "notifications" }
