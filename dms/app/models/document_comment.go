package models

import "time"

type DocumentComment struct {
	ID            string     `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	DocumentID    string     `gorm:"type:uuid;not null" json:"document_id"`
	VersionNumber *int       `json:"version_number"`
	ParentID      *string    `gorm:"type:uuid" json:"parent_id"`
	UserID        string     `gorm:"type:uuid;not null" json:"user_id"`
	CommentType   string     `gorm:"size:50;not null;default:'general'" json:"comment_type"` // general, review, annotation
	PageNumber    *int       `json:"page_number"`
	PositionX     *float64   `json:"position_x"`
	PositionY     *float64   `json:"position_y"`
	SelectedText  *string    `json:"selected_text"`
	Content       string     `gorm:"type:text;not null" json:"content"`
	IsResolved    bool       `gorm:"default:false" json:"is_resolved"`
	ResolvedBy    *string    `gorm:"type:uuid" json:"resolved_by"`
	ResolvedAt    *time.Time `json:"resolved_at"`
	IsInternal    bool       `gorm:"default:false" json:"is_internal"` // internal = only visible to reviewers
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
	DeletedAt     *time.Time `gorm:"index" json:"deleted_at,omitempty"`

	// Relations
	Document *Document         `json:"document,omitempty"`
	User     *User             `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Resolver *User             `gorm:"foreignKey:ResolvedBy" json:"resolver,omitempty"`
	Parent   *DocumentComment  `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
	Replies  []DocumentComment `gorm:"foreignKey:ParentID" json:"replies,omitempty"`
}

func (DocumentComment) TableName() string { return "document_comments" }
