package subscription

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/shubhamku044/ytclipper/internal/middleware"
	"github.com/shubhamku044/ytclipper/internal/services"
)

type FeatureHandlers struct {
	featureAccessService *services.FeatureAccessService
}

func NewFeatureHandlers(featureAccessService *services.FeatureAccessService) *FeatureHandlers {
	return &FeatureHandlers{
		featureAccessService: featureAccessService,
	}
}

// GetUserFeatureUsage returns the current usage for all features
func (h *FeatureHandlers) GetUserFeatureUsage(c *gin.Context) {
	user, exists := getUser(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated", nil)
		return
	}

	ctx := context.Background()
	usage, err := h.featureAccessService.GetAllFeatureUsage(ctx, user.ID)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "USAGE_ERROR", "Failed to get feature usage", err.Error())
		return
	}

	middleware.RespondWithOK(c, gin.H{
		"feature_usage": usage,
	})
}

// CheckFeatureAccess checks if user can access a specific feature
func (h *FeatureHandlers) CheckFeatureAccess(c *gin.Context) {
	user, exists := getUser(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated", nil)
		return
	}

	var req struct {
		FeatureName string `json:"feature_name" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request payload", err.Error())
		return
	}

	ctx := context.Background()
	canAccess, err := h.featureAccessService.CheckFeatureAccess(ctx, user.ID, req.FeatureName)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "FEATURE_CHECK_ERROR", "Failed to check feature access", err.Error())
		return
	}

	usage, err := h.featureAccessService.GetFeatureUsage(ctx, user.ID, req.FeatureName)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "USAGE_ERROR", "Failed to get feature usage", err.Error())
		return
	}

	middleware.RespondWithOK(c, gin.H{
		"feature_name": req.FeatureName,
		"can_access":   canAccess,
		"usage":        usage,
	})
}

// Example handler that requires video feature access
func (h *FeatureHandlers) CreateVideo(c *gin.Context) {
	user, exists := getUser(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated", nil)
		return
	}

	// Check if user can create videos
	ctx := context.Background()
	canAccess, err := h.featureAccessService.CheckFeatureAccess(ctx, user.ID, "videos")
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "FEATURE_CHECK_ERROR", "Failed to check feature access", err.Error())
		return
	}

	if !canAccess {
		middleware.RespondWithError(c, http.StatusForbidden, "VIDEO_LIMIT_EXCEEDED", "Video limit exceeded. Please upgrade your plan to create more videos.", nil)
		return
	}

	// Your video creation logic here
	// ...

	// Increment usage after successful creation
	if err := h.featureAccessService.IncrementFeatureUsage(ctx, user.ID, "videos"); err != nil {
		// Log error but don't fail the request
		c.Error(err)
	}

	middleware.RespondWithOK(c, gin.H{
		"message": "Video created successfully",
	})
}

// Example handler that requires AI summaries feature access
func (h *FeatureHandlers) GenerateAISummary(c *gin.Context) {
	user, exists := getUser(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated", nil)
		return
	}

	// Check if user can use AI summaries
	ctx := context.Background()
	canAccess, err := h.featureAccessService.CheckFeatureAccess(ctx, user.ID, "ai_summaries")
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "FEATURE_CHECK_ERROR", "Failed to check feature access", err.Error())
		return
	}

	if !canAccess {
		middleware.RespondWithError(c, http.StatusForbidden, "AI_FEATURE_DENIED", "AI summaries are not available in your current plan. Please upgrade to access this feature.", nil)
		return
	}

	// Your AI summary generation logic here
	// ...

	middleware.RespondWithOK(c, gin.H{
		"message": "AI summary generated successfully",
	})
}

// Example handler that requires custom tags feature access
func (h *FeatureHandlers) CreateCustomTag(c *gin.Context) {
	user, exists := getUser(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated", nil)
		return
	}

	// Check if user can create custom tags
	ctx := context.Background()
	canAccess, err := h.featureAccessService.CheckFeatureAccess(ctx, user.ID, "custom_tags")
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "FEATURE_CHECK_ERROR", "Failed to check feature access", err.Error())
		return
	}

	if !canAccess {
		middleware.RespondWithError(c, http.StatusForbidden, "CUSTOM_TAGS_DENIED", "Custom tags are not available in your current plan. Please upgrade to access this feature.", nil)
		return
	}

	// Your custom tag creation logic here
	// ...

	middleware.RespondWithOK(c, gin.H{
		"message": "Custom tag created successfully",
	})
}
