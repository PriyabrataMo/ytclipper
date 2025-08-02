package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/shubhamku044/ytclipper/internal/services"
)

// FeatureAccessMiddleware creates a middleware that checks if a user can access a specific feature
func FeatureAccessMiddleware(featureAccessService *services.FeatureAccessService, featureName string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get user from context (you'll need to adapt this to your auth system)
		user, exists := GetUser(c)
		if !exists {
			RespondWithError(c, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated", nil)
			c.Abort()
			return
		}

		// Check feature access
		canAccess, err := featureAccessService.CheckFeatureAccess(c.Request.Context(), user.ID, featureName)
		if err != nil {
			RespondWithError(c, http.StatusInternalServerError, "FEATURE_CHECK_ERROR", "Failed to check feature access", err.Error())
			c.Abort()
			return
		}

		if !canAccess {
			RespondWithError(c, http.StatusForbidden, "FEATURE_ACCESS_DENIED", "Feature access denied. Please upgrade your plan.", nil)
			c.Abort()
			return
		}

		c.Next()
	}
}

// UsageLimitMiddleware creates a middleware that checks usage limits and increments usage
func UsageLimitMiddleware(featureAccessService *services.FeatureAccessService, featureName string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get user from context
		user, exists := GetUser(c)
		if !exists {
			RespondWithError(c, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated", nil)
			c.Abort()
			return
		}

		// Check if user can access the feature
		canAccess, err := featureAccessService.CheckFeatureAccess(c.Request.Context(), user.ID, featureName)
		if err != nil {
			RespondWithError(c, http.StatusInternalServerError, "FEATURE_CHECK_ERROR", "Failed to check feature access", err.Error())
			c.Abort()
			return
		}

		if !canAccess {
			RespondWithError(c, http.StatusForbidden, "USAGE_LIMIT_EXCEEDED", "Usage limit exceeded. Please upgrade your plan.", nil)
			c.Abort()
			return
		}

		// Increment usage after successful operation
		c.Next()

		// Only increment if the request was successful
		if c.Writer.Status() < 400 {
			if err := featureAccessService.IncrementFeatureUsage(c.Request.Context(), user.ID, featureName); err != nil {
				// Log error but don't fail the request
				c.Error(err)
			}
		}
	}
}

// GetUser is a helper function to get user from context
// You'll need to adapt this to your authentication system
func GetUser(c *gin.Context) (*struct{ ID uuid.UUID }, bool) {
	// This should be implemented based on your authentication middleware
	// For now, returning a placeholder - you'll need to adapt this
	return nil, false
}
