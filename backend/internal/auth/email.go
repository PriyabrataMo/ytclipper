package auth

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"time"
)

// EmailService handles email operations
type EmailService struct {
	// In production, you'd add SMTP configuration here
	// smtpHost     string
	// smtpPort     int
	// smtpUsername string
	// smtpPassword string
}

// NewEmailService creates a new email service
func NewEmailService() *EmailService {
	return &EmailService{}
}

// GenerateToken generates a random token for email verification or password reset
func (e *EmailService) GenerateToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// SendVerificationEmail sends an email verification email
func (e *EmailService) SendVerificationEmail(email, token string) error {
	// In production, you'd implement actual email sending here
	// For now, we'll just log the verification link
	verificationLink := fmt.Sprintf("http://localhost:3000/verify-email?token=%s", token)

	log.Printf("Email verification link for %s: %s", email, verificationLink)

	// TODO: Replace with actual email sending logic
	// Example with a popular email service:
	// return e.sendEmail(email, "Verify Your Email", verificationEmailTemplate, map[string]string{
	//     "VerificationLink": verificationLink,
	// })

	return nil
}

// SendPasswordResetEmail sends a password reset email
func (e *EmailService) SendPasswordResetEmail(email, token string) error {
	// In production, you'd implement actual email sending here
	// For now, we'll just log the reset link
	resetLink := fmt.Sprintf("http://localhost:3000/reset-password?token=%s", token)

	log.Printf("Password reset link for %s: %s", email, resetLink)

	// TODO: Replace with actual email sending logic
	// Example with a popular email service:
	// return e.sendEmail(email, "Reset Your Password", passwordResetEmailTemplate, map[string]string{
	//     "ResetLink": resetLink,
	// })

	return nil
}

// IsTokenExpired checks if a token has expired
func (e *EmailService) IsTokenExpired(expiry *time.Time) bool {
	if expiry == nil {
		return true
	}
	return time.Now().After(*expiry)
}

// GetTokenExpiry returns the expiry time for a token (24 hours from now)
func (e *EmailService) GetTokenExpiry() time.Time {
	return time.Now().Add(24 * time.Hour)
}
