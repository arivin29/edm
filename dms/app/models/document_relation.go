package models

import "time"

type DocumentRelation struct {
	ID                string    `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	DocumentID        string    `gorm:"type:uuid;not null" json:"document_id"`
	RelatedDocumentID string    `gorm:"type:uuid;not null" json:"related_document_id"`
	RelationType      string    `gorm:"size:50;not null" json:"relation_type"`
	Notes             *string   `gorm:"type:text" json:"notes"`
	CreatedBy         string    `gorm:"type:uuid;not null" json:"created_by"`
	CreatedAt         time.Time `gorm:"autoCreateTime" json:"created_at"`

	// Relations
	Document        *Document `gorm:"foreignKey:DocumentID" json:"document,omitempty"`
	RelatedDocument *Document `gorm:"foreignKey:RelatedDocumentID" json:"related_document,omitempty"`
	Creator         *User     `gorm:"foreignKey:CreatedBy" json:"creator,omitempty"`
}
