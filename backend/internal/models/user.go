package models

import (
	"time"

	"gorm.io/gorm"
)

// User represents a user in the system
type User struct {
	ID       uint   `gorm:"primaryKey" json:"id"`
	Email    string `gorm:"unique;not null" json:"email"`
	Name     string `json:"name"`
	Picture  string `json:"picture"`
	GoogleID string `gorm:"unique" json:"google_id,omitempty"`
	// Email/password authentication fields
	Password                string     `json:"-"` // Never include in JSON responses
	EmailVerified           bool       `gorm:"default:false" json:"email_verified"`
	EmailVerificationToken  string     `json:"-"`
	EmailVerificationExpiry *time.Time `json:"-"`
	PasswordResetToken      string     `json:"-"`
	PasswordResetExpiry     *time.Time `json:"-"`
	// OAuth fields (nullable for email/password users)
	Provider      *string        `json:"provider,omitempty"` // google, github, etc.
	ProviderID    *string        `json:"provider_id,omitempty"`
	RefreshTokens []RefreshToken `gorm:"foreignKey:UserID" json:"-"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`
}

// RefreshToken represents a refresh token for JWT authentication
type RefreshToken struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	UserID    uint           `gorm:"not null" json:"user_id"`
	Token     string         `gorm:"unique;not null" json:"token"`
	ExpiresAt time.Time      `gorm:"not null" json:"expires_at"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// UserSession represents an active user session
type UserSession struct {
	ID        string    `json:"id" gorm:"primaryKey;type:varchar(255)"`
	UserID    string    `json:"user_id" gorm:"not null;index"`
	UserAgent string    `json:"user_agent"`
	IPAddress string    `json:"ip_address"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	ExpiresAt time.Time `json:"expires_at"`
	IsActive  bool      `json:"is_active" gorm:"default:true"`

	// Relationships
	User User `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// TableName returns the table name for User
func (User) TableName() string {
	return "users"
}

// TableName returns the table name for RefreshToken
func (RefreshToken) TableName() string {
	return "refresh_tokens"
}

// TableName returns the table name for UserSession
func (UserSession) TableName() string {
	return "user_sessions"
}

// BeforeCreate hook is no longer needed since we're using auto-incrementing uint ID
