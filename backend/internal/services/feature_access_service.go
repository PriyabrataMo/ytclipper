package services

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/shubhamku044/ytclipper/internal/database"
	"github.com/shubhamku044/ytclipper/internal/models"
)

type FeatureAccessService struct {
	db *database.Database
}

func NewFeatureAccessService(db *database.Database) *FeatureAccessService {
	return &FeatureAccessService{
		db: db,
	}
}

// CheckFeatureAccess checks if a user can access a specific feature
func (f *FeatureAccessService) CheckFeatureAccess(ctx context.Context, userID uuid.UUID, featureName string) (bool, error) {
	// Get user's subscription
	subscription, err := f.getUserSubscription(ctx, userID)
	if err != nil {
		return false, fmt.Errorf("failed to get user subscription: %w", err)
	}

	// Get plan limits
	plan, exists := models.AvailablePlans[subscription.PlanType]
	if !exists {
		return false, fmt.Errorf("invalid plan type: %s", subscription.PlanType)
	}

	// Check if feature is enabled for the plan
	limits := plan.Limits
	featureEnabled, exists := limits[featureName]
	if !exists {
		return false, fmt.Errorf("feature %s not found in plan limits", featureName)
	}

	// If feature is disabled (false), return false
	if enabled, ok := featureEnabled.(bool); ok && !enabled {
		return false, nil
	}

	// If feature has usage limits, check current usage
	if limit, ok := featureEnabled.(int); ok && limit > 0 {
		return f.checkUsageLimit(ctx, userID, featureName, limit)
	}

	// If limit is -1 (unlimited) or feature is enabled, return true
	return true, nil
}

// IncrementFeatureUsage increments the usage count for a feature
func (f *FeatureAccessService) IncrementFeatureUsage(ctx context.Context, userID uuid.UUID, featureName string) error {
	// First check if user can access the feature
	canAccess, err := f.CheckFeatureAccess(ctx, userID, featureName)
	if err != nil {
		return fmt.Errorf("failed to check feature access: %w", err)
	}

	if !canAccess {
		return fmt.Errorf("feature access denied for %s", featureName)
	}

	// Get current usage
	var usage models.FeatureUsage
	err = f.db.DB.NewSelect().
		Model(&usage).
		Where("user_id = ? AND feature_name = ?", userID, featureName).
		Scan(ctx)

	if err != nil {
		// Create new usage record if it doesn't exist
		plan, _ := models.AvailablePlans["free"] // Default to free plan limits
		limits := plan.Limits
		limit := -1 // Default to unlimited
		if l, exists := limits[featureName]; exists {
			if limitVal, ok := l.(int); ok {
				limit = limitVal
			}
		}

		usage = models.FeatureUsage{
			UserID:       userID,
			FeatureName:  featureName,
			CurrentUsage: 1,
			UsageLimit:   limit,
			ResetDate:    f.getNextResetDate(),
		}

		if err := f.db.Create(ctx, &usage); err != nil {
			return fmt.Errorf("failed to create feature usage: %w", err)
		}
		return nil
	}

	// Check if usage needs to be reset
	if usage.ResetDate != nil && time.Now().UTC().After(*usage.ResetDate) {
		usage.CurrentUsage = 1
		usage.ResetDate = f.getNextResetDate()
	} else {
		usage.CurrentUsage++
	}

	if err := f.db.Update(ctx, &usage); err != nil {
		return fmt.Errorf("failed to update feature usage: %w", err)
	}

	return nil
}

// GetFeatureUsage returns the current usage for a feature
func (f *FeatureAccessService) GetFeatureUsage(ctx context.Context, userID uuid.UUID, featureName string) (*models.FeatureUsage, error) {
	var usage models.FeatureUsage
	err := f.db.DB.NewSelect().
		Model(&usage).
		Where("user_id = ? AND feature_name = ?", userID, featureName).
		Scan(ctx)

	if err != nil {
		// Return default usage if not found
		plan, _ := models.AvailablePlans["free"]
		limits := plan.Limits
		limit := -1
		if l, exists := limits[featureName]; exists {
			if limitVal, ok := l.(int); ok {
				limit = limitVal
			}
		}

		return &models.FeatureUsage{
			UserID:       userID,
			FeatureName:  featureName,
			CurrentUsage: 0,
			UsageLimit:   limit,
			ResetDate:    f.getNextResetDate(),
		}, nil
	}

	return &usage, nil
}

