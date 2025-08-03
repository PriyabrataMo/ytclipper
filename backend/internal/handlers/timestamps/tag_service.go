package timestamps

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/shubhamku044/ytclipper/internal/database"
	"github.com/shubhamku044/ytclipper/internal/models"
	"github.com/uptrace/bun"
)

type TagService struct {
	db *database.Database
}

func NewTagService(db *database.Database) *TagService {
	return &TagService{
		db: db,
	}
}

func (ts *TagService) FindOrCreateTag(ctx context.Context, tagName string) (*models.Tag, error) {
	tagName = strings.ToLower(strings.TrimSpace(tagName))
	if tagName == "" {
		return nil, fmt.Errorf("tag name cannot be empty")
	}

	var tag models.Tag
	err := ts.db.DB.NewSelect().
		Model(&tag).
		Where("LOWER(name) = ?", tagName).
		Scan(ctx)

	if err == nil {
		return &tag, nil
	}

	newTag := &models.Tag{
		Name:      tagName,
		CreatedAt: time.Now().UTC(),
		UpdatedAt: time.Now().UTC(),
	}

	_, err = ts.db.DB.NewInsert().
		Model(newTag).
		Exec(ctx)

	if err != nil {
		return nil, fmt.Errorf("failed to create tag '%s': %w", tagName, err)
	}

	return newTag, nil
}

func (ts *TagService) ProcessTagsForTimestamp(ctx context.Context, tagNames []string) ([]uuid.UUID, error) {
	if len(tagNames) == 0 {
		return nil, nil
	}

	var tagIDs []uuid.UUID
	for _, tagName := range tagNames {
		if tagName == "" {
			continue
		}

		tag, err := ts.FindOrCreateTag(ctx, tagName)
		if err != nil {
			return nil, fmt.Errorf("failed to process tag '%s': %w", tagName, err)
		}

		tagIDs = append(tagIDs, tag.ID)
	}

	return tagIDs, nil
}

// ProcessTagsForTimestampWithTx processes tags within a transaction
func (ts *TagService) ProcessTagsForTimestampWithTx(ctx context.Context, tx bun.Tx, tagNames []string) ([]uuid.UUID, error) {
	if len(tagNames) == 0 {
		return nil, nil
	}
	var tagIDs []uuid.UUID
	for _, tagName := range tagNames {
		if tagName == "" {
			continue
		}
		tag, err := ts.FindOrCreateTagWithTx(ctx, tx, tagName)
		if err != nil {
			return nil, fmt.Errorf("failed to process tag '%s': %w", tagName, err)
		}
		tagIDs = append(tagIDs, tag.ID)
	}
	return tagIDs, nil
}

// FindOrCreateTagWithTx finds or creates a tag within a transaction
func (ts *TagService) FindOrCreateTagWithTx(ctx context.Context, tx bun.Tx, tagName string) (*models.Tag, error) {
	// Normalize tag name
	tagName = strings.ToLower(strings.TrimSpace(tagName))
	if tagName == "" {
		return nil, fmt.Errorf("tag name cannot be empty")
	}

	// Try to find existing tag
	var tag models.Tag
	err := tx.NewSelect().
		Model(&tag).
		Where("LOWER(name) = ?", tagName).
		Scan(ctx)

	if err == nil {
		return &tag, nil
	}

	// Create new tag if not found
	newTag := &models.Tag{
		Name: tagName,
	}

	_, err = tx.NewInsert().
		Model(newTag).
		Exec(ctx)

	if err != nil {
		return nil, fmt.Errorf("failed to create tag '%s': %w", tagName, err)
	}

	return newTag, nil
}

func (ts *TagService) CreateTimestampTagRelations(ctx context.Context, timestampID string, tagIDs []uuid.UUID) error {
	if len(tagIDs) == 0 {
		return nil
	}

	// Convert string timestamp ID to UUID
	timestampUUID, err := uuid.Parse(timestampID)
	if err != nil {
		return fmt.Errorf("invalid timestamp ID format: %w", err)
	}

	var relations []models.TimestampTag
	for _, tagID := range tagIDs {
		relations = append(relations, models.TimestampTag{
			TimestampID: timestampUUID,
			TagID:       tagID,
		})
	}

	_, err = ts.db.DB.NewInsert().
		Model(&relations).
		Exec(ctx)

	return err
}

