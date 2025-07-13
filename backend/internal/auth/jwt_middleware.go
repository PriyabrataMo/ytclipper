package auth

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"github.com/shubhamku044/ytclipper/internal/config"
	"github.com/shubhamku044/ytclipper/internal/middleware"
)

type AuthMiddleware struct {
	jwtService *JWTService
	config     *config.AuthConfig
}

func NewAuthMiddleware(jwtService *JWTService, config *config.AuthConfig) *AuthMiddleware {
	return &AuthMiddleware{
		jwtService: jwtService,
		config:     config,
	}
}

// JWTMiddleware validates JWT tokens from Authorization header or cookies
func (a *AuthMiddleware) JWTMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		token := a.extractToken(c)
		if token == "" {
			middleware.RespondWithError(c, http.StatusUnauthorized, "NO_TOKEN", "No authentication token provided", nil)
			c.Abort()
			return
		}

		// Validate the access token
		claims, err := a.jwtService.ValidateAccessToken(token)
		if err != nil {
			log.Error().Err(err).Msg("Invalid access token")

			// Try to refresh token if it's expired
			if refreshToken := a.extractRefreshToken(c); refreshToken != "" {
				if newTokenPair, refreshErr := a.jwtService.RefreshAccessToken(refreshToken); refreshErr == nil {
					// Set new cookies
					a.setAuthCookies(c, newTokenPair)

					// Validate the new access token
					if newClaims, validateErr := a.jwtService.ValidateAccessToken(newTokenPair.AccessToken); validateErr == nil {
						a.setUserContext(c, newClaims)
						c.Next()
						return
					}
				}
			}

			middleware.RespondWithError(c, http.StatusUnauthorized, "INVALID_TOKEN", "Invalid or expired token", nil)
			c.Abort()
			return
		}

		// Set user information in context
		a.setUserContext(c, claims)
		c.Next()
	}
}

// RequireAuth middleware that requires valid authentication
func (a *AuthMiddleware) RequireAuth() gin.HandlerFunc {
	return a.JWTMiddleware()
}

// OptionalAuth middleware that doesn't require authentication but sets user context if available
func (a *AuthMiddleware) OptionalAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		token := a.extractToken(c)
		if token == "" {
			c.Next()
			return
		}

		// Try to validate the token
		claims, err := a.jwtService.ValidateAccessToken(token)
		if err != nil {
			// Try to refresh token if it's expired
			if refreshToken := a.extractRefreshToken(c); refreshToken != "" {
				if newTokenPair, refreshErr := a.jwtService.RefreshAccessToken(refreshToken); refreshErr == nil {
					// Set new cookies
					a.setAuthCookies(c, newTokenPair)

					// Validate the new access token
					if newClaims, validateErr := a.jwtService.ValidateAccessToken(newTokenPair.AccessToken); validateErr == nil {
						a.setUserContext(c, newClaims)
					}
				}
			}
			c.Next()
			return
		}

		// Set user information in context
		a.setUserContext(c, claims)
		c.Next()
	}
}

func (a *AuthMiddleware) extractToken(c *gin.Context) string {
	// First, try to get token from Authorization header
	authHeader := c.GetHeader("Authorization")
	if authHeader != "" && strings.HasPrefix(authHeader, "Bearer ") {
		return strings.TrimPrefix(authHeader, "Bearer ")
	}

	// If no Authorization header, try to get from cookie
	if token, err := c.Cookie("access_token"); err == nil {
		return token
	}

	return ""
}

func (a *AuthMiddleware) extractRefreshToken(c *gin.Context) string {
	if token, err := c.Cookie("refresh_token"); err == nil {
		return token
	}
	return ""
}

func (a *AuthMiddleware) setAuthCookies(c *gin.Context, tokenPair *TokenPair) {
	// Set access token cookie
	c.SetCookie("access_token", tokenPair.AccessToken, int(tokenPair.ExpiresIn), "/", a.config.CookieDomain, a.config.CookieSecure, a.config.CookieHTTPOnly)

	// Set refresh token cookie (7 days)
	c.SetCookie("refresh_token", tokenPair.RefreshToken, int(7*24*60*60), "/", a.config.CookieDomain, a.config.CookieSecure, a.config.CookieHTTPOnly)
}

func (a *AuthMiddleware) setUserContext(c *gin.Context, claims *AccessTokenClaims) {
	c.Set("user_id", claims.UserID)
	c.Set("user_email", claims.Email)
	c.Set("user_name", claims.Name)
	c.Set("user_picture", claims.Picture)
	c.Set("claims", claims)
}

// Helper functions for getting user information from context
func GetUserID(c *gin.Context) (string, bool) {
	userID, exists := c.Get("user_id")
	if !exists {
		return "", false
	}
	userIDStr, ok := userID.(string)
	return userIDStr, ok
}

func GetUserEmail(c *gin.Context) (string, bool) {
	email, exists := c.Get("user_email")
	if !exists {
		return "", false
	}
	emailStr, ok := email.(string)
	return emailStr, ok
}

func GetUserName(c *gin.Context) (string, bool) {
	name, exists := c.Get("user_name")
	if !exists {
		return "", false
	}
	nameStr, ok := name.(string)
	return nameStr, ok
}

func GetUserPicture(c *gin.Context) (string, bool) {
	picture, exists := c.Get("user_picture")
	if !exists {
		return "", false
	}
	pictureStr, ok := picture.(string)
	return pictureStr, ok
}

func GetClaims(c *gin.Context) (*AccessTokenClaims, bool) {
	claims, exists := c.Get("claims")
	if !exists {
		return nil, false
	}
	accessClaims, ok := claims.(*AccessTokenClaims)
	return accessClaims, ok
}
