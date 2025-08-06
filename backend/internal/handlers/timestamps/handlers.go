package timestamps

import (
	"context"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/shubhamku044/ytclipper/internal/config"
	"github.com/shubhamku044/ytclipper/internal/database"
	authhandlers "github.com/shubhamku044/ytclipper/internal/handlers/auth"
	"github.com/shubhamku044/ytclipper/internal/handlers/videos"
	"github.com/shubhamku044/ytclipper/internal/middleware"
	"github.com/shubhamku044/ytclipper/internal/models"
)

type TimestampsHandlers struct {
	db            *database.Database
	aiService     *AIService
	tagService    *TagService
	videoHandlers *videos.VideoHandlers
}

func NewTimestampsHandlers(db *database.Database, openaiAPIKey *config.OpenAIConfig) *TimestampsHandlers {
	return &TimestampsHandlers{
		db:            db,
		aiService:     NewAIService(openaiAPIKey, db),
		tagService:    NewTagService(db),
		videoHandlers: videos.NewVideoHandlers(db),
	}
}

func (t *TimestampsHandlers) GetAllTags(c *gin.Context) {
	userID, exists := authhandlers.GetUserID(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER_ID", "User ID not found", nil)
		return
	}

	limit := 100
	if param := c.Query("limit"); param != "" {
		if parsed, err := strconv.Atoi(param); err == nil && parsed > 0 && parsed <= 500 {
			limit = parsed
		}
	}

	tags, err := t.tagService.GetAllTags(c.Request.Context(), userID, limit)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "FAILED_TO_FETCH_TAGS", "Failed to fetch tags", gin.H{"error": err.Error()})
		return
	}

	middleware.RespondWithOK(c, gin.H{
		"tags":  tags,
		"count": len(tags),
	})
}

func (t *TimestampsHandlers) SearchTags(c *gin.Context) {
	var req TagSearchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body", gin.H{
			"error": err.Error(),
		})
		return
	}

	if req.Limit <= 0 || req.Limit > 50 {
		req.Limit = 10
	}

	userID, exists := authhandlers.GetUserID(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER_ID", "User ID not found", nil)
		return
	}

	tags, err := t.tagService.SearchTags(c.Request.Context(), userID, req.Query, req.Limit)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "FAILED_TO_SEARCH_TAGS", "Failed to search tags", gin.H{"error": err.Error()})
		return
	}

	middleware.RespondWithOK(c, gin.H{
		"tags":  tags,
		"query": req.Query,
		"count": len(tags),
	})
}

func (t *TimestampsHandlers) CreateTimestamp(c *gin.Context) {
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

	var req CreateTimestampRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body", gin.H{
			"error": err.Error(),
		})
		return
	}

	ctx := context.Background()

	tx, err := t.db.DB.BeginTx(ctx, nil)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_TRANSACTION_ERROR", "Failed to start database transaction", gin.H{
			"error": err.Error(),
		})
		return
	}
	defer tx.Rollback()

	videoExists, err := t.videoHandlers.VideoExists(ctx, userID, req.VideoID)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "VIDEO_CHECK_ERROR", "Failed to check video existence", gin.H{
			"error": err.Error(),
		})
		return
	}

	if !videoExists {
		placeholderTitle := "Video " + req.VideoID
		placeholderURL := "https://youtube.com/watch?v=" + req.VideoID

		if err := t.videoHandlers.CreateVideoIfNotExists(ctx, userID, req.VideoID, placeholderURL, placeholderTitle); err != nil {
			middleware.RespondWithError(c, http.StatusInternalServerError, "VIDEO_ERROR", "Failed to create video", gin.H{
				"error": err.Error(),
			})
			return
		}
	}

	timestamp := models.Timestamp{
		UserID:    userID,
		VideoID:   req.VideoID,
		Title:     req.Title,
		Note:      req.Note,
		Timestamp: req.Timestamp,
		CreatedAt: time.Now().UTC(),
		UpdatedAt: time.Now().UTC(),
	}

	if err := t.db.CreateWithTx(ctx, tx, &timestamp); err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_ERROR", "Failed to create timestamp", gin.H{
			"error": err.Error(),
		})
		return
	}

	if len(req.Tags) > 0 {
		tagIDs, err := t.tagService.ProcessTagsForTimestampWithTx(ctx, tx, req.Tags)
		if err != nil {
			middleware.RespondWithError(c, http.StatusInternalServerError, "TAG_ERROR", "Failed to process tags", gin.H{
				"error": err.Error(),
			})
			return
		}

		if err := t.tagService.CreateTimestampTagRelationsWithTx(ctx, tx, timestamp.ID.String(), tagIDs); err != nil {
			middleware.RespondWithError(c, http.StatusInternalServerError, "TAG_RELATION_ERROR", "Failed to create tag relations", gin.H{
				"error": err.Error(),
			})
			return
		}
	}

	if err := tx.Commit(); err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_COMMIT_ERROR", "Failed to commit transaction", gin.H{
			"error": err.Error(),
		})
		return
	}

	if t.aiService != nil {
		go func() {
			time.Sleep(2 * time.Second) // Small delay to avoid immediate processing
			if err := t.aiService.ProcessEmbeddingForTimestamp(timestamp.ID.String()); err != nil {
				log.Printf("Failed to generate embedding for timestamp %s: %v", timestamp.ID, err)
			}
		}()
	}

	middleware.RespondWithOK(c, gin.H{
		"timestamp": timestamp,
		"message":   "Timestamp created successfully",
	})
}

