package timestamps

import (
	"context"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	authhandlers "github.com/shubhamku044/ytclipper/internal/handlers/auth"
	"github.com/shubhamku044/ytclipper/internal/middleware"
	"github.com/shubhamku044/ytclipper/internal/models"
)

func (t *TimestampsHandlers) BackfillEmbeddingsAsync(c *gin.Context) {
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

	go func() {
		log.Printf("Starting async embedding backfill for user %s", userID)
		t.processEmbeddingsBackground(userID.String())
	}()

	middleware.RespondWithOK(c, gin.H{
		"message": "Embedding generation started in background",
		"user_id": userID.String(),
	})
}

func (t *TimestampsHandlers) processEmbeddingsBackground(userID string) {
	ctx := context.Background()
	batchSize := 5

	userUUID, err := uuid.Parse(userID)
	if err != nil {
		log.Printf("Error parsing user ID for background processing: %v", err)
		return
	}

	var timestamps []models.Timestamp
	err = t.db.DB.NewSelect().
		Model(&timestamps).
		Where("user_id = ? AND deleted_at IS NULL", userUUID).
		Where("embedding IS NULL").
		Scan(ctx)

	if err != nil {
		log.Printf("Error fetching timestamps for background processing: %v", err)
		return
	}

	processed := 0
	for i := 0; i < len(timestamps); i += batchSize {
		end := i + batchSize
		if end > len(timestamps) {
			end = len(timestamps)
		}

		batch := timestamps[i:end]

		for _, ts := range batch {
			var tagNames []string
			for _, tag := range ts.Tags {
				tagNames = append(tagNames, tag.Name)
			}
			embeddingText := t.aiService.CreateEmbeddingText(ts.Title, ts.Note, tagNames)
			if embeddingText == "" {
				continue
			}

			embedding, err := t.aiService.GenerateEmbedding(embeddingText)
			if err != nil {
				time.Sleep(5 * time.Second)
				continue
			}

			_, err = t.db.DB.NewUpdate().
				Model((*models.Timestamp)(nil)).
				Set("embedding = ?", embedding).
				Set("updated_at = ?", time.Now().UTC()).
				Where("id = ?", ts.ID).
				Exec(ctx)

			if err != nil {
				log.Printf("Failed to update timestamp %s: %v", ts.ID, err)
				continue
			}

			processed++
		}

		time.Sleep(2 * time.Second)
	}
}

func (t *TimestampsHandlers) GetEmbeddingStatus(c *gin.Context) {
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

	totalCount, err := t.db.DB.NewSelect().
		Model((*models.Timestamp)(nil)).
		Where("user_id = ? AND deleted_at IS NULL", userID).
		Count(ctx)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_READ_ERROR", "Failed to count total timestamps", gin.H{
			"error": err.Error(),
		})
		return
	}

	withEmbeddingsCount, err := t.db.DB.NewSelect().
		Model((*models.Timestamp)(nil)).
		Where("user_id = ? AND deleted_at IS NULL", userID).
		Where("embedding IS NOT NULL").
		Count(ctx)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_READ_ERROR", "Failed to count timestamps with embeddings", gin.H{
			"error": err.Error(),
		})
		return
	}

	withoutEmbeddingsCount := totalCount - withEmbeddingsCount

	completionPercentage := float64(0)
	if totalCount > 0 {
		completionPercentage = float64(withEmbeddingsCount) / float64(totalCount) * 100
	}

	middleware.RespondWithOK(c, gin.H{
		"total_timestamps":      totalCount,
		"with_embeddings":       withEmbeddingsCount,
		"without_embeddings":    withoutEmbeddingsCount,
		"completion_percentage": completionPercentage,
		"needs_backfill":        withoutEmbeddingsCount > 0,
		"estimated_cost_usd":    float64(withoutEmbeddingsCount) * 0.00002,
	})
}

func (t *TimestampsHandlers) ProcessMissingEmbeddingsForUser(c *gin.Context) {
	userIDStr, exists := authhandlers.GetUserID(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER_ID", "User ID not found", nil)
		return
	}

	batchSize := 10
	if param := c.Query("batch_size"); param != "" {
		if parsed, err := strconv.Atoi(param); err == nil && parsed > 0 && parsed <= 50 {
			batchSize = parsed
		}
	}

	go func() {
		if err := t.aiService.ProcessMissingEmbeddingsForUser(userIDStr, batchSize); err != nil {
			log.Printf("Failed to process missing embeddings for user %s: %v", userIDStr, err)
		}
	}()

	middleware.RespondWithOK(c, gin.H{
		"message":    "Processing missing embeddings in background",
		"user_id":    userIDStr,
		"batch_size": batchSize,
	})
}

func (t *TimestampsHandlers) ProcessAllMissingEmbeddings(c *gin.Context) {
	batchSize := 20
	if param := c.Query("batch_size"); param != "" {
		if parsed, err := strconv.Atoi(param); err == nil && parsed > 0 && parsed <= 100 {
			batchSize = parsed
		}
	}

	go func() {
		if err := t.aiService.ProcessAllMissingEmbeddings(batchSize); err != nil {
			log.Printf("Failed to process all missing embeddings: %v", err)
		}
	}()

	middleware.RespondWithOK(c, gin.H{
		"message":    "Processing all missing embeddings in background",
		"batch_size": batchSize,
	})
}
