package subscription

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/shubhamku044/ytclipper/internal/middleware"
	"github.com/shubhamku044/ytclipper/internal/models"
	"github.com/shubhamku044/ytclipper/internal/services"
)

type SubscriptionHandlers struct {
	subscriptionService *services.SubscriptionService
}

func NewSubscriptionHandlers(subscriptionService *services.SubscriptionService) *SubscriptionHandlers {
	return &SubscriptionHandlers{
		subscriptionService: subscriptionService,
	}
}

// GetUserSubscription returns the current user's subscription
func (h *SubscriptionHandlers) GetUserSubscription(c *gin.Context) {
	user, exists := getUser(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated", nil)
		return
	}

	ctx := context.Background()
	subscription, err := h.subscriptionService.GetUserSubscription(ctx, user.ID)
	if err != nil {
		// Return free plan if no subscription found
		plan := models.AvailablePlans["free"]
		middleware.RespondWithOK(c, gin.H{
			"subscription": gin.H{
				"plan_type": "free",
				"status":    "active",
				"plan":      plan,
			},
		})
		return
	}

	plan, exists := models.AvailablePlans[subscription.PlanType]
	if !exists {
		middleware.RespondWithError(c, http.StatusInternalServerError, "INVALID_PLAN", "Invalid plan type", nil)
		return
	}

	middleware.RespondWithOK(c, gin.H{
		"subscription": gin.H{
			"id":                   subscription.ID.String(),
			"plan_type":            subscription.PlanType,
			"status":               subscription.Status,
			"current_period_start": subscription.CurrentPeriodStart,
			"current_period_end":   subscription.CurrentPeriodEnd,
			"cancel_at_period_end": subscription.CancelAtPeriodEnd,
			"cancelled_at":         subscription.CancelledAt,
			"created_at":           subscription.CreatedAt,
			"plan":                 plan,
		},
	})
}

// GetUserFeatures returns the features available to the current user
func (h *SubscriptionHandlers) GetUserFeatures(c *gin.Context) {
	user, exists := getUser(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated", nil)
		return
	}

	ctx := context.Background()
	features, err := h.subscriptionService.GetUserSubscriptionFeatures(ctx, user.ID)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "FEATURES_ERROR", "Failed to get user features", err.Error())
		return
	}

	middleware.RespondWithOK(c, gin.H{
		"features": features,
	})
}

// ValidateCoupon validates a coupon code
func (h *SubscriptionHandlers) ValidateCoupon(c *gin.Context) {
	user, exists := getUser(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated", nil)
		return
	}

	var req struct {
		Code     string  `json:"code" binding:"required"`
		PlanType string  `json:"plan_type" binding:"required"`
		Amount   float64 `json:"amount" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request payload", err.Error())
		return
	}

	ctx := context.Background()
	coupon, discountAmount, err := h.subscriptionService.ValidateCoupon(ctx, req.Code, req.PlanType, req.Amount, user.ID)
	if err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_COUPON", err.Error(), nil)
		return
	}

	middleware.RespondWithOK(c, gin.H{
		"coupon": gin.H{
			"id":              coupon.ID.String(),
			"code":            coupon.Code,
			"name":            coupon.Name,
			"description":     coupon.Description,
			"discount_type":   coupon.DiscountType,
			"discount_value":  coupon.DiscountValue,
			"discount_amount": discountAmount,
			"final_amount":    req.Amount - discountAmount,
		},
	})
}

// GetAvailablePlans returns all available subscription plans
func (h *SubscriptionHandlers) GetAvailablePlans(c *gin.Context) {
	middleware.RespondWithOK(c, gin.H{
		"plans": models.AvailablePlans,
	})
}

// CancelSubscription cancels the current user's subscription
func (h *SubscriptionHandlers) CancelSubscription(c *gin.Context) {
	user, exists := getUser(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated", nil)
		return
	}

	ctx := context.Background()
	err := h.subscriptionService.CancelSubscription(ctx, user.ID)
	if err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "CANCEL_ERROR", err.Error(), nil)
		return
	}

	middleware.RespondWithOK(c, gin.H{
		"message": "Subscription cancelled successfully. You will continue to have access until the end of your current billing period.",
	})
}

// GetSubscriptionInvoices returns all invoices for the current user
func (h *SubscriptionHandlers) GetSubscriptionInvoices(c *gin.Context) {
	user, exists := getUser(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated", nil)
		return
	}

	ctx := context.Background()
	invoices, err := h.subscriptionService.GetSubscriptionInvoices(ctx, user.ID)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "INVOICES_ERROR", "Failed to get invoices", err.Error())
		return
	}

	middleware.RespondWithOK(c, gin.H{
		"invoices": invoices,
	})
}

// Helper function to get user from context (you'll need to implement this based on your auth middleware)
func getUser(c *gin.Context) (*models.User, bool) {
	// This should be implemented based on your authentication middleware
	// For now, returning nil - you'll need to adapt this to your auth system
	return nil, false
}
