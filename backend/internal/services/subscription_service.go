package services

import (
	"context"
	"fmt"
	"math"
	"time"

	"github.com/google/uuid"
	"github.com/shubhamku044/ytclipper/internal/database"
	"github.com/shubhamku044/ytclipper/internal/models"
)

type SubscriptionService struct {
	DB *database.Database
}

func NewSubscriptionService(db *database.Database) *SubscriptionService {
	return &SubscriptionService{
		DB: db,
	}
}

// GetUserSubscription returns the current active subscription for a user
func (s *SubscriptionService) GetUserSubscription(ctx context.Context, userID uuid.UUID) (*models.Subscription, error) {
	var subscription models.Subscription
	err := s.DB.DB.NewSelect().
		Model(&subscription).
		Where("user_id = ? AND status = 'active'", userID).
		Order("created_at DESC").
		Limit(1).
		Scan(ctx)

	if err != nil {
		return nil, fmt.Errorf("failed to get user subscription: %w", err)
	}

	return &subscription, nil
}

// CreateSubscription creates a new subscription for a user
func (s *SubscriptionService) CreateSubscription(ctx context.Context, userID uuid.UUID, planType string, stripeSubscriptionID *string, stripeCustomerID *string) (*models.Subscription, error) {
	// Check if user already has an active subscription
	existingSub, err := s.GetUserSubscription(ctx, userID)
	if err == nil && existingSub != nil {
		// Cancel existing subscription
		existingSub.Status = "cancelled"
		existingSub.CancelledAt = &time.Time{}
		if err := s.DB.Update(ctx, existingSub); err != nil {
			return nil, fmt.Errorf("failed to cancel existing subscription: %w", err)
		}
	}

	// Calculate period dates
	now := time.Now().UTC()
	var periodEnd time.Time
	switch planType {
	case "monthly":
		periodEnd = now.AddDate(0, 1, 0)
	case "quarterly":
		periodEnd = now.AddDate(0, 3, 0)
	case "annual":
		periodEnd = now.AddDate(1, 0, 0)
	default:
		periodEnd = now.AddDate(100, 0, 0) // Free plan - far future
	}

	subscription := &models.Subscription{
		UserID:   userID,
		PlanType: planType,
		Status:   "active",
		// StripeSubscriptionID: stripeSubscriptionID,
		// StripeCustomerID:     stripeCustomerID,
		CurrentPeriodStart: &now,
		CurrentPeriodEnd:   &periodEnd,
	}

	if err := s.DB.Create(ctx, subscription); err != nil {
		return nil, fmt.Errorf("failed to create subscription: %w", err)
	}

	return subscription, nil
}

// ValidateCoupon validates a coupon code and returns discount information
func (s *SubscriptionService) ValidateCoupon(ctx context.Context, code string, planType string, amount float64, userID uuid.UUID) (*models.Coupon, float64, error) {
	var coupon models.Coupon
	err := s.DB.DB.NewSelect().
		Model(&coupon).
		Where("code = ? AND is_active = true", code).
		Scan(ctx)

	if err != nil {
		return nil, 0, fmt.Errorf("invalid coupon code")
	}

	// Check if coupon is valid
	now := time.Now().UTC()
	if now.Before(coupon.ValidFrom) {
		return nil, 0, fmt.Errorf("coupon not yet valid")
	}

	if coupon.ValidUntil != nil && now.After(*coupon.ValidUntil) {
		return nil, 0, fmt.Errorf("coupon has expired")
	}

	// Check usage limits
	if coupon.MaxUses != nil && coupon.UsedCount >= *coupon.MaxUses {
		return nil, 0, fmt.Errorf("coupon usage limit exceeded")
	}

	// Check if user has already used this coupon
	var usage models.CouponUsage
	err = s.DB.DB.NewSelect().
		Model(&usage).
		Where("user_id = ? AND coupon_id = ?", userID, coupon.ID).
		Scan(ctx)

	if err == nil {
		return nil, 0, fmt.Errorf("coupon already used by this user")
	}

	// Check minimum amount
	if amount < coupon.MinAmount {
		return nil, 0, fmt.Errorf("minimum amount not met for coupon")
	}

	// Check if coupon applies to this plan type
	if len(coupon.ApplicablePlans) > 0 {
		planApplicable := false
		for _, plan := range coupon.ApplicablePlans {
			if plan == planType {
				planApplicable = true
				break
			}
		}
		if !planApplicable {
			return nil, 0, fmt.Errorf("coupon not applicable to this plan")
		}
	}

	// Calculate discount amount
	var discountAmount float64
	if coupon.DiscountType == "percentage" {
		discountAmount = amount * (coupon.DiscountValue / 100.0)
	} else {
		discountAmount = coupon.DiscountValue
	}

	// Ensure discount doesn't exceed the amount
	discountAmount = math.Min(discountAmount, amount)

	return &coupon, discountAmount, nil
}