// CreateTimestampTagRelationsWithTx creates timestamp-tag relations within a transaction
func (ts *TagService) CreateTimestampTagRelationsWithTx(ctx context.Context, tx bun.Tx, timestampID string, tagIDs []uuid.UUID) error {
	if len(tagIDs) == 0 {
		return nil
	}

	// Convert string timestamp ID to UUID
	timestampUUID, err := uuid.Parse(timestampID)
	if err != nil {
		return fmt.Errorf("invalid timestamp ID format: %w", err)
	}

	var relations []models.TimestampTag
	for _, tagID := range tagIDs {
		relations = append(relations, models.TimestampTag{
			TimestampID: timestampUUID,
			TagID:       tagID,
		})
	}

	_, err = tx.NewInsert().
		Model(&relations).
		Exec(ctx)

	return err
}

// CleanupOrphanedTagRelations removes tag relations for deleted timestamps
func (ts *TagService) CleanupOrphanedTagRelations(ctx context.Context) error {
	// Delete timestamp-tag relations where the timestamp has been soft deleted
	_, err := ts.db.DB.NewDelete().
		Model((*models.TimestampTag)(nil)).
		Where("timestamp_id IN (SELECT id FROM timestamps WHERE deleted_at IS NOT NULL)").
		Exec(ctx)

	return err
}

// CleanupOrphanedTagRelationsWithTx removes tag relations for deleted timestamps within a transaction
func (ts *TagService) CleanupOrphanedTagRelationsWithTx(ctx context.Context, tx bun.Tx) error {
	// Delete timestamp-tag relations where the timestamp has been soft deleted
	_, err := tx.NewDelete().
		Model((*models.TimestampTag)(nil)).
		Where("timestamp_id IN (SELECT id FROM timestamps WHERE deleted_at IS NOT NULL)").
		Exec(ctx)

	return err
}

func (ts *TagService) GetAllTags(ctx context.Context, userID string, limit int) ([]models.Tag, error) {
	// Convert string user ID to UUID
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID format: %w", err)
	}

	// First, check if user has any timestamps
	timestampCount, err := ts.db.DB.NewSelect().
		Model((*models.Timestamp)(nil)).
		Where("user_id = ? AND deleted_at IS NULL", userUUID).
		Count(ctx)

	if err != nil {
		return nil, fmt.Errorf("error checking timestamp count: %w", err)
	}

	var tags []models.Tag

	if timestampCount == 0 {
		// User has no timestamps, return empty list
		tags = []models.Tag{}
	} else {
		// Get all tags that are used by the current user using a subquery
		query := ts.db.DB.NewSelect().
			Model(&tags).
			Where("id IN (SELECT DISTINCT tag_id FROM timestamp_tags WHERE timestamp_id IN (SELECT id FROM timestamps WHERE user_id = ? AND deleted_at IS NULL))", userUUID).
			Order("name ASC").
			Limit(limit)

		err = query.Scan(ctx)
		if err != nil {
			return nil, fmt.Errorf("error fetching all tags: %w", err)
		}
	}

	return tags, nil
}

func (ts *TagService) SearchTags(ctx context.Context, userID, query string, limit int) ([]models.Tag, error) {
	// Convert string user ID to UUID
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID format: %w", err)
	}

	// First, check if user has any timestamps
	timestampCount, err := ts.db.DB.NewSelect().
		Model((*models.Timestamp)(nil)).
		Where("user_id = ? AND deleted_at IS NULL", userUUID).
		Count(ctx)

	if err != nil {
		return nil, fmt.Errorf("error checking timestamp count: %w", err)
	}

	var tags []models.Tag

	if timestampCount == 0 {
		// User has no timestamps, return empty list
		tags = []models.Tag{}
	} else {
		// Search for tags that are used by the current user using a subquery
		query := ts.db.DB.NewSelect().
			Model(&tags).
			Where("id IN (SELECT DISTINCT tag_id FROM timestamp_tags WHERE timestamp_id IN (SELECT id FROM timestamps WHERE user_id = ? AND deleted_at IS NULL))", userUUID).
			Where("LOWER(name) ILIKE LOWER(?)", "%"+query+"%").
			Order("name ASC").
			Limit(limit)

		err = query.Scan(ctx)
		if err != nil {
			return nil, fmt.Errorf("error searching tags: %w", err)
		}
	}

	return tags, nil
}
