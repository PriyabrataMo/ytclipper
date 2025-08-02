package auth

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/rs/zerolog/log"
	"github.com/shubhamku044/ytclipper/internal/database"
	"github.com/shubhamku044/ytclipper/internal/middleware"
	"github.com/shubhamku044/ytclipper/internal/models"
)

type AuthHandlers struct {
	authMiddleware *AuthMiddleware
	jwtService     *JWTService
	emailService   *EmailService
	db             *database.Database
}

func NewAuthHandlers(authMiddleware *AuthMiddleware, jwtService *JWTService, emailService *EmailService, db *database.Database) *AuthHandlers {
	return &AuthHandlers{
		authMiddleware: authMiddleware,
		jwtService:     jwtService,
		emailService:   emailService,
		db:             db,
	}
}

func (h *AuthHandlers) GetCurrentUser() gin.HandlerFunc {
	return h.authMiddleware.RequireAuth()
}

func extractExpiryFromToken(tokenStr string) (int64, error) {
	parser := jwt.NewParser()
	token, _, err := parser.ParseUnverified(tokenStr, &jwt.RegisteredClaims{})
	if err != nil {
		return 0, err
	}
	if claims, ok := token.Claims.(*jwt.RegisteredClaims); ok && claims.ExpiresAt != nil {
		return claims.ExpiresAt.Time.Unix(), nil
	}
	return 0, fmt.Errorf("no expiry in token")
}

func (h *AuthHandlers) GetCurrentUserHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		user, exists := GetUser(c)
		if !exists {
			middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER", "No user found", nil)
			return
		}

		authMethods := []string{}
		if user.GoogleID != "" {
			authMethods = append(authMethods, "google")
		}
		if user.Password != "" {
			authMethods = append(authMethods, "password")
		}

		accessToken, err1 := c.Cookie("access_token")
		refreshToken, err2 := c.Cookie("refresh_token")

		var accessTokenExpiry int64
		var refreshTokenExpiry int64

		if err1 == nil {
			if exp, err := extractExpiryFromToken(accessToken); err == nil {
				accessTokenExpiry = exp
			}
		}

		if err2 == nil {
			if exp, err := extractExpiryFromToken(refreshToken); err == nil {
				refreshTokenExpiry = exp
			}
		}

		response := gin.H{
			"user":                 user,
			"auth_methods":         authMethods,
			"access_token":         accessToken,
			"refresh_token":        refreshToken,
			"access_token_expiry":  accessTokenExpiry,
			"refresh_token_expiry": refreshTokenExpiry,
		}

		middleware.RespondWithOK(c, response)
	}
}

func (h *AuthHandlers) GetAccessToken() gin.HandlerFunc {
	return func(c *gin.Context) {
		accessToken, err := c.Cookie("access_token")
		if err != nil {
			middleware.RespondWithError(c, http.StatusUnauthorized, "NO_TOKEN", "No access token found", nil)
			return
		}

		middleware.RespondWithOK(c, gin.H{
			"access_token": accessToken,
		})
	}
}

func (h *AuthHandlers) RefreshTokenHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		refreshToken, err := c.Cookie("refresh_token")
		if err != nil {
			middleware.RespondWithError(c, http.StatusUnauthorized, "NO_REFRESH_TOKEN", "No refresh token found", nil)
			return
		}

		tokenPair, err := h.jwtService.RefreshAccessToken(refreshToken)
		if err != nil {
			log.Error().Err(err).Msg("Failed to refresh token")
			middleware.RespondWithError(c, http.StatusUnauthorized, "REFRESH_ERROR", "Failed to refresh token", nil)
			return
		}

		h.jwtService.SetTokenCookies(c, tokenPair.AccessToken, tokenPair.RefreshToken)

		middleware.RespondWithOK(c, tokenPair)
	}
}

func (h *AuthHandlers) RegisterHandler(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request payload", err.Error())
		return
	}

	ctx := context.Background()

	var existingUser models.User
	err := h.db.DB.NewSelect().
		Model(&existingUser).
		Where("email = ?", req.Email).
		Scan(ctx)
	if err == nil {
		middleware.RespondWithError(c, http.StatusConflict, "USER_EXISTS", "User with this email already exists", nil)
		return
	}

	if err = ValidatePassword(req.Password); err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_PASSWORD", "Invalid password", err.Error())
		return
	}

	hashedPassword, err := HashPassword(req.Password)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "HASHING_ERROR", "Failed to hash password", err.Error())
		return
	}

	user := models.User{
		Name:          req.Name,
		Email:         req.Email,
		Password:      hashedPassword,
		EmailVerified: false,
	}

	if err := h.db.Create(ctx, &user); err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "USER_CREATION_ERROR", "Failed to create user", err.Error())
		return
	}

	middleware.RespondWithOK(c, gin.H{
		"message": "User created successfully. You can now login and verify your email using OTP.",
		"user":    user,
	})
}