// ApplyCoupon applies a coupon to a subscription and records the usage
func (s *SubscriptionService) ApplyCoupon(ctx context.Context, userID uuid.UUID, subscriptionID uuid.UUID, couponCode string, planType string, amount float64) (*models.Coupon, float64, error) {
	coupon, discountAmount, err := s.ValidateCoupon(ctx, couponCode, planType, amount, userID)
	if err != nil {
		return nil, 0, err
	}

	// Record coupon usage
	usage := &models.CouponUsage{
		UserID:         userID,
		CouponID:       coupon.ID,
		SubscriptionID: &subscriptionID,
		DiscountAmount: discountAmount,
	}

	if err := s.DB.Create(ctx, usage); err != nil {
		return nil, 0, fmt.Errorf("failed to record coupon usage: %w", err)
	}

	// Update coupon usage count
	coupon.UsedCount++
	if err := s.DB.Update(ctx, coupon); err != nil {
		return nil, 0, fmt.Errorf("failed to update coupon usage count: %w", err)
	}

	return coupon, discountAmount, nil
}

// GetUserSubscriptionFeatures returns the features available to a user based on their subscription
func (s *SubscriptionService) GetUserSubscriptionFeatures(ctx context.Context, userID uuid.UUID) (map[string]interface{}, error) {
	subscription, err := s.GetUserSubscription(ctx, userID)
	if err != nil {
		// Return free plan features if no subscription found
		plan := models.AvailablePlans["free"]
		return map[string]interface{}{
			"plan_type": "free",
			"features":  plan.Features,
			"limits": map[string]interface{}{
				"videos":          5,
				"notes_per_video": 8,
				"ai_summaries":    true,
				"custom_tags":     false,
				"export":          false,
				"analytics":       false,
				"api_access":      false,
			},
		}, nil
	}

	plan, exists := models.AvailablePlans[subscription.PlanType]
	if !exists {
		return nil, fmt.Errorf("invalid plan type: %s", subscription.PlanType)
	}

	features := map[string]interface{}{
		"plan_type": subscription.PlanType,
		"features":  plan.Features,
		"limits":    s.getPlanLimits(subscription.PlanType),
	}

	return features, nil
}

// getPlanLimits returns the limits for a given plan type
func (s *SubscriptionService) getPlanLimits(planType string) map[string]interface{} {
	switch planType {
	case "free":
		return map[string]interface{}{
			"videos":          5,
			"notes_per_video": 8,
			"ai_summaries":    true,
			"custom_tags":     false,
			"export":          false,
			"analytics":       false,
			"api_access":      false,
		}
	case "monthly", "quarterly", "annual":
		return map[string]interface{}{
			"videos":          -1, // unlimited
			"notes_per_video": -1, // unlimited
			"ai_summaries":    true,
			"custom_tags":     true,
			"export":          true,
			"analytics":       true,
			"api_access":      true,
		}
	default:
		return map[string]interface{}{
			"videos":          0,
			"notes_per_video": 0,
			"ai_summaries":    false,
			"custom_tags":     false,
			"export":          false,
			"analytics":       false,
			"api_access":      false,
		}
	}
}

// CancelSubscription cancels a user's subscription
func (s *SubscriptionService) CancelSubscription(ctx context.Context, userID uuid.UUID) error {
	subscription, err := s.GetUserSubscription(ctx, userID)
	if err != nil {
		return fmt.Errorf("no active subscription found")
	}

	subscription.Status = "cancelled"
	subscription.CancelledAt = &time.Time{}
	subscription.CancelAtPeriodEnd = true

	if err := s.DB.Update(ctx, subscription); err != nil {
		return fmt.Errorf("failed to cancel subscription: %w", err)
	}

	return nil
}

// GetSubscriptionInvoices returns all invoices for a user's subscription
func (s *SubscriptionService) GetSubscriptionInvoices(ctx context.Context, userID uuid.UUID) ([]models.SubscriptionInvoice, error) {
	var invoices []models.SubscriptionInvoice
	err := s.DB.DB.NewSelect().
		Model(&invoices).
		Join("JOIN subscriptions s ON s.id = subscription_invoices.subscription_id").
		Where("s.user_id = ?", userID).
		Order("billing_date DESC").
		Scan(ctx)

	if err != nil {
		return nil, fmt.Errorf("failed to get subscription invoices: %w", err)
	}

	return invoices, nil
}
