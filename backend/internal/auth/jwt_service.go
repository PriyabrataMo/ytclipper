package auth

import (
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/shubhamku044/ytclipper/internal/config"
)

type JWTService struct {
	config *config.JWTConfig
}

type TokenPair struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int64  `json:"expires_in"`
}

type AccessTokenClaims struct {
	UserID    string `json:"user_id"`
	Email     string `json:"email"`
	Name      string `json:"name"`
	Picture   string `json:"picture"`
	TokenType string `json:"token_type"`
	jwt.RegisteredClaims
}

type RefreshTokenClaims struct {
	UserID    string `json:"user_id"`
	TokenType string `json:"token_type"`
	jwt.RegisteredClaims
}

func NewJWTService(cfg *config.JWTConfig) *JWTService {
	return &JWTService{
		config: cfg,
	}
}

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

func (j *JWTService) generateAccessToken(userID, email, name, picture string) (string, error) {
	now := time.Now()
	claims := AccessTokenClaims{
		UserID:    userID,
		Email:     email,
		Name:      name,
		Picture:   picture,
		TokenType: "access",
		RegisteredClaims: jwt.RegisteredClaims{
			ID:        uuid.New().String(),
			Subject:   userID,
			Issuer:    j.config.TokenIssuer,
			Audience:  []string{j.config.TokenAudience},
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(j.config.AccessTokenExpiry)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(j.config.Secret))
}

func (j *JWTService) generateRefreshToken(userID string) (string, error) {
	now := time.Now()
	claims := RefreshTokenClaims{
		UserID:    userID,
		TokenType: "refresh",
		RegisteredClaims: jwt.RegisteredClaims{
			ID:        uuid.New().String(),
			Subject:   userID,
			Issuer:    j.config.TokenIssuer,
			Audience:  []string{j.config.TokenAudience},
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(j.config.RefreshTokenExpiry)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(j.config.Secret))
}

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
		if claims.TokenType != "access" {
			return nil, fmt.Errorf("invalid token type: %s", claims.TokenType)
		}
		return claims, nil
	}

	return nil, fmt.Errorf("invalid token")
}

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
		if claims.TokenType != "refresh" {
			return nil, fmt.Errorf("invalid token type: %s", claims.TokenType)
		}
		return claims, nil
	}

	return nil, fmt.Errorf("invalid token")
}

func (j *JWTService) RefreshAccessToken(refreshTokenString string) (*TokenPair, error) {
	// Validate refresh token
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
func (j *JWTService) GenerateAccessToken(userID uint) (string, error) {
	return j.generateAccessToken(fmt.Sprintf("%d", userID), "", "", "")
}

// GenerateRefreshToken generates a refresh token for a user ID (public method)
func (j *JWTService) GenerateRefreshToken(userID uint) (string, error) {
	return j.generateRefreshToken(fmt.Sprintf("%d", userID))
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
		true, // secure
		true, // httpOnly
	)

	// Set refresh token cookie
	c.SetCookie(
		"refresh_token",
		refreshToken,
		int(j.config.RefreshTokenExpiry.Seconds()),
		"/",
		"",
		true, // secure
		true, // httpOnly
	)
}