func (t *TimestampsHandlers) GetAllTimestamps(c *gin.Context) {
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

	ctx := context.Background()

	var timestamps []models.Timestamp
	err = t.db.DB.NewSelect().
		Model(&timestamps).
		Where("user_id = ? AND deleted_at IS NULL", userID).
		Order("created_at DESC").
		Scan(ctx)

	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_READ_ERROR", "Failed to fetch timestamps", gin.H{
			"error": err.Error(),
		})
		return
	}

	middleware.RespondWithOK(c, gin.H{
		"timestamps": timestamps,
		"count":      len(timestamps),
	})
}

func (t *TimestampsHandlers) GetTimestampsByVideoID(c *gin.Context) {
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

	videoID := c.Param("id")
	if videoID == "" {
		middleware.RespondWithError(c, http.StatusBadRequest, "MISSING_VIDEO_ID", "Video ID is required", nil)
		return
	}

	ctx := context.Background()

	var timestamps []models.Timestamp
	err = t.db.DB.NewSelect().
		Model(&timestamps).
		Where("user_id = ? AND video_id = ? AND deleted_at IS NULL", userID, videoID).
		Order("timestamp ASC").
		Scan(ctx)

	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_READ_ERROR", "Failed to fetch timestamps", gin.H{
			"error": err.Error(),
		})
		return
	}

	middleware.RespondWithOK(c, gin.H{
		"timestamps": timestamps,
		"video_id":   videoID,
		"count":      len(timestamps),
	})
}

func (t *TimestampsHandlers) DeleteTimestamp(c *gin.Context) {
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

	timestampIDStr := c.Param("id")
	if timestampIDStr == "" {
		middleware.RespondWithError(c, http.StatusBadRequest, "MISSING_TIMESTAMP_ID", "Timestamp ID is required", nil)
		return
	}

	timestampID, err := uuid.Parse(timestampIDStr)
	if err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_TIMESTAMP_ID", "Invalid timestamp ID format", gin.H{
			"error": err.Error(),
		})
		return
	}

	ctx := context.Background()

	tx, err := t.db.DB.BeginTx(ctx, nil)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_TRANSACTION_ERROR", "Failed to start database transaction", gin.H{
			"error": err.Error(),
		})
		return
	}
	defer tx.Rollback()

	_, err = tx.NewUpdate().
		Model((*models.Timestamp)(nil)).
		Set("deleted_at = ?", time.Now().UTC()).
		Where("id = ? AND user_id = ?", timestampID, userID).
		Exec(ctx)

	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_ERROR", "Failed to delete timestamp", gin.H{
			"error": err.Error(),
		})
		return
	}

	if err := t.tagService.CleanupOrphanedTagRelationsWithTx(ctx, tx); err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "CLEANUP_ERROR", "Failed to cleanup orphaned tag relations", gin.H{
			"error": err.Error(),
		})
		return
	}

	if err := tx.Commit(); err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_COMMIT_ERROR", "Failed to commit transaction", gin.H{
			"error": err.Error(),
		})
		return
	}

	middleware.RespondWithOK(c, gin.H{
		"message": "Timestamp deleted successfully",
	})
}

