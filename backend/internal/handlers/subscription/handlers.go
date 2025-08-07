package subscription

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/shubhamku044/ytclipper/internal/database"
	authhandlers "github.com/shubhamku044/ytclipper/internal/handlers/auth"
	"github.com/shubhamku044/ytclipper/internal/middleware"
	"github.com/shubhamku044/ytclipper/internal/models"
)

type SubscriptionHandlers struct {
	db *database.Database
}

func NewSubscriptionHandlers(db *database.Database) *SubscriptionHandlers {
	return &SubscriptionHandlers{
		db: db,
	}
}

func (h *SubscriptionHandlers) GetUserProfile(c *gin.Context) {
	userIDStr, exists := authhandlers.GetUserID(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER_ID", "User ID not found", nil)
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_USER_ID", "Invalid user ID format", gin.H{
			"error": err.Error(),
		})
		return
	}

	var user models.User
	err = h.db.DB.NewSelect().
		Model(&user).
		Where("id = ?", userID).
		Scan(context.Background(), &user)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_ERROR", "Failed to fetch user", gin.H{
			"error": err.Error(),
		})
		return
	}

	var subscription models.Subscription
	err = h.db.DB.NewSelect().
		Model(&subscription).
		Where("user_id = ? AND status = 'active'", userID).
		Scan(context.Background(), &subscription)
	if err != nil {
		farFuture := time.Now().AddDate(100, 0, 0)
		subscription = models.Subscription{
			UserID:           userID,
			PlanType:         "free",
			Status:           "active",
			CurrentPeriodEnd: &farFuture,
		}
	}

	var featureUsage []models.FeatureUsage
	err = h.db.DB.NewSelect().
		Model(&featureUsage).
		Where("user_id = ?", userID).
		Scan(context.Background(), &featureUsage)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_ERROR", "Failed to fetch feature usage", gin.H{
			"error": err.Error(),
		})
		return
	}

	if len(featureUsage) == 0 {
		err = h.initializeFeatureUsage(context.Background(), userID, subscription.PlanType)
		if err != nil {
			log.Printf("Warning: Failed to initialize feature usage: %v", err)
		} else {
			err = h.db.DB.NewSelect().
				Model(&featureUsage).
				Where("user_id = ?", userID).
				Scan(context.Background(), &featureUsage)
			if err != nil {
				log.Printf("Warning: Failed to re-fetch feature usage: %v", err)
			}
		}
	}

	usageMap := make(map[string]models.FeatureUsage)

	for _, usage := range featureUsage {
		usageMap[usage.FeatureName] = usage
	}

	isExpired := subscription.CurrentPeriodEnd != nil && time.Now().After(*subscription.CurrentPeriodEnd)

	isExceeded := false
	if subscription.PlanType == "free" {
		if videoUsage, exists := usageMap["videos"]; exists {
			if videoUsage.UsageLimit > 0 && videoUsage.CurrentUsage >= videoUsage.UsageLimit {
				isExceeded = true
			}
		}
	}

	planLimits := getPlanLimits(subscription.PlanType)

	usagePercentages := make(map[string]float64)
	for featureName, usage := range usageMap {
		if usage.UsageLimit > 0 {
			usagePercentages[featureName] = float64(usage.CurrentUsage) / float64(usage.UsageLimit) * 100
		}
	}

	response := gin.H{
		"user": gin.H{
			"id":      user.ID,
			"email":   user.Email,
			"name":    user.Name,
			"picture": user.Picture,
		},
		"subscription": gin.H{
			"plan_type":            subscription.PlanType,
			"status":               subscription.Status,
			"is_expired":           isExpired,
			"current_period_end":   subscription.CurrentPeriodEnd,
			"cancel_at_period_end": subscription.CancelAtPeriodEnd,
			"payment_provider":     subscription.PaymentProvider,
		},
		"usage": gin.H{
			"current_usage":     usageMap,
			"plan_limits":       planLimits,
			"usage_percentages": usagePercentages,
			"is_exceeded":       isExceeded,
		},
		"feature_access": gin.H{
			"can_add_videos":         canAddVideos(subscription, usageMap),
			"can_add_notes":          canAddNotes(subscription, usageMap),
			"can_generate_summaries": canGenerateSummaries(subscription, usageMap),
			"can_use_ai_features":    canUseAIFeatures(subscription, usageMap),
		},
	}

	middleware.RespondWithOK(c, response)
}

