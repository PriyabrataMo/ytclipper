package auth

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"github.com/shubhamku044/ytclipper/internal/config"
	"github.com/shubhamku044/ytclipper/internal/middleware"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

type GoogleOAuthService struct {
	config     *config.GoogleOAuthConfig
	authConfig *config.AuthConfig
	oauth      *oauth2.Config
	jwtService *JWTService
}

type GoogleUserInfo struct {
	ID            string `json:"id"`
	Email         string `json:"email"`
	VerifiedEmail bool   `json:"verified_email"`
	Name          string `json:"name"`
	GivenName     string `json:"given_name"`
	FamilyName    string `json:"family_name"`
	Picture       string `json:"picture"`
	Locale        string `json:"locale"`
}

func NewGoogleOAuthService(cfg *config.GoogleOAuthConfig, authCfg *config.AuthConfig, jwtService *JWTService) *GoogleOAuthService {
	oauth := &oauth2.Config{
		ClientID:     cfg.ClientID,
		ClientSecret: cfg.ClientSecret,
		RedirectURL:  cfg.RedirectURL,
		Scopes: []string{
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/userinfo.profile",
		},
		Endpoint: google.Endpoint,
	}

	return &GoogleOAuthService{
		config:     cfg,
		authConfig: authCfg,
		oauth:      oauth,
		jwtService: jwtService,
	}
}

func (g *GoogleOAuthService) GenerateState() (string, error) {
	b := make([]byte, 32)
	_, err := rand.Read(b)
	if err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

func (g *GoogleOAuthService) LoginHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		state, err := g.GenerateState()
		if err != nil {
			log.Error().Err(err).Msg("Failed to generate state")
			middleware.RespondWithError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to generate state", nil)
			return
		}

		// Store state in secure cookie
		c.SetCookie("oauth_state", state, 300, "/", g.authConfig.CookieDomain, g.authConfig.CookieSecure, g.authConfig.CookieHTTPOnly)

		authURL := g.oauth.AuthCodeURL(state, oauth2.AccessTypeOffline, oauth2.ApprovalForce)

		// For API requests, return the URL instead of redirecting
		if c.GetHeader("Accept") == "application/json" {
			middleware.RespondWithOK(c, gin.H{"auth_url": authURL})
			return
		}

		c.Redirect(http.StatusTemporaryRedirect, authURL)
	}
}

func (g *GoogleOAuthService) CallbackHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Verify state
		storedState, err := c.Cookie("oauth_state")
		if err != nil {
			log.Error().Err(err).Msg("Failed to get state from cookie")
			middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_STATE", "Invalid state parameter", nil)
			return
		}

		if c.Query("state") != storedState {
			log.Error().Msg("State parameter mismatch")
			middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_STATE", "State parameter mismatch", nil)
			return
		}

		// Clear state cookie
		c.SetCookie("oauth_state", "", -1, "/", g.authConfig.CookieDomain, g.authConfig.CookieSecure, g.authConfig.CookieHTTPOnly)

		// Handle OAuth error
		if errorCode := c.Query("error"); errorCode != "" {
			log.Error().Str("error", errorCode).Str("description", c.Query("error_description")).Msg("OAuth error")
			middleware.RespondWithError(c, http.StatusBadRequest, "OAUTH_ERROR", "OAuth authentication failed", nil)
			return
		}

		// Exchange code for token
		code := c.Query("code")
		if code == "" {
			middleware.RespondWithError(c, http.StatusBadRequest, "MISSING_CODE", "Authorization code is required", nil)
			return
		}

		token, err := g.oauth.Exchange(context.Background(), code)
		if err != nil {
			log.Error().Err(err).Msg("Failed to exchange code for token")
			middleware.RespondWithError(c, http.StatusInternalServerError, "TOKEN_EXCHANGE_ERROR", "Failed to exchange code for token", nil)
			return
		}

		// Get user info from Google
		userInfo, err := g.getUserInfo(token.AccessToken)
		if err != nil {
			log.Error().Err(err).Msg("Failed to get user info")
			middleware.RespondWithError(c, http.StatusInternalServerError, "USER_INFO_ERROR", "Failed to get user info", nil)
			return
		}

		// Generate JWT tokens
		tokenPair, err := g.jwtService.GenerateTokenPair(userInfo.ID, userInfo.Email, userInfo.Name, userInfo.Picture)
		if err != nil {
			log.Error().Err(err).Msg("Failed to generate JWT tokens")
			middleware.RespondWithError(c, http.StatusInternalServerError, "JWT_ERROR", "Failed to generate authentication tokens", nil)
			return
		}

		// Set secure cookies
		g.setAuthCookies(c, tokenPair)

		log.Info().
			Str("user_id", userInfo.ID).
			Str("email", userInfo.Email).
			Msg("User authenticated successfully")

		// Redirect to frontend
		frontendURL := g.getFrontendURL(c)
		c.Redirect(http.StatusTemporaryRedirect, frontendURL+"?auth=success")
	}
}

