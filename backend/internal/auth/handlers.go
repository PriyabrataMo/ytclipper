package auth

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/shubhamku044/ytclipper/internal/middleware"
	"gorm.io/gorm"

	"github.com/shubhamku044/ytclipper/internal/models"
)

type AuthHandlers struct {
	googleService  *GoogleOAuthService
	authMiddleware *AuthMiddleware
	jwtService     *JWTService
	emailService   *EmailService
	db             *gorm.DB
}

func NewAuthHandlers(googleService *GoogleOAuthService, authMiddleware *AuthMiddleware, jwtService *JWTService, emailService *EmailService, db *gorm.DB) *AuthHandlers {
	return &AuthHandlers{
		googleService:  googleService,
		authMiddleware: authMiddleware,
		jwtService:     jwtService,
		emailService:   emailService,
		db:             db,
	}
}

// GetCurrentUser returns the current authenticated user
func (h *AuthHandlers) GetCurrentUser() gin.HandlerFunc {
	return h.authMiddleware.RequireAuth()
}

func (h *AuthHandlers) GetCurrentUserHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		user, exists := GetUser(c)
		if !exists {
			middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER", "No user found", nil)
			return
		}

		// Determine available authentication methods
		authMethods := []string{}
		if user.GoogleID != "" {
			authMethods = append(authMethods, "google")
		}
		if user.Password != "" {
			authMethods = append(authMethods, "password")
		}

		// Determine primary provider
		primaryProvider := "password"
		if user.Provider != nil {
			primaryProvider = *user.Provider
		}

		userResponse := gin.H{
			"id":                 user.ID,
			"email":              user.Email,
			"name":               user.Name,
			"picture":            user.Picture,
			"email_verified":     user.EmailVerified,
			"primary_provider":   primaryProvider,
			"auth_methods":       authMethods,
			"has_password":       user.Password != "",
			"has_google_account": user.GoogleID != "",
			"created_at":         user.CreatedAt,
			"updated_at":         user.UpdatedAt,
		}

		middleware.RespondWithOK(c, userResponse)
	}
}

// GetAccessToken returns the current access token (for API usage)
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

// SetupAuthRoutes sets up all authentication routes
func (h *AuthHandlers) SetupAuthRoutes(r *gin.Engine) {
	auth := r.Group("/auth")
	{
		// Google OAuth routes
		auth.GET("/google/login", h.googleService.LoginHandler())
		auth.GET("/google/callback", h.googleService.CallbackHandler())

		// Email/password authentication routes
		auth.POST("/register", h.RegisterHandler)
		auth.POST("/login", h.LoginHandler)
		auth.POST("/forgot-password", h.ForgotPasswordHandler)
		auth.POST("/reset-password", h.ResetPasswordHandler)
		auth.POST("/verify-email", h.VerifyEmailHandler)

		// Account linking routes
		auth.POST("/add-password", h.authMiddleware.RequireAuth(), h.AddPasswordHandler)

		// Authentication management
		auth.POST("/logout", h.googleService.LogoutHandler())
		auth.POST("/refresh", h.googleService.RefreshTokenHandler())

		// User info routes (require authentication)
		auth.GET("/me", h.authMiddleware.RequireAuth(), h.GetCurrentUserHandler())
		auth.GET("/token", h.authMiddleware.RequireAuth(), h.GetAccessToken())
	}
}

// RegisterRequest represents the registration request payload
type RegisterRequest struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

// LoginRequest represents the login request payload
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// ForgotPasswordRequest represents the forgot password request payload
type ForgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// ResetPasswordRequest represents the reset password request payload
type ResetPasswordRequest struct {
	Token    string `json:"token" binding:"required"`
	Password string `json:"password" binding:"required,min=8"`
}

// VerifyEmailRequest represents the email verification request payload
type VerifyEmailRequest struct {
	Token string `json:"token" binding:"required"`
}

// AddPasswordRequest represents the request to add password authentication
type AddPasswordRequest struct {
	Password string `json:"password" binding:"required,min=8"`
}

// RegisterHandler handles user registration with email and password
func (h *AuthHandlers) RegisterHandler(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if user already exists
	var existingUser models.User
	if err := h.db.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "User already exists"})
		return
	}

	// Validate password strength
	if err := ValidatePassword(req.Password); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Hash password
	hashedPassword, err := HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Generate email verification token
	verificationToken, err := h.emailService.GenerateToken()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate verification token"})
		return
	}

	// Create user
	user := models.User{
		Name:                    req.Name,
		Email:                   req.Email,
		Password:                hashedPassword,
		EmailVerified:           false,
		EmailVerificationToken:  verificationToken,
		EmailVerificationExpiry: &[]time.Time{h.emailService.GetTokenExpiry()}[0],
	}

	if err := h.db.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	// Send verification email
	if err := h.emailService.SendVerificationEmail(user.Email, verificationToken); err != nil {
		// Log error but don't fail registration
		// In production, you might want to queue this for retry
		c.JSON(http.StatusCreated, gin.H{
			"message": "User created successfully, but verification email failed to send",
			"user":    user,
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "User created successfully. Please check your email to verify your account.",
		"user":    user,
	})
}

