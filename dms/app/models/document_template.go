package models

import "time"

type DocumentTemplate struct {
	ID             string     `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	CompanyID      string     `gorm:"type:uuid;not null" json:"company_id"`
	DocumentTypeID string     `gorm:"type:uuid;not null" json:"document_type_id"`
	CategoryID     *string    `gorm:"type:uuid" json:"category_id"`
	Name           string     `gorm:"size:255;not null" json:"name"`
	Code           *string    `gorm:"size:50" json:"code"`
	Description    *string    `json:"description"`
	FilePath       string     `gorm:"size:500;not null" json:"file_path"`
	FileName       string     `gorm:"size:255;not null" json:"file_name"`
	FileSize       *int64     `json:"file_size"`
	FileHash       *string    `gorm:"size:64" json:"file_hash"`
	Version        int        `gorm:"default:1" json:"version"`
	VersionNotes   *string    `json:"version_notes"`
	Status         string     `gorm:"size:50;default:'active'" json:"status"`
	IsActive       bool       `gorm:"default:true" json:"is_active"`
	CreatedBy      string     `gorm:"type:uuid;not null" json:"created_by"`
	UpdatedBy      *string    `gorm:"type:uuid" json:"updated_by"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
	DeletedAt      *time.Time `gorm:"index" json:"deleted_at,omitempty"`

	// Relations
	Company      *Company          `json:"company,omitempty"`
	DocumentType *DocumentType     `json:"document_type,omitempty"`
	Category     *DocumentCategory `json:"category,omitempty"`
	Tags         []TemplateTag     `gorm:"foreignKey:TemplateID" json:"tags,omitempty"`
}

func (DocumentTemplate) TableName() string { return "document_templates" }

type TemplateTag struct {
	ID                string  `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	TemplateID        string  `gorm:"type:uuid;not null" json:"template_id"`
	TagKey            string  `gorm:"size:100;not null" json:"tag_key"`
	TagPlaceholder    string  `gorm:"size:150;not null" json:"tag_placeholder"`
	Label             string  `gorm:"size:255;not null" json:"label"`
	Description       *string `json:"description"`
	DataType          string  `gorm:"size:50;not null;default:'text'" json:"data_type"`
	SourceType        string  `gorm:"size:50;default:'static'" json:"source_type"`
	SourceConfig      *string `gorm:"type:jsonb" json:"source_config"`
	FormatPattern     *string `gorm:"size:255" json:"format_pattern"`
	DefaultValue      *string `json:"default_value"`
	PlaceholderText   *string `gorm:"size:255" json:"placeholder_text"`
	IsRequired        bool    `gorm:"default:false" json:"is_required"`
	IsReadonly        bool    `gorm:"default:false" json:"is_readonly"`
	IsHidden          bool    `gorm:"default:false" json:"is_hidden"`
	MinLength         *int    `json:"min_length"`
	MaxLength         *int    `json:"max_length"`
	MinValue          *float64 `json:"min_value"`
	MaxValue          *float64 `json:"max_value"`
	ValidationRegex   *string `gorm:"size:500" json:"validation_regex"`
	ValidationMessage *string `gorm:"size:500" json:"validation_message"`
	GroupName         *string `gorm:"size:100" json:"group_name"`
	GroupOrder        int     `gorm:"default:0" json:"group_order"`
	FieldOrder        int     `gorm:"default:0" json:"field_order"`
	ColSpan           int     `gorm:"default:12" json:"col_span"`
	TableConfig       *string `gorm:"type:jsonb" json:"table_config"`
	SignatureConfig   *string `gorm:"type:jsonb" json:"signature_config"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

func (TemplateTag) TableName() string { return "template_tags" }