func (g *GoogleOAuthService) getUserInfo(accessToken string) (*GoogleUserInfo, error) {
	resp, err := http.Get("https://www.googleapis.com/oauth2/v2/userinfo?access_token=" + accessToken)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to get user info: %s", resp.Status)
	}

	var userInfo GoogleUserInfo
	if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
		return nil, err
	}

	return &userInfo, nil
}

func (g *GoogleOAuthService) setAuthCookies(c *gin.Context, tokenPair *TokenPair) {
	// Set access token cookie (shorter expiry)
	c.SetCookie("access_token", tokenPair.AccessToken, int(tokenPair.ExpiresIn), "/", g.authConfig.CookieDomain, g.authConfig.CookieSecure, g.authConfig.CookieHTTPOnly)

	// Set refresh token cookie (longer expiry)
	c.SetCookie("refresh_token", tokenPair.RefreshToken, int(7*24*60*60), "/", g.authConfig.CookieDomain, g.authConfig.CookieSecure, g.authConfig.CookieHTTPOnly)
}

func (g *GoogleOAuthService) getFrontendURL(c *gin.Context) string {
	// Get the origin or use default
	origin := c.GetHeader("Origin")
	if origin == "" {
		origin = c.GetHeader("Referer")
		if origin != "" {
			if u, err := url.Parse(origin); err == nil {
				origin = u.Scheme + "://" + u.Host
			}
		}
	}

	// Default fallback based on environment
	if origin == "" {
		origin = "http://localhost:5173" // Default development frontend URL
	}

	return origin
}

func (g *GoogleOAuthService) LogoutHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Clear authentication cookies
		c.SetCookie("access_token", "", -1, "/", g.authConfig.CookieDomain, g.authConfig.CookieSecure, g.authConfig.CookieHTTPOnly)
		c.SetCookie("refresh_token", "", -1, "/", g.authConfig.CookieDomain, g.authConfig.CookieSecure, g.authConfig.CookieHTTPOnly)

		log.Info().Msg("User logged out successfully")

		// Return success response
		middleware.RespondWithOK(c, gin.H{"message": "Logged out successfully"})
	}
}

func (g *GoogleOAuthService) RefreshTokenHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get refresh token from cookie
		refreshToken, err := c.Cookie("refresh_token")
		if err != nil {
			middleware.RespondWithError(c, http.StatusUnauthorized, "NO_REFRESH_TOKEN", "No refresh token found", nil)
			return
		}

		// Generate new token pair
		tokenPair, err := g.jwtService.RefreshAccessToken(refreshToken)
		if err != nil {
			log.Error().Err(err).Msg("Failed to refresh token")
			middleware.RespondWithError(c, http.StatusUnauthorized, "REFRESH_ERROR", "Failed to refresh token", nil)
			return
		}

		// Set new cookies
		g.setAuthCookies(c, tokenPair)

		// Return new tokens
		middleware.RespondWithOK(c, tokenPair)
	}
}
