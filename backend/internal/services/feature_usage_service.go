package services

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/shubhamku044/ytclipper/internal/database"
	"github.com/shubhamku044/ytclipper/internal/models"
)

type FeatureUsageService struct {
	db *database.Database
}

func NewFeatureUsageService(db *database.Database) *FeatureUsageService {
	return &FeatureUsageService{
		db: db,
	}
}

func (s *FeatureUsageService) IncrementUsage(ctx context.Context, userID uuid.UUID, featureName string, videoID ...string) error {
	now := time.Now().UTC()

	// For all features, use the original logic
	result, err := s.db.DB.NewUpdate().
		Model((*models.FeatureUsage)(nil)).
		Set("current_usage = current_usage + 1").
		Set("updated_at = ?", now).
		Where("user_id = ? AND feature_name = ?", userID, featureName).
		Exec(ctx)

	if err != nil {
		return fmt.Errorf("failed to increment usage: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		var subscription models.Subscription
		err = s.db.DB.NewSelect().
			Model(&subscription).
			Where("user_id = ? AND status = 'active'", userID).
			Scan(ctx, &subscription)

		if err != nil {
			subscription.PlanType = "free"
		}

		planLimits := getPlanLimits(subscription.PlanType)
		limit, exists := planLimits[featureName]
		if !exists {
			limit = 0
		}

		featureUsage := &models.FeatureUsage{
			UserID:       userID,
			FeatureName:  featureName,
			CurrentUsage: 1,
			UsageLimit:   limit,
			ResetDate:    &now,
			CreatedAt:    now,
			UpdatedAt:    now,
		}

		_, err = s.db.DB.NewInsert().
			Model(featureUsage).
			Exec(ctx)

		if err != nil {
			return fmt.Errorf("failed to create usage record: %w", err)
		}
	}

	return nil
}

func (s *FeatureUsageService) GetUsage(ctx context.Context, userID uuid.UUID, featureName string) (*models.FeatureUsage, error) {
	var usage models.FeatureUsage
	err := s.db.DB.NewSelect().
		Model(&usage).
		Where("user_id = ? AND feature_name = ?", userID, featureName).
		Scan(ctx, &usage)

	if err != nil {
		return nil, fmt.Errorf("failed to get usage: %w", err)
	}

	return &usage, nil
}

func (s *FeatureUsageService) CheckUsageLimit(ctx context.Context, userID uuid.UUID, featureName string, videoID ...string) (bool, error) {
	// For notes_per_video, we need to check per video
	if featureName == "notes_per_video" && len(videoID) > 0 {
		videoSpecificFeature := fmt.Sprintf("notes_per_video_%s", videoID[0])
		usage, err := s.GetUsage(ctx, userID, videoSpecificFeature)
		if err != nil {
			// If no usage record exists, check if we can create one
			if err.Error() == "failed to get usage: sql: no rows in result set" {
				// Get user's current subscription to determine limits
				var subscription models.Subscription
				err = s.db.DB.NewSelect().
					Model(&subscription).
					Where("user_id = ? AND status = 'active'", userID).
					Scan(ctx)

				if err != nil {
					subscription.PlanType = "free"
				}

				planLimits := getPlanLimits(subscription.PlanType)
				limit, exists := planLimits[featureName]
				if !exists {
					limit = 0
				}

				if limit <= 0 {
					return true, nil
				}

				return 0 < limit, nil
			}
			return false, err
		}

		// If usage limit is 0 or negative, it means unlimited
		if usage.UsageLimit <= 0 {
			return true, nil
		}

		return usage.CurrentUsage < usage.UsageLimit, nil
	}

	// For other features, use the original logic
	usage, err := s.GetUsage(ctx, userID, featureName)
	if err != nil {
		// If no usage record exists, check if we can create one
		if err.Error() == "failed to get usage: sql: no rows in result set" {
			// Get user's current subscription to determine limits
			var subscription models.Subscription
			err = s.db.DB.NewSelect().
				Model(&subscription).
				Where("user_id = ? AND status = 'active'", userID).
				Scan(ctx)

			if err != nil {
				subscription.PlanType = "free"
			}

			planLimits := getPlanLimits(subscription.PlanType)
			limit, exists := planLimits[featureName]
			if !exists {
				limit = 0
			}

			if limit <= 0 {
				return true, nil
			}

			return 0 < limit, nil
		}
		return false, err
	}

	// If usage limit is 0 or negative, it means unlimited
	if usage.UsageLimit <= 0 {
		return true, nil
	}

	return usage.CurrentUsage < usage.UsageLimit, nil
}

func (s *FeatureUsageService) ResetUsage(ctx context.Context, userID uuid.UUID) error {
	now := time.Now().UTC()

	_, err := s.db.DB.NewUpdate().
		Model((*models.FeatureUsage)(nil)).
		Set("current_usage = ?", 0).
		Set("updated_at = ?", now).
		Where("user_id = ?", userID).
		Exec(ctx)

	return err
}

func getPlanLimits(planType string) map[string]int {
	switch planType {
	case "free":
		return map[string]int{
			"videos":          5,
			"notes_per_video": 8,
			"ai_summaries":    3,
			"ai_questions":    10,
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
