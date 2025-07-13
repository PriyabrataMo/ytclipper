package auth

import (
	"errors"

	"golang.org/x/crypto/bcrypt"
)

var (
	// ErrWeakPassword is returned when password doesn't meet strength requirements
	ErrWeakPassword = errors.New("password is too weak")
)

const (
	// MinPasswordLength defines the minimum password length
	MinPasswordLength = 8
	// BcryptCost defines the cost for bcrypt hashing
	BcryptCost = 12
)

// HashPassword hashes a plain text password using bcrypt
func HashPassword(password string) (string, error) {
	if len(password) < MinPasswordLength {
		return "", ErrWeakPassword
	}

	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(password), BcryptCost)
	if err != nil {
		return "", err
	}

	return string(hashedBytes), nil
}

// CheckPassword compares a plain text password with a hashed password
func CheckPassword(password, hashedPassword string) error {
	return bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
}

// ValidatePassword validates password strength
func ValidatePassword(password string) error {
	if len(password) < MinPasswordLength {
		return ErrWeakPassword
	}

	// Add more validation rules as needed
	// - Check for uppercase, lowercase, numbers, special characters
	// - Check against common passwords

	return nil
}