func (t *TimestampsHandlers) UpdateTimestamp(c *gin.Context) {
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

	timestampIDStr := c.Param("id")
	if timestampIDStr == "" {
		middleware.RespondWithError(c, http.StatusBadRequest, "MISSING_TIMESTAMP_ID", "Timestamp ID is required", nil)
		return
	}

	timestampID, err := uuid.Parse(timestampIDStr)
	if err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_TIMESTAMP_ID", "Invalid timestamp ID format", gin.H{
			"error": err.Error(),
		})
		return
	}

	var req struct {
		Title string   `json:"title"`
		Note  string   `json:"note"`
		Tags  []string `json:"tags"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body", gin.H{
			"error": err.Error(),
		})
		return
	}

	ctx := context.Background()

	tx, err := t.db.DB.BeginTx(ctx, nil)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_TRANSACTION_ERROR", "Failed to start database transaction", gin.H{
			"error": err.Error(),
		})
		return
	}
	defer tx.Rollback()

	_, err = tx.NewUpdate().
		Model((*models.Timestamp)(nil)).
		Set("title = ?", req.Title).
		Set("note = ?", req.Note).
		Set("updated_at = ?", time.Now().UTC()).
		Where("id = ? AND user_id = ?", timestampID, userID).
		Exec(ctx)

	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_ERROR", "Failed to update timestamp", gin.H{
			"error": err.Error(),
		})
		return
	}

	tagIDs, err := t.tagService.ProcessTagsForTimestampWithTx(ctx, tx, req.Tags)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "TAG_ERROR", "Failed to process tags", gin.H{
			"error": err.Error(),
		})
		return
	}

	if err := t.tagService.CreateTimestampTagRelationsWithTx(ctx, tx, timestampID.String(), tagIDs); err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "TAG_RELATION_ERROR", "Failed to create tag relations", gin.H{
			"error": err.Error(),
		})
		return
	}

	if err := tx.Commit(); err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_COMMIT_ERROR", "Failed to commit transaction", gin.H{
			"error": err.Error(),
		})
		return
	}

	middleware.RespondWithOK(c, gin.H{
		"message": "Timestamp updated successfully",
	})
}

func (t *TimestampsHandlers) DeleteMultipleTimestamps(c *gin.Context) {
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
		IDs []string `json:"ids" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body", gin.H{
			"error": err.Error(),
		})
		return
	}

	var timestampIDs []uuid.UUID
	for _, idStr := range req.IDs {
		id, err := uuid.Parse(idStr)
		if err != nil {
			middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_TIMESTAMP_ID", "Invalid timestamp ID format", gin.H{
				"error": err.Error(),
				"id":    idStr,
			})
			return
		}
		timestampIDs = append(timestampIDs, id)
	}

	ctx := context.Background()

	tx, err := t.db.DB.BeginTx(ctx, nil)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_TRANSACTION_ERROR", "Failed to start database transaction", gin.H{
			"error": err.Error(),
		})
		return
	}
	defer tx.Rollback()

	_, err = tx.NewUpdate().
		Model((*models.Timestamp)(nil)).
		Set("deleted_at = ?", time.Now().UTC()).
		Where("id IN (?) AND user_id = ?", timestampIDs, userID).
		Exec(ctx)

	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_ERROR", "Failed to delete timestamps", gin.H{
			"error": err.Error(),
		})
		return
	}

	if err := t.tagService.CleanupOrphanedTagRelationsWithTx(ctx, tx); err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "CLEANUP_ERROR", "Failed to cleanup orphaned tag relations", gin.H{
			"error": err.Error(),
		})
		return
	}

	if err := tx.Commit(); err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_COMMIT_ERROR", "Failed to commit transaction", gin.H{
			"error": err.Error(),
		})
		return
	}

	middleware.RespondWithOK(c, gin.H{
		"message": "Timestamps deleted successfully",
		"count":   len(timestampIDs),
	})
}
