package auth

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"net/http"
	"net/url"
	"time"

	"github.com/coreos/go-oidc/v3/oidc"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/rs/zerolog/log"
	"github.com/shubhamku044/ytclipper/internal/config"
	"github.com/shubhamku044/ytclipper/internal/database"
	"github.com/shubhamku044/ytclipper/internal/middleware"
	"github.com/shubhamku044/ytclipper/internal/models"
	"golang.org/x/oauth2"
)

type Auth0Service struct {
	config   *config.Auth0Config
	provider *oidc.Provider
	oauth    *oauth2.Config
	verifier *oidc.IDTokenVerifier
	db       *database.Database
}

type UserInfo struct {
	Sub           string `json:"sub"`
	Name          string `json:"name"`
	Email         string `json:"email"`
	EmailVerified bool   `json:"email_verified"`
	Picture       string `json:"picture"`
	Nickname      string `json:"nickname"`
}

func NewAuth0Service(cfg *config.Auth0Config, db *database.Database) (*Auth0Service, error) {
	ctx := context.Background()

	fmt.Printf("Connecting to Auth0 domain: %s\n", cfg.Domain)
	provider, err := oidc.NewProvider(ctx, "https://"+cfg.Domain+"/")
	if err != nil {
		return nil, fmt.Errorf("failed to create OIDC provider: %w", err)
	}

	oauth := &oauth2.Config{
		ClientID:     cfg.ClientID,
		ClientSecret: cfg.ClientSecret,
		RedirectURL:  cfg.CallbackURL,
		Endpoint:     provider.Endpoint(),
		Scopes:       []string{oidc.ScopeOpenID, "profile", "email"},
	}

	verifier := provider.Verifier(&oidc.Config{
		ClientID: cfg.ClientID,
	})

	return &Auth0Service{
		config:   cfg,
		provider: provider,
		oauth:    oauth,
		verifier: verifier,
		db:       db,
	}, nil
}

func (a *Auth0Service) GenerateState() (string, error) {
	b := make([]byte, 32)
	_, err := rand.Read(b)
	if err != nil {
		return "", err
	}
	state := base64.StdEncoding.EncodeToString(b)
	return state, nil
}

func (a *Auth0Service) LoginHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		fmt.Printf("🔐 LOGIN HANDLER CALLED - Starting Auth0 login flow\n")
		fmt.Printf("🔐 Request URL: %s\n", c.Request.URL.String())
		fmt.Printf("🔐 Request Headers: %+v\n", c.Request.Header)

		state, err := a.GenerateState()
		if err != nil {
			log.Error().Err(err).Msg("Failed to generate state")
			middleware.RespondWithError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to generate state", nil)
			return
		}

		fmt.Printf("🔐 Generated state: %s\n", state)

		// Store state in session/cookie for validation
		c.SetCookie("state", state, 300, "/", "", false, true) // 5 minutes

		authURL := a.oauth.AuthCodeURL(state)
		fmt.Printf("🔐 Redirecting to Auth0 URL: %s\n", authURL)

		c.Redirect(http.StatusTemporaryRedirect, authURL)
	}
}