func (h *AuthHandlers) LoginHandler(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request payload", err.Error())
		return
	}

	ctx := context.Background()

	var user models.User
	err := h.db.DB.NewSelect().
		Model(&user).
		Where("email = ?", req.Email).
		Scan(ctx)
	if err != nil {
		middleware.RespondWithError(c, http.StatusNotFound, "USER_NOT_FOUND", "User not found", gin.H{
			"email": req.Email,
		})
		return
	}

	if user.Password == "" {
		middleware.RespondWithError(c, http.StatusBadRequest, "OAUTH_ONLY", "This account uses OAuth login. Please use Google login or add a password first.", nil)
		return
	}

	if err = CheckPassword(req.Password, user.Password); err != nil {
		middleware.RespondWithError(c, http.StatusUnauthorized, "INVALID_CREDENTIALS", "Invalid credentials", gin.H{
			"email": req.Email,
		})
		return
	}

	accessToken, accessTokenExpiry, err := h.jwtService.GenerateAccessToken(user.ID.String())
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "TOKEN_GENERATION_ERROR", "Failed to generate access token", nil)
		return
	}

	refreshToken, refreshTokenExpiry, err := h.jwtService.GenerateRefreshToken(user.ID.String())
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "TOKEN_GENERATION_ERROR", "Failed to generate refresh token", nil)
		return
	}

	h.jwtService.SetTokenCookies(c, accessToken, refreshToken)

	authMethods := []string{}
	if user.GoogleID != "" {
		authMethods = append(authMethods, "google")
	}
	if user.Password != "" {
		authMethods = append(authMethods, "password")
	}

	response := gin.H{
		"message":              "Login successful",
		"user":                 user,
		"authMethods":          authMethods,
		"access_token":         accessToken,
		"refresh_token":        refreshToken,
		"access_token_expiry":  accessTokenExpiry,
		"refresh_token_expiry": refreshTokenExpiry,
	}

	middleware.RespondWithOK(c, response)
}

func (h *AuthHandlers) ForgotPasswordHandler(c *gin.Context) {
	var req ForgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request payload", err.Error())
		return
	}

	ctx := context.Background()

	var user models.User
	err := h.db.DB.NewSelect().
		Model(&user).
		Where("email = ?", req.Email).
		Scan(ctx)
	if err != nil {
		middleware.RespondWithOK(c, gin.H{
			"message": "If the email exists, a password reset link has been sent.",
		})
		return
	}

	if err := h.db.Update(ctx, &user); err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_ERROR", "Failed to save reset token", err.Error())
		return
	}

	middleware.RespondWithOK(c, gin.H{
		"message": "Password reset link sent to your email.",
	})
}

func (h *AuthHandlers) ResetPasswordHandler(c *gin.Context) {
	var req ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request payload", err.Error())
		return
	}

	ctx := context.Background()

	var user models.User
	err := h.db.DB.NewSelect().
		Model(&user).
		Where("password_reset_token = ? AND password_reset_expiry > ?", req.Token, time.Now()).
		Scan(ctx)
	if err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_TOKEN", "Invalid or expired reset token", nil)
		return
	}

	if err = ValidatePassword(req.Password); err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_PASSWORD", "Invalid password", err.Error())
		return
	}

	hashedPassword, err := HashPassword(req.Password)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "HASHING_ERROR", "Failed to hash password", err.Error())
		return
	}

	user.Password = hashedPassword
	user.PasswordResetToken = ""
	user.PasswordResetExpiry = nil

	if err := h.db.Update(ctx, &user); err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_ERROR", "Failed to update password", err.Error())
		return
	}

	middleware.RespondWithOK(c, gin.H{
		"message": "Password reset successful. You can now login with your new password.",
	})
}

func (h *AuthHandlers) AuthStatusHandler(c *gin.Context) {
	user, exists := GetUser(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NOT_AUTHENTICATED", "User not authenticated", nil)
		return
	}

	accessToken, _ := c.Cookie("access_token")
	refreshToken, _ := c.Cookie("refresh_token")

	var tokenValid bool
	var tokenError string
	if accessToken != "" {
		_, err := h.jwtService.ValidateToken(accessToken)
		tokenValid = err == nil
		if err != nil {
			tokenError = err.Error()
		}
	}

	middleware.RespondWithOK(c, gin.H{
		"user":          user,
		"token_valid":   tokenValid,
		"token_error":   tokenError,
		"refresh_token": refreshToken,
	})
}

