package models

import "time"

type DocumentDistribution struct {
	ID               string     `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	DocumentID       string     `gorm:"type:uuid;not null" json:"document_id"`
	VersionNumber    int        `gorm:"not null" json:"version_number"`
	CopyNumber       *string    `gorm:"size:50" json:"copy_number"`
	DistributionType string     `gorm:"size:50;not null" json:"distribution_type"`
	RecipientType    string     `gorm:"size:50;not null" json:"recipient_type"`
	RecipientID      *string    `gorm:"type:uuid" json:"recipient_id"`
	RecipientName    *string    `gorm:"size:255" json:"recipient_name"`
	RecipientEmail   *string    `gorm:"size:255" json:"recipient_email"`
	Status           string     `gorm:"size:50;not null;default:'pending'" json:"status"`
	DistributedBy    string     `gorm:"type:uuid;not null" json:"distributed_by"`
	DistributedAt    *time.Time `json:"distributed_at"`
	ReceivedAt       *time.Time `json:"received_at"`
	ReceivedBy       *string    `gorm:"type:uuid" json:"received_by"`
	Notes            *string    `json:"notes"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`

	// Relations
	Document         *Document                     `json:"document,omitempty"`
	Distributor      *User                         `gorm:"foreignKey:DistributedBy" json:"distributor,omitempty"`
	Receiver         *User                         `gorm:"foreignKey:ReceivedBy" json:"receiver,omitempty"`
	Recipient        *User                         `gorm:"foreignKey:RecipientID" json:"recipient,omitempty"`
	Acknowledgements []DistributionAcknowledgement `gorm:"foreignKey:DistributionID" json:"acknowledgements,omitempty"`
}

func (DocumentDistribution) TableName() string { return "document_distributions" }

type DistributionAcknowledgement struct {
	ID             string    `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	DistributionID string    `gorm:"type:uuid;not null" json:"distribution_id"`
	UserID         string    `gorm:"type:uuid;not null" json:"user_id"`
	AcknowledgedAt time.Time `json:"acknowledged_at"`
	IPAddress      *string   `gorm:"size:50" json:"ip_address"`
	UserAgent      *string   `json:"user_agent"`
	Notes          *string   `json:"notes"`

	// Relations
	User         *User                 `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Distribution *DocumentDistribution `gorm:"foreignKey:DistributionID" json:"distribution,omitempty"`
}

func (DistributionAcknowledgement) TableName() string { return "distribution_acknowledgements" }
