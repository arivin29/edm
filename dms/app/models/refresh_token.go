package models

import "time"

type RefreshToken struct {
	ID         string     `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	UserID     string     `gorm:"type:uuid;not null" json:"user_id"`
	TokenHash  string     `gorm:"size:64;not null;uniqueIndex" json:"-"`
	DeviceName *string    `gorm:"size:255" json:"device_name"`
	IPAddress  *string    `gorm:"size:45" json:"ip_address"`
	UserAgent  *string    `json:"user_agent"`
	IsRevoked  bool       `gorm:"default:false" json:"is_revoked"`
	LastUsedAt *time.Time `json:"last_used_at"`
	ExpiresAt  time.Time  `gorm:"not null" json:"expires_at"`
	CreatedAt  time.Time  `json:"created_at"`
}

func (RefreshToken) TableName() string { return "refresh_tokens" }