// GetAllFeatureUsage returns usage for all features for a user
func (f *FeatureAccessService) GetAllFeatureUsage(ctx context.Context, userID uuid.UUID) (map[string]*models.FeatureUsage, error) {
	var usages []models.FeatureUsage
	err := f.db.DB.NewSelect().
		Model(&usages).
		Where("user_id = ?", userID).
		Scan(ctx)

	if err != nil {
		return nil, fmt.Errorf("failed to get feature usage: %w", err)
	}

	usageMap := make(map[string]*models.FeatureUsage)
	for i := range usages {
		usageMap[usages[i].FeatureName] = &usages[i]
	}

	// Ensure all features have usage records
	features := []string{
		models.FeatureVideos,
		models.FeatureNotesPerVideo,
		models.FeatureAISummaries,
		models.FeatureCustomTags,
		models.FeatureExport,
		models.FeatureAnalytics,
		models.FeatureAPIAccess,
	}

	for _, feature := range features {
		if _, exists := usageMap[feature]; !exists {
			usage, err := f.GetFeatureUsage(ctx, userID, feature)
			if err != nil {
				continue
			}
			usageMap[feature] = usage
		}
	}

	return usageMap, nil
}

// ResetFeatureUsage resets usage for a specific feature (admin function)
func (f *FeatureAccessService) ResetFeatureUsage(ctx context.Context, userID uuid.UUID, featureName string) error {
	var usage models.FeatureUsage
	err := f.db.DB.NewSelect().
		Model(&usage).
		Where("user_id = ? AND feature_name = ?", userID, featureName).
		Scan(ctx)

	if err != nil {
		return fmt.Errorf("feature usage not found: %w", err)
	}

	usage.CurrentUsage = 0
	usage.ResetDate = f.getNextResetDate()

	if err := f.db.Update(ctx, &usage); err != nil {
		return fmt.Errorf("failed to reset feature usage: %w", err)
	}

	return nil
}

// UpdateFeatureLimits updates feature limits when subscription changes
func (f *FeatureAccessService) UpdateFeatureLimits(ctx context.Context, userID uuid.UUID, planType string) error {
	plan, exists := models.AvailablePlans[planType]
	if !exists {
		return fmt.Errorf("invalid plan type: %s", planType)
	}

	limits := plan.Limits
	features := []string{
		models.FeatureVideos,
		models.FeatureNotesPerVideo,
		models.FeatureAISummaries,
		models.FeatureCustomTags,
		models.FeatureExport,
		models.FeatureAnalytics,
		models.FeatureAPIAccess,
	}

	for _, feature := range features {
		if limit, exists := limits[feature]; exists {
			if limitVal, ok := limit.(int); ok {
				err := f.updateFeatureLimit(ctx, userID, feature, limitVal)
				if err != nil {
					return fmt.Errorf("failed to update limit for %s: %w", feature, err)
				}
			}
		}
	}

	return nil
}

// Helper functions
func (f *FeatureAccessService) getUserSubscription(ctx context.Context, userID uuid.UUID) (*models.Subscription, error) {
	var subscription models.Subscription
	err := f.db.DB.NewSelect().
		Model(&subscription).
		Where("user_id = ? AND status = 'active'", userID).
		Order("created_at DESC").
		Limit(1).
		Scan(ctx)

	if err != nil {
		// Return free subscription if none found
		return &models.Subscription{
			UserID:   userID,
			PlanType: "free",
			Status:   "active",
		}, nil
	}

	return &subscription, nil
}

func (f *FeatureAccessService) checkUsageLimit(ctx context.Context, userID uuid.UUID, featureName string, limit int) (bool, error) {
	usage, err := f.GetFeatureUsage(ctx, userID, featureName)
	if err != nil {
		return false, err
	}

	// Check if usage needs to be reset
	if usage.ResetDate != nil && time.Now().UTC().After(*usage.ResetDate) {
		usage.CurrentUsage = 0
		usage.ResetDate = f.getNextResetDate()
		if err := f.db.Update(ctx, usage); err != nil {
			return false, fmt.Errorf("failed to reset usage: %w", err)
		}
	}

	return usage.CurrentUsage < limit, nil
}

func (f *FeatureAccessService) updateFeatureLimit(ctx context.Context, userID uuid.UUID, featureName string, limit int) error {
	var usage models.FeatureUsage
	err := f.db.DB.NewSelect().
		Model(&usage).
		Where("user_id = ? AND feature_name = ?", userID, featureName).
		Scan(ctx)

	if err != nil {
		// Create new usage record
		usage = models.FeatureUsage{
			UserID:       userID,
			FeatureName:  featureName,
			CurrentUsage: 0,
			UsageLimit:   limit,
			ResetDate:    f.getNextResetDate(),
		}
		return f.db.Create(ctx, &usage)
	}

	// Update existing record
	usage.UsageLimit = limit
	return f.db.Update(ctx, &usage)
}

func (f *FeatureAccessService) getNextResetDate() *time.Time {
	now := time.Now().UTC()
	nextMonth := now.AddDate(0, 1, 0)
	resetDate := time.Date(nextMonth.Year(), nextMonth.Month(), 1, 0, 0, 0, 0, time.UTC)
	return &resetDate
}
