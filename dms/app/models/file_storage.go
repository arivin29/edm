package models

import "time"

type FileStorage struct {
	ID            string     `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	CompanyID     string     `gorm:"type:uuid;not null" json:"company_id"`
	FileName      string     `gorm:"size:500;not null" json:"file_name"`
	OriginalName  string     `gorm:"size:500;not null" json:"original_name"`
	FilePath      string     `gorm:"size:500;not null" json:"file_path"`
	FileSize      int64      `gorm:"not null" json:"file_size"`
	MimeType      string     `gorm:"size:100;not null" json:"mime_type"`
	FileHash      *string    `gorm:"size:64" json:"file_hash"`
	Module        string     `gorm:"size:50;not null" json:"module"`
	CategoryCode  *string    `gorm:"size:50" json:"category_code"`
	StorageYear   *int       `json:"storage_year"`
	StorageMonth  *int       `json:"storage_month"`
	EntityType    *string    `gorm:"size:100" json:"entity_type"`
	EntityID      *string    `gorm:"type:uuid" json:"entity_id"`
	StorageType   string     `gorm:"size:50;default:'local'" json:"storage_type"`
	StorageBucket *string    `gorm:"size:100" json:"storage_bucket"`
	UploadedBy    string     `gorm:"type:uuid;not null" json:"uploaded_by"`
	CreatedAt     time.Time  `json:"created_at"`
	DeletedAt     *time.Time `gorm:"index" json:"deleted_at,omitempty"`

	// Relations
	Uploader *User `gorm:"foreignKey:UploadedBy" json:"uploader,omitempty"`
}

func (FileStorage) TableName() string { return "file_storage" }