func (a *Auth0Service) CallbackHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		fmt.Printf("🔄 CALLBACK HANDLER CALLED - Processing Auth0 callback\n")
		fmt.Printf("🔄 Request URL: %s\n", c.Request.URL.String())
		fmt.Printf("🔄 Query params: state=%s, code=%s, error=%s\n", c.Query("state"), c.Query("code"), c.Query("error"))

		// Check for Auth0 errors first
		if authError := c.Query("error"); authError != "" {
			errorDesc := c.Query("error_description")
			fmt.Printf("❌ Auth0 returned error: %s - %s\n", authError, errorDesc)
			log.Error().Str("error", authError).Str("description", errorDesc).Msg("Auth0 authentication error")
			middleware.RespondWithError(c, http.StatusBadRequest, "AUTH0_ERROR", fmt.Sprintf("Authentication failed: %s", errorDesc), nil)
			return
		}

		// Verify state
		storedState, err := c.Cookie("state")
		if err != nil {
			fmt.Printf("❌ Failed to get state from cookie: %v\n", err)
			log.Error().Err(err).Msg("Failed to get state from cookie")
			middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_STATE", "Invalid state parameter", nil)
			return
		}

		if c.Query("state") != storedState {
			fmt.Printf("❌ State mismatch: received=%s, stored=%s\n", c.Query("state"), storedState)
			log.Error().Msg("State parameter mismatch")
			middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_STATE", "State parameter mismatch", nil)
			return
		}

		fmt.Printf("✅ State validation passed\n")

		// Clear state cookie
		c.SetCookie("state", "", -1, "/", "", false, true)

		// Exchange code for token
		code := c.Query("code")
		fmt.Printf("🔄 Exchanging code for token: %s\n", code)

		token, err := a.oauth.Exchange(context.Background(), code)
		if err != nil {
			fmt.Printf("❌ Failed to exchange code for token: %v\n", err)
			log.Error().Err(err).Msg("Failed to exchange code for token")
			middleware.RespondWithError(c, http.StatusInternalServerError, "TOKEN_EXCHANGE_ERROR", "Failed to exchange code for token", nil)
			return
		}

		fmt.Printf("✅ Token exchange successful\n")

		// Extract and verify ID token
		rawIDToken, ok := token.Extra("id_token").(string)
		if !ok {
			fmt.Printf("❌ No id_token field in oauth2 token\n")
			log.Error().Msg("No id_token field in oauth2 token")
			middleware.RespondWithError(c, http.StatusInternalServerError, "NO_ID_TOKEN", "No id_token in response", nil)
			return
		}

		fmt.Printf("✅ ID token extracted successfully\n")

		idToken, err := a.verifier.Verify(context.Background(), rawIDToken)
		if err != nil {
			fmt.Printf("❌ Failed to verify ID token: %v\n", err)
			log.Error().Err(err).Msg("Failed to verify ID token")
			middleware.RespondWithError(c, http.StatusInternalServerError, "TOKEN_VERIFICATION_ERROR", "Failed to verify ID token", nil)
			return
		}

		fmt.Printf("✅ ID token verification successful\n")

		// Extract user info
		var userInfo UserInfo
		if err := idToken.Claims(&userInfo); err != nil {
			fmt.Printf("❌ Failed to extract user info: %v\n", err)
			log.Error().Err(err).Msg("Failed to extract user info")
			middleware.RespondWithError(c, http.StatusInternalServerError, "USER_INFO_ERROR", "Failed to extract user info", nil)
			return
		}

		fmt.Printf("✅ User info extracted - Email: %s, Sub: %s, Name: %s\n", userInfo.Email, userInfo.Sub, userInfo.Name)

		// Create or update user in database
		if a.db != nil {
			fmt.Printf("🔄 About to create/update user in database...\n")

			// Import the handlers package to use CreateOrUpdateUser
			// We need to move this function to avoid circular import
			dbUser, err := a.createOrUpdateUser(userInfo)
			if err != nil {
				fmt.Printf("❌ Failed to create/update user in database: %v\n", err)
				log.Error().Err(err).Msg("Failed to create/update user in database")
				middleware.RespondWithError(c, http.StatusInternalServerError, "DATABASE_ERROR", "Failed to save user", nil)
				return
			}

			fmt.Printf("✅ User processed successfully - DB ID: %s, Email: %s\n", dbUser.ID.String(), dbUser.Email)

			log.Info().
				Str("user_id", userInfo.Sub).
				Str("db_user_id", dbUser.ID.String()).
				Bool("is_new_user", dbUser.CreatedAt.Equal(dbUser.UpdatedAt)).
				Msg("User processed successfully")
		} else {
			fmt.Printf("⚠️  Database is nil, skipping user creation/update\n")
		}

		// Store tokens in secure cookies or return them
		fmt.Printf("🔄 Setting authentication cookies...\n")
		c.SetCookie("access_token", token.AccessToken, int(token.Expiry.Unix()), "/", "", true, true)
		c.SetCookie("id_token", rawIDToken, int(token.Expiry.Unix()), "/", "", true, true)

		log.Info().
			Str("user_id", userInfo.Sub).
			Str("email", userInfo.Email).
			Msg("User authenticated successfully")

		// Redirect to frontend or return user info
		frontend_url := "http://localhost:5173" // Update this to your frontend URL
		fmt.Printf("🔄 Redirecting to frontend: %s?auth=success\n", frontend_url)
		c.Redirect(http.StatusTemporaryRedirect, frontend_url+"?auth=success")
	}
}