// LoginHandler handles user login with email and password
func (h *AuthHandlers) LoginHandler(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Find user by email
	var user models.User
	if err := h.db.Where("email = ?", req.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Check if user has a password (not OAuth-only user)
	if user.Password == "" {
		// Check if user has Google account linked
		if user.GoogleID != "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":              "This email is associated with a Google account. Please login with Google or add a password to your account.",
				"has_google_account": true,
			})
		} else {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "No password set for this account. Please use Google login or reset your password.",
			})
		}
		return
	}

	// Verify password
	if err := CheckPassword(req.Password, user.Password); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Check if email is verified
	if !user.EmailVerified {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Please verify your email before logging in"})
		return
	}

	// Generate JWT tokens
	accessToken, err := h.jwtService.GenerateAccessToken(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate access token"})
		return
	}

	refreshToken, err := h.jwtService.GenerateRefreshToken(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate refresh token"})
		return
	}

	// Set HTTP-only cookies
	h.jwtService.SetTokenCookies(c, accessToken, refreshToken)

	c.JSON(http.StatusOK, gin.H{
		"message": "Login successful",
		"user":    user,
	})
}

// ForgotPasswordHandler handles password reset requests
func (h *AuthHandlers) ForgotPasswordHandler(c *gin.Context) {
	var req ForgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Find user by email
	var user models.User
	if err := h.db.Where("email = ?", req.Email).First(&user).Error; err != nil {
		// Don't reveal if email exists or not
		c.JSON(http.StatusOK, gin.H{
			"message": "If the email exists, a password reset link has been sent",
		})
		return
	}

	// Generate password reset token
	resetToken, err := h.emailService.GenerateToken()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate reset token"})
		return
	}

	// Update user with reset token
	expiry := h.emailService.GetTokenExpiry()
	if err := h.db.Model(&user).Updates(models.User{
		PasswordResetToken:  resetToken,
		PasswordResetExpiry: &expiry,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save reset token"})
		return
	}

	// Send password reset email
	if err := h.emailService.SendPasswordResetEmail(user.Email, resetToken); err != nil {
		// Log error but don't fail request
		c.JSON(http.StatusOK, gin.H{
			"message": "Password reset email failed to send, please try again",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "If the email exists, a password reset link has been sent",
	})
}

// ResetPasswordHandler handles password reset with token
func (h *AuthHandlers) ResetPasswordHandler(c *gin.Context) {
	var req ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Find user by reset token
	var user models.User
	if err := h.db.Where("password_reset_token = ?", req.Token).First(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or expired reset token"})
		return
	}

	// Check if token is expired
	if h.emailService.IsTokenExpired(user.PasswordResetExpiry) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Reset token has expired"})
		return
	}

	// Validate new password
	if err := ValidatePassword(req.Password); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Hash new password
	hashedPassword, err := HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Update user password and clear reset token
	if err := h.db.Model(&user).Updates(models.User{
		Password:            hashedPassword,
		PasswordResetToken:  "",
		PasswordResetExpiry: nil,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Password reset successful",
	})
}

// VerifyEmailHandler handles email verification
func (h *AuthHandlers) VerifyEmailHandler(c *gin.Context) {
	var req VerifyEmailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Find user by verification token
	var user models.User
	if err := h.db.Where("email_verification_token = ?", req.Token).First(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or expired verification token"})
		return
	}

	// Check if token is expired
	if h.emailService.IsTokenExpired(user.EmailVerificationExpiry) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Verification token has expired"})
		return
	}

	// Update user as verified and clear verification token
	if err := h.db.Model(&user).Updates(models.User{
		EmailVerified:           true,
		EmailVerificationToken:  "",
		EmailVerificationExpiry: nil,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify email"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Email verified successfully",
	})
}

// AddPasswordHandler allows users to add password authentication to their Google-only accounts
func (h *AuthHandlers) AddPasswordHandler(c *gin.Context) {
	var req AddPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user ID from context
	userIDStr, exists := GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Find user in database
	var user models.User
	if err := h.db.Where("id = ?", userIDStr).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Check if user already has a password
	if user.Password != "" {
		c.JSON(http.StatusConflict, gin.H{"error": "User already has password authentication"})
		return
	}

	// Validate password strength
	if err := ValidatePassword(req.Password); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Hash password
	hashedPassword, err := HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Update user with password
	if err := h.db.Model(&user).Update("password", hashedPassword).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Password added successfully. You can now login with email and password.",
	})
}
