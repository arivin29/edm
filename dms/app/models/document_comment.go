package models

import "time"

type DocumentComment struct {
	ID                     string     `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	DocumentID             string     `gorm:"type:uuid;not null" json:"document_id"`
	DocumentVersionID      *string    `gorm:"type:uuid" json:"document_version_id"`
	WorkflowStepInstanceID *string    `gorm:"type:uuid" json:"workflow_step_instance_id"`
	UserID                 string     `gorm:"type:uuid;not null" json:"user_id"`
	ParentCommentID        *string    `gorm:"type:uuid;column:parent_comment_id" json:"parent_id"`
	Content                string     `gorm:"type:text;not null" json:"content"`
	CommentType            string     `gorm:"size:50;not null;default:'general'" json:"comment_type"`
	IsResolved             bool       `gorm:"default:false" json:"is_resolved"`
	ResolvedBy             *string    `gorm:"type:uuid" json:"resolved_by"`
	ResolvedAt             *time.Time `json:"resolved_at"`
	IsInternal             bool       `gorm:"default:false" json:"is_internal"`
	AnnotationID           *string    `gorm:"size:255" json:"annotation_id,omitempty"`
	PageNumber             *int       `json:"page_number"`
	PositionData           *string    `gorm:"type:jsonb" json:"position_data,omitempty"`
	CreatedAt              time.Time  `json:"created_at"`
	UpdatedAt              time.Time  `json:"updated_at"`
	DeletedAt              *time.Time `gorm:"index" json:"deleted_at,omitempty"`

	// Relations
	Document *Document         `json:"document,omitempty"`
	User     *User             `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Resolver *User             `gorm:"foreignKey:ResolvedBy" json:"resolver,omitempty"`
	Parent   *DocumentComment  `gorm:"foreignKey:ParentCommentID" json:"parent,omitempty"`
	Replies  []DocumentComment `gorm:"foreignKey:ParentCommentID" json:"replies,omitempty"`
}

func (DocumentComment) TableName() string { return "document_comments" }
