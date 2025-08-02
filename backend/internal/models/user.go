package models

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/uptrace/bun"
)

// User represents a user in the system
type User struct {
	bun.BaseModel `bun:"table:users,alias:u"`

	ID       uuid.UUID `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
	Email    string    `bun:"email,unique,notnull" json:"email"`
	Name     string    `bun:"name" json:"name"`
	Picture  string    `bun:"picture" json:"picture"`
	GoogleID string    `bun:"google_id,unique" json:"google_id,omitempty"`

	// Email/password authentication fields
	Password            string     `bun:"password" json:"-"` // Never include in JSON responses
	EmailVerified       bool       `bun:"email_verified,default:false" json:"email_verified"`
	PasswordResetToken  string     `bun:"password_reset_token" json:"-"`
	PasswordResetExpiry *time.Time `bun:"password_reset_expiry" json:"-"`

	// OTP fields for email verification
	Otp          string     `bun:"otp" json:"-"`
	OtpExpiresAt *time.Time `bun:"otp_expires_at" json:"-"`
	OtpCreatedAt *time.Time `bun:"otp_created_at" json:"-"`

	// OAuth fields (nullable for email/password users)
	Provider   *string `bun:"provider" json:"provider,omitempty"` // google, github, etc.
	ProviderID *string `bun:"provider_id" json:"provider_id,omitempty"`

	// Timestamps
	CreatedAt time.Time  `bun:"created_at,nullzero,notnull,default:current_timestamp" json:"created_at"`
	UpdatedAt time.Time  `bun:"updated_at,nullzero,notnull,default:current_timestamp" json:"updated_at"`
	DeletedAt *time.Time `bun:"deleted_at,soft_delete,nullzero" json:"-"`

	// Relationships
	RefreshTokens []RefreshToken `bun:"rel:has-many,join:id=user_id" json:"-"`
}

// RefreshToken represents a refresh token for JWT authentication
type RefreshToken struct {
	bun.BaseModel `bun:"table:refresh_tokens,alias:rt"`

	ID        uuid.UUID  `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
	UserID    uuid.UUID  `bun:"user_id,type:uuid,notnull" json:"user_id"`
	Token     string     `bun:"token,unique,notnull" json:"token"`
	ExpiresAt time.Time  `bun:"expires_at,notnull" json:"expires_at"`
	CreatedAt time.Time  `bun:"created_at,nullzero,notnull,default:current_timestamp" json:"created_at"`
	UpdatedAt time.Time  `bun:"updated_at,nullzero,notnull,default:current_timestamp" json:"updated_at"`
	DeletedAt *time.Time `bun:"deleted_at,soft_delete,nullzero" json:"-"`

	// Relationships
	User *User `bun:"rel:belongs-to,join:user_id=id" json:"user,omitempty"`
}

// UserSession represents an active user session
type UserSession struct {
	bun.BaseModel `bun:"table:user_sessions,alias:us"`

	ID        uuid.UUID `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
	UserID    uuid.UUID `bun:"user_id,type:uuid,notnull" json:"user_id"`
	UserAgent string    `bun:"user_agent" json:"user_agent"`
	IPAddress string    `bun:"ip_address" json:"ip_address"`
	ExpiresAt time.Time `bun:"expires_at,notnull" json:"expires_at"`
	IsActive  bool      `bun:"is_active,default:true" json:"is_active"`
	CreatedAt time.Time `bun:"created_at,nullzero,notnull,default:current_timestamp" json:"created_at"`
	UpdatedAt time.Time `bun:"updated_at,nullzero,notnull,default:current_timestamp" json:"updated_at"`

	// Relationships
	User *User `bun:"rel:belongs-to,join:user_id=id" json:"user,omitempty"`
}

// BeforeInsert hook for User
func (u *User) BeforeInsert(ctx context.Context) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	now := time.Now()
	u.CreatedAt = now
	u.UpdatedAt = now
	return nil
}

// BeforeUpdate hook for User
func (u *User) BeforeUpdate(ctx context.Context) error {
	u.UpdatedAt = time.Now()
	return nil
}

// BeforeInsert hook for RefreshToken
func (rt *RefreshToken) BeforeInsert(ctx context.Context) error {
	if rt.ID == uuid.Nil {
		rt.ID = uuid.New()
	}
	now := time.Now()
	rt.CreatedAt = now
	rt.UpdatedAt = now
	return nil
}

// BeforeUpdate hook for RefreshToken
func (rt *RefreshToken) BeforeUpdate(ctx context.Context) error {
	rt.UpdatedAt = time.Now()
	return nil
}

// BeforeInsert hook for UserSession
func (us *UserSession) BeforeInsert(ctx context.Context) error {
	if us.ID == uuid.Nil {
		us.ID = uuid.New()
	}
	now := time.Now()
	us.CreatedAt = now
	us.UpdatedAt = now
	return nil
}

// BeforeUpdate hook for UserSession
func (us *UserSession) BeforeUpdate(ctx context.Context) error {
	us.UpdatedAt = time.Now()
	return nil
}