func (h *AuthHandlers) DebugUserHandler(c *gin.Context) {
	email := c.Query("email")
	if email == "" {
		middleware.RespondWithError(c, http.StatusBadRequest, "MISSING_EMAIL", "Email parameter is required", nil)
		return
	}

	ctx := context.Background()
	var user models.User
	err := h.db.DB.NewSelect().
		Model(&user).
		Where("email = ?", email).
		Scan(ctx)

	if err != nil {
		middleware.RespondWithError(c, http.StatusNotFound, "USER_NOT_FOUND", "User not found in database", err.Error())
		return
	}

	middleware.RespondWithOK(c, gin.H{
		"user": gin.H{
			"id":             user.ID.String(),
			"email":          user.Email,
			"name":           user.Name,
			"has_password":   user.Password != "",
			"has_google_id":  user.GoogleID != "",
			"email_verified": user.EmailVerified,
			"created_at":     user.CreatedAt,
			"updated_at":     user.UpdatedAt,
		},
	})
}

func (h *AuthHandlers) AddPasswordHandler(c *gin.Context) {
	var req AddPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request payload", err.Error())
		return
	}

	user, exists := GetUser(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated", nil)
		return
	}

	ctx := context.Background()

	var currentUser models.User
	err := h.db.DB.NewSelect().
		Model(&currentUser).
		Where("id = ?", user.ID).
		Scan(ctx)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_ERROR", "Failed to fetch user", err.Error())
		return
	}

	if currentUser.Password != "" {
		middleware.RespondWithError(c, http.StatusBadRequest, "PASSWORD_EXISTS", "User already has a password", nil)
		return
	}

	if err = ValidatePassword(req.Password); err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_PASSWORD", "Invalid password", err.Error())
		return
	}

	hashedPassword, err := HashPassword(req.Password)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "HASHING_ERROR", "Failed to hash password", err.Error())
		return
	}

	currentUser.Password = hashedPassword

	if err := h.db.Update(ctx, &currentUser); err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_ERROR", "Failed to update user with password", err.Error())
		return
	}

	middleware.RespondWithOK(c, gin.H{
		"message": "Password added successfully. You can now login with email and password.",
	})
}

func (h *AuthHandlers) SendOTPHandler(c *gin.Context) {
	authUser, exists := GetUser(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated", nil)
		return
	}

	ctx := context.Background()

	var user models.User
	err := h.db.DB.NewSelect().
		Model(&user).
		Where("id = ?", authUser.ID).
		Scan(ctx)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_ERROR", "Failed to fetch user", err.Error())
		return
	}

	// Check if user is already verified
	if user.EmailVerified {
		middleware.RespondWithError(c, http.StatusBadRequest, "ALREADY_VERIFIED", "Email is already verified", nil)
		return
	}

	otp, err := h.emailService.GenerateOTP()
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "OTP_GENERATION_ERROR", "Failed to generate OTP", err.Error())
		return
	}

	otpExpiry := h.emailService.GetOTPExpiry()

	user.Otp = otp
	user.OtpExpiresAt = &otpExpiry
	now := time.Now().UTC()
	user.OtpCreatedAt = &now

	if err := h.db.Update(ctx, &user); err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_ERROR", "Failed to save OTP", err.Error())
		return
	}

	if err := h.emailService.SendOTPEmail(user.Email, otp); err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "EMAIL_SENDING_ERROR", "Failed to send OTP email", err.Error())
		return
	}

	middleware.RespondWithOK(c, gin.H{
		"message": "OTP sent successfully to your email.",
	})
}

func (h *AuthHandlers) VerifyOTPHandler(c *gin.Context) {
	authUser, exists := GetUser(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated", nil)
		return
	}

	var req VerifyOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request payload", err.Error())
		return
	}

	ctx := context.Background()

	var user models.User
	err := h.db.DB.NewSelect().
		Model(&user).
		Where("id = ? AND otp = ? AND otp_expires_at > ?", authUser.ID, req.OTP, time.Now().UTC()).
		Scan(ctx)
	if err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_OTP", "Invalid or expired OTP", nil)
		return
	}

	user.EmailVerified = true
	user.Otp = ""
	user.OtpExpiresAt = nil
	user.OtpCreatedAt = nil

	if err := h.db.Update(ctx, &user); err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_ERROR", "Failed to update user verification status", err.Error())
		return
	}

	middleware.RespondWithOK(c, gin.H{
		"message": "Email verified successfully. You can now login.",
		"user": gin.H{
			"id":             user.ID.String(),
			"email":          user.Email,
			"name":           user.Name,
			"email_verified": user.EmailVerified,
		},
	})
}
