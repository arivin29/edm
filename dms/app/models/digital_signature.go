package models

import "time"

type DigitalSignature struct {
	ID                 string     `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	DocumentID         string     `gorm:"type:uuid;not null" json:"document_id"`
	VersionNumber      int        `gorm:"not null;default:1" json:"version_number"`
	SignerID           string     `gorm:"type:uuid;not null" json:"signer_id"`
	SignerName         string     `gorm:"size:255;not null" json:"signer_name"`
	SignerPosition     *string    `gorm:"size:255" json:"signer_position"`
	SignerDepartment   *string    `gorm:"size:255" json:"signer_department"`
	SignatureType      string     `gorm:"size:50;not null;default:'internal'" json:"signature_type"` // internal, tte_psre
	SignatureImagePath *string    `gorm:"size:500" json:"signature_image_path"`
	CertificateID      *string   `gorm:"size:255" json:"certificate_id"`
	Provider           string     `gorm:"size:50;default:'internal'" json:"provider"` // internal, privy, vida, peruri
	ProviderRef        *string    `gorm:"size:255" json:"provider_ref"`
	HashAlgorithm      string     `gorm:"size:50;default:'sha256'" json:"hash_algorithm"`
	DocumentHash       *string    `gorm:"size:128" json:"document_hash"`
	Status             string     `gorm:"size:50;not null;default:'signed'" json:"status"` // signed, verified, revoked
	SignedAt           time.Time  `gorm:"not null" json:"signed_at"`
	VerifiedAt         *time.Time `json:"verified_at"`
	RevokedAt          *time.Time `json:"revoked_at"`
	RevokeReason       *string    `json:"revoke_reason"`
	IPAddress          *string    `gorm:"size:45" json:"ip_address"`
	Metadata           *string    `gorm:"type:jsonb" json:"metadata"`
	CreatedAt          time.Time  `json:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at"`

	// Relations
	Document *Document `json:"document,omitempty"`
	Signer   *User     `gorm:"foreignKey:SignerID" json:"signer,omitempty"`
}

func (DigitalSignature) TableName() string { return "digital_signatures" }