func (h *SubscriptionHandlers) PurchaseSubscription(c *gin.Context) {
	userIDStr, exists := authhandlers.GetUserID(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER_ID", "User ID not found", nil)
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_USER_ID", "Invalid user ID format", gin.H{
			"error": err.Error(),
		})
		return
	}

	var req struct {
		PlanType      string `json:"plan_type" binding:"required"`
		PaymentMethod string `json:"payment_method,omitempty"`
		CouponCode    string `json:"coupon_code,omitempty"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body", gin.H{
			"error": err.Error(),
		})
		return
	}

	validPlans := map[string]bool{
		"free":      true,
		"monthly":   true,
		"quarterly": true,
		"annual":    true,
	}

	if !validPlans[req.PlanType] {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_PLAN", "Invalid plan type", gin.H{
			"valid_plans": []string{"free", "monthly", "quarterly", "annual"},
		})
		return
	}

	ctx := context.Background()

	var existingSubscription models.Subscription
	err = h.db.DB.NewSelect().
		Model(&existingSubscription).
		Where("user_id = ? AND status = 'active'", userID).
		Scan(ctx, &existingSubscription)

	if err == nil && existingSubscription.ID != uuid.Nil {
		now := time.Now().UTC()
		var periodEnd time.Time

		switch req.PlanType {
		case "free":
			periodEnd = now.AddDate(100, 0, 0)
		case "monthly":
			periodEnd = now.AddDate(0, 1, 0)
		case "quarterly":
			periodEnd = now.AddDate(0, 3, 0)
		case "annual":
			periodEnd = now.AddDate(1, 0, 0)
		}

		_, err = h.db.DB.NewUpdate().
			Model(&existingSubscription).
			Set("plan_type = ?", req.PlanType).
			Set("current_period_start = ?", now).
			Set("current_period_end = ?", periodEnd).
			Set("updated_at = ?", now).
			Where("id = ?", existingSubscription.ID).
			Exec(ctx)

		if err != nil {
			middleware.RespondWithError(c, http.StatusInternalServerError, "DB_ERROR", "Failed to update subscription", gin.H{
				"error": err.Error(),
			})
			return
		}

		err = h.resetFeatureUsage(ctx, userID)
		if err != nil {
			log.Printf("Warning: Failed to reset feature usage: %v", err)
		}

		middleware.RespondWithOK(c, gin.H{
			"subscription_id":    existingSubscription.ID.String(),
			"status":             "active",
			"plan_type":          req.PlanType,
			"current_period_end": periodEnd.Format(time.RFC3339),
		})
		return
	}

	now := time.Now().UTC()
	var periodEnd time.Time

	switch req.PlanType {
	case "free":
		periodEnd = now.AddDate(100, 0, 0)
	case "monthly":
		periodEnd = now.AddDate(0, 1, 0)
	case "quarterly":
		periodEnd = now.AddDate(0, 3, 0)
	case "annual":
		periodEnd = now.AddDate(1, 0, 0)
	}

	newSubscription := &models.Subscription{
		UserID:             userID,
		PlanType:           req.PlanType,
		Status:             "active",
		CurrentPeriodStart: &now,
		CurrentPeriodEnd:   &periodEnd,
		CreatedAt:          now,
		UpdatedAt:          now,
	}

	_, err = h.db.DB.NewInsert().
		Model(newSubscription).
		Exec(ctx)

	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_ERROR", "Failed to create subscription", gin.H{
			"error": err.Error(),
		})
		return
	}

	err = h.initializeFeatureUsage(ctx, userID, req.PlanType)
	if err != nil {
		log.Printf("Warning: Failed to initialize feature usage: %v", err)
	}

	middleware.RespondWithOK(c, gin.H{
		"subscription_id":    newSubscription.ID.String(),
		"status":             "active",
		"plan_type":          req.PlanType,
		"current_period_end": periodEnd.Format(time.RFC3339),
	})
}

func (h *SubscriptionHandlers) resetFeatureUsage(ctx context.Context, userID uuid.UUID) error {
	_, err := h.db.DB.NewUpdate().
		Model((*models.FeatureUsage)(nil)).
		Set("current_usage = ?", 0).
		Set("updated_at = ?", time.Now().UTC()).
		Where("user_id = ?", userID).
		Exec(ctx)
	return err
}

func (h *SubscriptionHandlers) initializeFeatureUsage(ctx context.Context, userID uuid.UUID, planType string) error {
	now := time.Now().UTC()
	planLimits := getPlanLimits(planType)

	for featureName, limit := range planLimits {
		featureUsage := &models.FeatureUsage{
			UserID:       userID,
			FeatureName:  featureName,
			CurrentUsage: 0,
			UsageLimit:   limit,
			ResetDate:    &now,
			CreatedAt:    now,
			UpdatedAt:    now,
		}

		_, err := h.db.DB.NewInsert().
			Model(featureUsage).
			On("CONFLICT (user_id, feature_name) DO UPDATE SET").
			Set("usage_limit = EXCLUDED.usage_limit").
			Set("updated_at = EXCLUDED.updated_at").
			Exec(ctx)

		if err != nil {
			return fmt.Errorf("failed to initialize feature usage for %s: %w", featureName, err)
		}
	}

	return nil
}

func getPlanLimits(planType string) map[string]int {
	switch planType {
	case "free":
		return map[string]int{
			"videos":       5,
			"notes":        40,
			"ai_summaries": 3,
			"ai_questions": 10,
		}
	case "monthly":
		return map[string]int{
			"videos":       50,
			"notes":        200,
			"ai_summaries": 50,
			"ai_questions": 200,
		}
	case "quarterly":
		return map[string]int{
			"videos":       150,
			"notes":        600,
			"ai_summaries": 150,
			"ai_questions": 600,
		}
	case "annual":
		return map[string]int{
			"videos":       500,
			"notes":        2000,
			"ai_summaries": 500,
			"ai_questions": 2000,
		}
	default:
		return map[string]int{
			"videos":       5,
			"notes":        40,
			"ai_summaries": 3,
			"ai_questions": 10,
		}
	}
}

func canAddVideos(subscription models.Subscription, usageMap map[string]models.FeatureUsage) bool {
	if subscription.PlanType != "free" {
		return true
	}

	if usage, exists := usageMap["videos"]; exists {
		return usage.CurrentUsage < usage.UsageLimit
	}
	return true
}

func canAddNotes(subscription models.Subscription, usageMap map[string]models.FeatureUsage) bool {
	if subscription.PlanType != "free" {
		return true
	}

	if usage, exists := usageMap["notes"]; exists {
		return usage.CurrentUsage < usage.UsageLimit
	}
	return true
}

func canGenerateSummaries(subscription models.Subscription, usageMap map[string]models.FeatureUsage) bool {
	if subscription.PlanType != "free" {
		return true
	}

	if usage, exists := usageMap["ai_summaries"]; exists {
		return usage.CurrentUsage < usage.UsageLimit
	}
	return true
}

func canUseAIFeatures(subscription models.Subscription, usageMap map[string]models.FeatureUsage) bool {
	if subscription.PlanType != "free" {
		return true
	}

	if usage, exists := usageMap["ai_questions"]; exists {
		return usage.CurrentUsage < usage.UsageLimit
	}
	return true
}
