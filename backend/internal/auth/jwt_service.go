package auth

import (
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/shubhamku044/ytclipper/internal/config"
)

// JWTService handles JWT token operations
type JWTService struct {
	config *config.JWTConfig
}

// TokenPair represents a pair of access and refresh tokens
type TokenPair struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int64  `json:"expires_in"`
}

// AccessTokenClaims represents the claims in an access token
type AccessTokenClaims struct {
	UserID    string `json:"user_id"`
	Email     string `json:"email"`
	Name      string `json:"name"`
	Picture   string `json:"picture"`
	TokenType string `json:"token_type"`
	jwt.RegisteredClaims
}

// RefreshTokenClaims represents the claims in a refresh token
type RefreshTokenClaims struct {
	UserID    string `json:"user_id"`
	TokenType string `json:"token_type"`
	jwt.RegisteredClaims
}

// NewJWTService creates a new JWT service
func NewJWTService(cfg *config.JWTConfig) *JWTService {
	return &JWTService{config: cfg}
}

// GenerateTokenPair generates a new access and refresh token pair
func (j *JWTService) GenerateTokenPair(userID, email, name, picture string) (*TokenPair, error) {
	// Generate access token
	accessToken, err := j.generateAccessToken(userID, email, name, picture)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	// Generate refresh token
	refreshToken, err := j.generateRefreshToken(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token: %w", err)
	}

	return &TokenPair{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		TokenType:    "Bearer",
		ExpiresIn:    int64(j.config.AccessTokenExpiry.Seconds()),
	}, nil
}

// generateAccessToken generates an access token with user claims
func (j *JWTService) generateAccessToken(userID, email, name, picture string) (string, error) {
	now := time.Now()
	claims := AccessTokenClaims{
		UserID:    userID,
		Email:     email,
		Name:      name,
		Picture:   picture,
		TokenType: "access",
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    j.config.TokenIssuer,
			Audience:  []string{j.config.TokenAudience},
			Subject:   userID,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(j.config.AccessTokenExpiry)),
			NotBefore: jwt.NewNumericDate(now),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(j.config.Secret))
}

// generateRefreshToken generates a refresh token
func (j *JWTService) generateRefreshToken(userID string) (string, error) {
	now := time.Now()
	claims := RefreshTokenClaims{
		UserID:    userID,
		TokenType: "refresh",
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    j.config.TokenIssuer,
			Audience:  []string{j.config.TokenAudience},
			Subject:   userID,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(j.config.RefreshTokenExpiry)),
			NotBefore: jwt.NewNumericDate(now),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(j.config.Secret))
}

// ValidateAccessToken validates an access token and returns its claims
func (j *JWTService) ValidateAccessToken(tokenString string) (*AccessTokenClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &AccessTokenClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(j.config.Secret), nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %w", err)
	}

	if claims, ok := token.Claims.(*AccessTokenClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, fmt.Errorf("invalid token")
}

// ValidateRefreshToken validates a refresh token and returns its claims
func (j *JWTService) ValidateRefreshToken(tokenString string) (*RefreshTokenClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &RefreshTokenClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(j.config.Secret), nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %w", err)
	}

	if claims, ok := token.Claims.(*RefreshTokenClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, fmt.Errorf("invalid token")
}

// RefreshAccessToken generates a new access token from a refresh token
func (j *JWTService) RefreshAccessToken(refreshTokenString string) (*TokenPair, error) {
	refreshClaims, err := j.ValidateRefreshToken(refreshTokenString)
	if err != nil {
		return nil, fmt.Errorf("invalid refresh token: %w", err)
	}

	// Here you would typically fetch user details from database
	// For now, we'll use the user ID from the refresh token
	userID := refreshClaims.UserID

	// Generate new token pair
	// Note: In a real implementation, you'd fetch user details from database
	return j.GenerateTokenPair(userID, "", "", "")
}

// GenerateAccessToken generates an access token for a user ID (public method)
func (j *JWTService) GenerateAccessToken(userID uuid.UUID) (string, error) {
	return j.generateAccessToken(userID.String(), "", "", "")
}

// GenerateRefreshToken generates a refresh token for a user ID (public method)
func (j *JWTService) GenerateRefreshToken(userID uuid.UUID) (string, error) {
	return j.generateRefreshToken(userID.String())
}

// SetTokenCookies sets JWT tokens as HTTP-only cookies
func (j *JWTService) SetTokenCookies(c *gin.Context, accessToken, refreshToken string) {
	// Set access token cookie
	c.SetCookie(
		"access_token",
		accessToken,
		int(j.config.AccessTokenExpiry.Seconds()),
		"/",
		"",
		false, // secure - should be true in production with HTTPS
		true,  // httpOnly
	)

	// Set refresh token cookie
	c.SetCookie(
		"refresh_token",
		refreshToken,
		int(j.config.RefreshTokenExpiry.Seconds()),
		"/",
		"",
		false, // secure - should be true in production with HTTPS
		true,  // httpOnly
	)
}

// ClearTokenCookies clears JWT token cookies
func (j *JWTService) ClearTokenCookies(c *gin.Context) {
	c.SetCookie("access_token", "", -1, "/", "", false, true)
	c.SetCookie("refresh_token", "", -1, "/", "", false, true)
}
