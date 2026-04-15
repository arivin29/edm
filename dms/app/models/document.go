package models

import "time"

type Document struct {
	ID             string  `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	CompanyID      string  `gorm:"type:uuid;not null" json:"company_id"`
	OfficeID       string  `gorm:"type:uuid;not null" json:"office_id"`
	DepartmentID   string  `gorm:"type:uuid;not null" json:"department_id"`
	SectionID      *string `gorm:"type:uuid" json:"section_id"`
	DocumentTypeID string  `gorm:"type:uuid;not null" json:"document_type_id"`
	CategoryID     string  `gorm:"type:uuid;not null" json:"category_id"`
	TemplateID     *string `gorm:"type:uuid" json:"template_id"`

	DocumentNumber string  `gorm:"size:100;not null" json:"document_number"`
	FolderName     string  `gorm:"size:100;not null" json:"folder_name"`
	Title          string  `gorm:"size:500;not null" json:"title"`
	Description    *string `json:"description"`

	FromModule       *string `gorm:"size:100" json:"from_module"`
	FromModuleID     *string `gorm:"type:uuid" json:"from_module_id"`
	FromModuleNumber *string `gorm:"size:100" json:"from_module_number"`

	Status string `gorm:"size:50;not null;default:'draft'" json:"status"`
	// draft, in_review, revision, approved, final, obsolete, archived

	RevisionFromStepID *string `gorm:"type:uuid" json:"revision_from_step_id"`
	RevisionNotes      *string `json:"revision_notes"`
	RevisionCount      int     `gorm:"default:0" json:"revision_count"`

	CurrentVersion int `gorm:"default:1" json:"current_version"`
	MajorVersion   int `gorm:"default:1" json:"major_version"`
	MinorVersion   int `gorm:"default:0" json:"minor_version"`

	Priority        string `gorm:"size:20;default:'normal'" json:"priority"`
	Confidentiality string `gorm:"size:50;default:'internal'" json:"confidentiality"`
	AccessLevel     string `gorm:"size:50;default:'raw'" json:"access_level"`

	Metadata *string `gorm:"type:jsonb" json:"metadata"`

	DraftFilePath *string `gorm:"size:500" json:"draft_file_path"`
	FinalFilePath *string `gorm:"size:500" json:"final_file_path"`
	FinalDocxPath *string `gorm:"size:500" json:"final_docx_path"`

	OnlyofficeKey    *string    `gorm:"size:255" json:"onlyoffice_key"`
	OnlyofficeLockBy *string    `gorm:"type:uuid" json:"onlyoffice_lock_by"`
	OnlyofficeLockAt *time.Time `json:"onlyoffice_lock_at"`

	SubmittedAt   *time.Time `json:"submitted_at"`
	ApprovedAt    *time.Time `json:"approved_at"`
	FinalizedAt   *time.Time `json:"finalized_at"`
	EffectiveDate *time.Time `gorm:"type:date" json:"effective_date"`
	ReviewDate    *time.Time `gorm:"type:date" json:"review_date"`
	ExpiryDate    *time.Time `gorm:"type:date" json:"expiry_date"`
	ObsoletedAt   *time.Time `json:"obsoleted_at"`
	ArchivedAt    *time.Time `json:"archived_at"`

	ParentDocumentID     *string `gorm:"type:uuid" json:"parent_document_id"`
	SupersedesDocumentID *string `gorm:"type:uuid" json:"supersedes_document_id"`

	PageCount *int `json:"page_count"`
	WordCount *int `json:"word_count"`

	CreatedBy   string  `gorm:"type:uuid;not null" json:"created_by"`
	UpdatedBy   *string `gorm:"type:uuid" json:"updated_by"`
	SubmittedBy *string `gorm:"type:uuid" json:"submitted_by"`
	FinalizedBy *string `gorm:"type:uuid" json:"finalized_by"`
	ObsoletedBy *string `gorm:"type:uuid" json:"obsoleted_by"`

	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
	DeletedAt *time.Time `gorm:"index" json:"deleted_at,omitempty"`

	// Relations
	Company        *Company          `json:"company,omitempty"`
	Office         *Office           `json:"office,omitempty"`
	Department     *Department       `json:"department,omitempty"`
	Section        *Section          `json:"section,omitempty"`
	DocumentType   *DocumentType     `json:"document_type,omitempty"`
	Category       *DocumentCategory `json:"category,omitempty"`
	Template       *DocumentTemplate `json:"template,omitempty"`
	Creator        *User             `gorm:"foreignKey:CreatedBy" json:"creator,omitempty"`
	Versions       []DocumentVersion `gorm:"foreignKey:DocumentID" json:"versions,omitempty"`
	ParentDocument *Document         `gorm:"foreignKey:ParentDocumentID" json:"parent_document,omitempty"`
}

func (Document) TableName() string { return "documents" }

type DocumentVersion struct {
	ID               string  `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	DocumentID       string  `gorm:"type:uuid;not null" json:"document_id"`
	VersionNumber    int     `gorm:"not null" json:"version_number"`
	MajorVersion     int     `gorm:"not null" json:"major_version"`
	MinorVersion     int     `gorm:"not null" json:"minor_version"`
	FilePath         string  `gorm:"size:500;not null" json:"file_path"`
	FileName         string  `gorm:"size:255;not null" json:"file_name"`
	FileSize         *int64  `json:"file_size"`
	FileHash         *string `gorm:"size:64" json:"file_hash"`
	ChangeSummary    *string `json:"change_summary"`
	ChangeType       *string `gorm:"size:50" json:"change_type"`
	MetadataSnapshot *string `gorm:"type:jsonb" json:"metadata_snapshot"`
	Source           string  `gorm:"size:50;default:'editor'" json:"source"`
	CreatedBy        string  `gorm:"type:uuid;not null" json:"created_by"`
	CreatedAt        time.Time `json:"created_at"`

	// Relations
	Document *Document `json:"document,omitempty"`
	Creator  *User     `gorm:"foreignKey:CreatedBy" json:"creator,omitempty"`
}

func (DocumentVersion) TableName() string { return "document_versions" }
