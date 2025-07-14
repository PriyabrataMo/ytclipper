package auth

import (
	"context"
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/shubhamku044/ytclipper/internal/config"
	"github.com/shubhamku044/ytclipper/internal/database"
	"github.com/shubhamku044/ytclipper/internal/models"
)

type JWTService struct {
	config     *config.JWTConfig
	authConfig *config.AuthConfig
	db         *database.Database
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

func NewJWTService(cfg *config.JWTConfig, authCfg *config.AuthConfig, db *database.Database) *JWTService {
	return &JWTService{
		config:     cfg,
		authConfig: authCfg,
		db:         db,
	}
}

func (j *JWTService) GenerateTokenPairFromUser(user *models.User) (*TokenPair, error) {
	accessToken, err := j.generateAccessToken(user.ID.String(), user.Email, user.Name, user.Picture)
	if err != nil {
		return nil, err
	}

	refreshToken, err := j.generateRefreshToken(user.ID.String())
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

func (j *JWTService) RefreshAccessToken(refreshTokenString string) (*TokenPair, error) {
	refreshClaims, err := j.ValidateRefreshToken(refreshTokenString)
	if err != nil {
		return nil, fmt.Errorf("invalid refresh token: %w", err)
	}

	var user models.User

	err = j.db.DB.NewSelect().
		Model(&user).
		Where("id = ?", refreshClaims.UserID).
		Scan(context.Background())
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	return j.GenerateTokenPairFromUser(&user)
}

func (j *JWTService) GenerateAccessToken(userID uuid.UUID) (string, error) {
	return j.generateAccessToken(userID.String(), "", "", "")
}

func (j *JWTService) GenerateRefreshToken(userID uuid.UUID) (string, error) {
	return j.generateRefreshToken(userID.String())
}

func (j *JWTService) SetTokenCookies(c *gin.Context, accessToken, refreshToken string) {
	c.SetCookie(
		"access_token",
		accessToken,
		int(j.config.AccessTokenExpiry.Seconds()),
		"/",
		j.authConfig.CookieDomain,
		j.authConfig.CookieSecure,
		j.authConfig.CookieHTTPOnly,
	)

	c.SetCookie(
		"refresh_token",
		refreshToken,
		int(j.config.RefreshTokenExpiry.Seconds()),
		"/",
		j.authConfig.CookieDomain,
		j.authConfig.CookieSecure,
		j.authConfig.CookieHTTPOnly,
	)
}

func (j *JWTService) ClearTokenCookies(c *gin.Context) {
	c.SetCookie("access_token", "", -1, "/", j.authConfig.CookieDomain, j.authConfig.CookieSecure, j.authConfig.CookieHTTPOnly)
	c.SetCookie("refresh_token", "", -1, "/", j.authConfig.CookieDomain, j.authConfig.CookieSecure, j.authConfig.CookieHTTPOnly)
}