func (a *Auth0Service) LogoutHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Clear cookies
		c.SetCookie("access_token", "", -1, "/", "", true, true)
		c.SetCookie("id_token", "", -1, "/", "", true, true)

		// Build Auth0 logout URL
		logoutURL := url.URL{
			Scheme: "https",
			Host:   a.config.Domain,
			Path:   "/v2/logout",
		}

		// Add query parameters
		parameters := url.Values{}
		parameters.Add("returnTo", "http://localhost:3000") // Your frontend URL
		parameters.Add("client_id", a.config.ClientID)
		logoutURL.RawQuery = parameters.Encode()

		c.Redirect(http.StatusTemporaryRedirect, logoutURL.String())
	}
}

func (a *Auth0Service) GetUserInfo() gin.HandlerFunc {
	return func(c *gin.Context) {
		idToken, err := c.Cookie("id_token")
		if err != nil {
			middleware.RespondWithError(c, http.StatusUnauthorized, "NO_TOKEN", "No authentication token found", nil)
			return
		}

		token, err := a.verifier.Verify(context.Background(), idToken)
		if err != nil {
			middleware.RespondWithError(c, http.StatusUnauthorized, "INVALID_TOKEN", "Invalid authentication token", nil)
			return
		}

		var userInfo UserInfo
		if err := token.Claims(&userInfo); err != nil {
			middleware.RespondWithError(c, http.StatusInternalServerError, "USER_INFO_ERROR", "Failed to extract user info", nil)
			return
		}

		middleware.RespondWithOK(c, userInfo)
	}
}

// DebugHandler provides debug information about the authentication flow
func (a *Auth0Service) DebugHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		fmt.Printf("🐛 DEBUG HANDLER CALLED\n")
		fmt.Printf("🐛 Request URL: %s\n", c.Request.URL.String())
		fmt.Printf("🐛 Request Headers: %+v\n", c.Request.Header)
		fmt.Printf("🐛 Cookies: %+v\n", c.Request.Cookies())
		fmt.Printf("🐛 Query params: %+v\n", c.Request.URL.Query())

		c.JSON(200, gin.H{
			"message": "Debug route working",
			"url":     c.Request.URL.String(),
			"headers": c.Request.Header,
			"cookies": c.Request.Cookies(),
			"query":   c.Request.URL.Query(),
		})
	}
}

// createOrUpdateUser creates a new user or updates existing user in database
func (a *Auth0Service) createOrUpdateUser(userInfo UserInfo) (*models.User, error) {
	// Check if user already exists
	var existingUser models.User
	err := a.db.DB.Where("auth0_sub = ?", userInfo.Sub).First(&existingUser).Error
	fmt.Printf("Checking for existing user with Auth0 ID: %s\n", userInfo.Sub)
	if err == nil {
		// User exists, update basic info
		existingUser.Name = userInfo.Name
		existingUser.Email = userInfo.Email
		existingUser.AvatarURL = userInfo.Picture
		existingUser.UpdatedAt = time.Now()

		if err := a.db.DB.Save(&existingUser).Error; err != nil {
			log.Error().Err(err).Str("user_id", userInfo.Sub).Msg("Failed to update existing user")
			return nil, err
		}

		fmt.Printf("Updated existing user: %s (%s)\n", existingUser.Name, existingUser.Email)

		return &existingUser, nil
	}

	// Create new user
	newUser := models.User{
		ID:        uuid.New(),
		Email:     userInfo.Email,
		Name:      userInfo.Name,
		Auth0ID:   userInfo.Sub,
		Auth0Sub:  userInfo.Sub,
		AvatarURL: userInfo.Picture,
		Plan:      models.PlanFree,
		IsActive:  true,
		Preferences: models.UserPreferences{
			Theme:                "light",
			Language:             "en",
			TimeFormat:           "12h",
			DefaultVideoQuality:  "720p",
			AutoSaveClips:        true,
			ShowTimestamps:       true,
			NotificationsEnabled: true,
		},
		TotalVideos:    0,
		TotalClips:     0,
		TotalPlaylists: 0,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	if err := a.db.DB.Create(&newUser).Error; err != nil {
		log.Error().Err(err).Str("user_id", userInfo.Sub).Msg("Failed to create new user")
		return nil, err
	}

	// log.Info().
	// 	Str("user_id", userInfo.Sub).
	// 	Str("db_user_id", newUser.ID.String()).
	// 	Str("email", newUser.Email).
	// 	Msg("Created new user successfully")
	fmt.Printf("Created new user: %s (%s)\n", newUser.Name, newUser.Email)

	return &newUser, nil
}
