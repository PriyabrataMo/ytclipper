package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"github.com/shubhamku044/ytclipper/internal/config"
	"github.com/shubhamku044/ytclipper/internal/database"
	"github.com/shubhamku044/ytclipper/internal/middleware"
	"github.com/shubhamku044/ytclipper/internal/models"
)

type OAuthHandlers struct {
	googleConfig *config.GoogleOAuthConfig
	authConfig   *config.AuthConfig
	jwtService   *JWTService
	db           *database.Database
	serverConfig *config.ServerConfig
}

func NewOAuthHandlers(googleConfig *config.GoogleOAuthConfig, authConfig *config.AuthConfig, jwtService *JWTService, db *database.Database, serverConfig *config.ServerConfig) *OAuthHandlers {
	return &OAuthHandlers{
		googleConfig: googleConfig,
		authConfig:   authConfig,
		jwtService:   jwtService,
		db:           db,
		serverConfig: serverConfig,
	}
}

func (h *OAuthHandlers) LoginHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		redirectURL := fmt.Sprintf(
			"https://accounts.google.com/o/oauth2/v2/auth?client_id=%s&redirect_uri=%s&response_type=code&scope=openid%%20email%%20profile&access_type=offline&prompt=consent",
			h.googleConfig.ClientID,
			h.googleConfig.RedirectURL,
		)

		middleware.RespondWithOK(c, gin.H{
			"auth_url": redirectURL,
		})
	}
}

