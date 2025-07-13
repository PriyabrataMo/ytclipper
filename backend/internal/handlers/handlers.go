package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/shubhamku044/ytclipper/internal/auth"
	"github.com/shubhamku044/ytclipper/internal/database"
	"github.com/shubhamku044/ytclipper/internal/middleware"
)

// UserInfo represents user information for API responses
type UserInfo struct {
	ID        string `json:"id"`
	Email     string `json:"email"`
	Name      string `json:"name,omitempty"`
	CreatedAt string `json:"created_at,omitempty"`
}

// Timestamp represents a video timestamp
type Timestamp struct {
	ID        string    `json:"id"`
	VideoID   string    `json:"video_id"`
	UserID    string    `json:"user_id"`
	Timestamp float64   `json:"timestamp"`
	Title     string    `json:"title"`
	Note      string    `json:"note"`
	Tags      []string  `json:"tags"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// CreateTimestampRequest represents the request body for creating a timestamp
type CreateTimestampRequest struct {
	VideoID   string   `json:"video_id" binding:"required"`
	Timestamp float64  `json:"timestamp" binding:"required"`
	Title     string   `json:"title"`
	Note      string   `json:"note"`
	Tags      []string `json:"tags"`
}

// HealthCheck returns the health status of the service
func HealthCheck(c *gin.Context) {
	middleware.RespondWithOK(c, gin.H{
		"status":    "healthy",
		"timestamp": time.Now().UTC(),
		"service":   "ytclipper-backend",
		"version":   "1.0.0",
	})
}

// DBHealthCheck returns the database health status
func DBHealthCheck(db *database.Database) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		status := "healthy"
		var err error

		if db != nil && db.DB != nil {
			err = db.Ping(ctx)
			if err != nil {
				status = "unhealthy"
			}
		} else {
			status = "disconnected"
		}

		if err != nil {
			middleware.RespondWithError(c, http.StatusServiceUnavailable, "DB_UNHEALTHY", "Database is not healthy", gin.H{
				"error": err.Error(),
			})
			return
		}

		middleware.RespondWithOK(c, gin.H{
			"status":    status,
			"timestamp": time.Now().UTC(),
			"database":  "postgresql",
		})
	}
}

// VerifyToken verifies the JWT token for extension authentication
func VerifyToken(c *gin.Context) {
	// Get user ID from context (set by JWT middleware)
	userID, exists := auth.GetUserID(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER_ID", "User ID not found in token", nil)
		return
	}

	// Get full claims if needed
	claims, exists := auth.GetClaims(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_CLAIMS", "Token claims not found", nil)
		return
	}

	// Create user info from claims
	user := UserInfo{
		ID:        userID,
		Email:     claims.RegisteredClaims.Subject, // In Auth0, subject is typically the user ID
		Name:      "",                              // We'd need to get this from the token's custom claims or from a user lookup
		CreatedAt: claims.RegisteredClaims.IssuedAt.Time.Format(time.RFC3339),
	}

	middleware.RespondWithOK(c, gin.H{
		"user":  user,
		"valid": true,
	})
}

// GetUserProfile returns the authenticated user's profile
func GetUserProfile(c *gin.Context) {
	// Get user ID from context (set by JWT middleware)
	userID, exists := auth.GetUserID(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER_ID", "User ID not found in token", nil)
		return
	}

	// Get full claims
	claims, exists := auth.GetClaims(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_CLAIMS", "Token claims not found", nil)
		return
	}

	// Create user profile from claims
	user := UserInfo{
		ID:        userID,
		Email:     claims.RegisteredClaims.Subject,
		Name:      "", // You might want to add custom claims for name
		CreatedAt: claims.RegisteredClaims.IssuedAt.Time.Format(time.RFC3339),
	}

	middleware.RespondWithOK(c, gin.H{
		"user": user,
		"token_info": gin.H{
			"issued_at":  claims.RegisteredClaims.IssuedAt.Time,
			"expires_at": claims.RegisteredClaims.ExpiresAt.Time,
			"issuer":     claims.RegisteredClaims.Issuer,
		},
	})
}

// CreateTimestamp creates a new timestamp for a video
func CreateTimestamp(c *gin.Context) {
	userID, exists := auth.GetUserID(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER_ID", "User ID not found", nil)
		return
	}

	var req CreateTimestampRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body", gin.H{
			"error": err.Error(),
		})
		return
	}

	// For now, we'll just return the timestamp with a generated ID
	// In a real implementation, you'd save this to the database
	timestamp := Timestamp{
		ID:        generateID(),
		VideoID:   req.VideoID,
		UserID:    userID,
		Timestamp: req.Timestamp,
		Title:     req.Title,
		Note:      req.Note,
		Tags:      req.Tags,
		CreatedAt: time.Now().UTC(),
		UpdatedAt: time.Now().UTC(),
	}

	middleware.RespondWithOK(c, gin.H{
		"timestamp": timestamp,
	})
}

// GetTimestamps retrieves timestamps for a specific video
func GetTimestamps(c *gin.Context) {
	userID, exists := auth.GetUserID(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER_ID", "User ID not found", nil)
		return
	}

	videoID := c.Param("videoId")
	if videoID == "" {
		middleware.RespondWithError(c, http.StatusBadRequest, "MISSING_VIDEO_ID", "Video ID is required", nil)
		return
	}

	// For now, return empty array
	// In a real implementation, you'd query the database
	timestamps := []Timestamp{}

	middleware.RespondWithOK(c, gin.H{
		"timestamps": timestamps,
		"video_id":   videoID,
		"user_id":    userID,
	})
}

// DeleteTimestamp deletes a specific timestamp
func DeleteTimestamp(c *gin.Context) {
	userID, exists := auth.GetUserID(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER_ID", "User ID not found", nil)
		return
	}

	timestampID := c.Param("id")
	if timestampID == "" {
		middleware.RespondWithError(c, http.StatusBadRequest, "MISSING_TIMESTAMP_ID", "Timestamp ID is required", nil)
		return
	}

	// For now, just return success
	// In a real implementation, you'd delete from the database
	middleware.RespondWithOK(c, gin.H{
		"message":      "Timestamp deleted successfully",
		"timestamp_id": timestampID,
		"user_id":      userID,
	})
}

// generateID generates a simple timestamp-based ID
// In production, you'd use a proper UUID generator
func generateID() string {
	return time.Now().Format("20060102150405") + "_" + time.Now().Format("000")
}