func (h *OAuthHandlers) CallbackHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		code := c.Query("code")
		if code == "" {
			middleware.RespondWithError(c, http.StatusBadRequest, "MISSING_CODE", "Authorization code is required", nil)
			return
		}

		log.Info().Str("redirect_uri", h.googleConfig.RedirectURL).Msg("Using redirect URI for token exchange")

		log.Info().Msg("Testing DNS resolution for oauth2.googleapis.com")

		// Test basic connectivity first
		log.Info().Msg("Testing basic internet connectivity")
		_, err := net.DialTimeout("tcp", "8.8.8.8:53", 5*time.Second)
		if err != nil {
			log.Error().Err(err).Msg("Cannot reach Google DNS server")
		} else {
			log.Info().Msg("Can reach Google DNS server")
		}

		// Test DNS resolution
		_, err = net.LookupHost("oauth2.googleapis.com")
		if err != nil {
			log.Error().Err(err).Msg("DNS resolution failed for oauth2.googleapis.com")
		} else {
			log.Info().Msg("DNS resolution successful for oauth2.googleapis.com")
		}

		tokenURL := "https://oauth2.googleapis.com/token"
		tokenData := map[string]string{
			"client_id":     h.googleConfig.ClientID,
			"client_secret": h.googleConfig.ClientSecret,
			"code":          code,
			"grant_type":    "authorization_code",
			"redirect_uri":  h.googleConfig.RedirectURL,
		}

		// Create HTTP client with timeout
		client := &http.Client{
			Timeout: 30 * time.Second,
		}

		tokenResp, err := client.PostForm(tokenURL, mapToValues(tokenData))
		if err != nil {
			log.Error().Err(err).Str("token_url", tokenURL).Msg("Failed to exchange code for token")
			middleware.RespondWithError(c, http.StatusInternalServerError, "TOKEN_EXCHANGE_ERROR", "Failed to exchange authorization code", nil)
			return
		}
		defer tokenResp.Body.Close()

		var tokenResult map[string]interface{}
		if err := json.NewDecoder(tokenResp.Body).Decode(&tokenResult); err != nil {
			log.Error().Err(err).Msg("Failed to decode token response")
			middleware.RespondWithError(c, http.StatusInternalServerError, "TOKEN_DECODE_ERROR", "Failed to decode token response", nil)
			return
		}

		accessToken, ok := tokenResult["access_token"].(string)
		if !ok {
			log.Error().Msg("No access token in response")
			middleware.RespondWithError(c, http.StatusInternalServerError, "NO_ACCESS_TOKEN", "No access token received from Google", nil)
			return
		}

		userInfoURL := "https://www.googleapis.com/oauth2/v2/userinfo"
		req, err := http.NewRequest("GET", userInfoURL, nil)
		if err != nil {
			log.Error().Err(err).Msg("Failed to create user info request")
			middleware.RespondWithError(c, http.StatusInternalServerError, "REQUEST_ERROR", "Failed to create user info request", nil)
			return
		}

		req.Header.Set("Authorization", "Bearer "+accessToken)
		userInfoResp, err := client.Do(req)
		if err != nil {
			log.Error().Err(err).Msg("Failed to get user info")
			middleware.RespondWithError(c, http.StatusInternalServerError, "USER_INFO_ERROR", "Failed to get user info from Google", nil)
			return
		}
		defer userInfoResp.Body.Close()

		var googleUser GoogleUserInfo
		if err := json.NewDecoder(userInfoResp.Body).Decode(&googleUser); err != nil {
			log.Error().Err(err).Msg("Failed to decode user info")
			middleware.RespondWithError(c, http.StatusInternalServerError, "USER_INFO_DECODE_ERROR", "Failed to decode user info", nil)
			return
		}

		ctx := context.Background()
		var user models.User
		err = h.db.DB.NewSelect().
			Model(&user).
			Where("email = ?", googleUser.Email).
			Scan(ctx)

		if err != nil {
			user = models.User{
				Email:         googleUser.Email,
				Name:          googleUser.Name,
				GoogleID:      &googleUser.ID,
				EmailVerified: googleUser.VerifiedEmail,
				CreatedAt:     time.Now().UTC(),
				UpdatedAt:     time.Now().UTC(),
			}

			if err := h.db.Create(ctx, &user); err != nil {
				log.Error().Err(err).Msg("Failed to create user")
				middleware.RespondWithError(c, http.StatusInternalServerError, "USER_CREATION_ERROR", "Failed to create user", nil)
				return
			}
		} else {
			if user.GoogleID == nil || *user.GoogleID == "" {
				googleID := googleUser.ID
				user.GoogleID = &googleID
				user.UpdatedAt = time.Now().UTC()
				if err := h.db.Update(ctx, &user); err != nil {
					log.Error().Err(err).Msg("Failed to update user with Google ID")
				}
			}
		}

		accessTokenJWT, _, err := h.jwtService.GenerateAccessToken(user.ID.String())
		if err != nil {
			log.Error().Err(err).Msg("Failed to generate access token")
			middleware.RespondWithError(c, http.StatusInternalServerError, "TOKEN_GENERATION_ERROR", "Failed to generate access token", nil)
			return
		}

		refreshTokenJWT, _, err := h.jwtService.GenerateRefreshToken(user.ID.String())
		if err != nil {
			log.Error().Err(err).Msg("Failed to generate refresh token")
			middleware.RespondWithError(c, http.StatusInternalServerError, "TOKEN_GENERATION_ERROR", "Failed to generate refresh token", nil)
			return
		}

		h.jwtService.SetTokenCookies(c, accessTokenJWT, refreshTokenJWT)

		frontendURL := "http://localhost:5173"
		if h.serverConfig.Env == "production" {
			frontendURL = "https://app.ytclipper.com"
		}

		redirectURL := fmt.Sprintf("%s/auth/callback?auth=success&user=%s", frontendURL, user.Email)
		c.Redirect(http.StatusTemporaryRedirect, redirectURL)
	}
}

func (h *OAuthHandlers) LogoutHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.SetCookie("access_token", "", -1, "/", "", false, true)
		c.SetCookie("refresh_token", "", -1, "/", "", false, true)

		middleware.RespondWithOK(c, gin.H{
			"message": "Logged out successfully",
		})
	}
}

func mapToValues(data map[string]string) map[string][]string {
	result := make(map[string][]string)
	for k, v := range data {
		result[k] = []string{v}
	}
	return result
}
