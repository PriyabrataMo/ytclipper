package videos

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/shubhamku044/ytclipper/internal/database"
	authhandlers "github.com/shubhamku044/ytclipper/internal/handlers/auth"
	"github.com/shubhamku044/ytclipper/internal/middleware"
	"github.com/shubhamku044/ytclipper/internal/models"
	"github.com/shubhamku044/ytclipper/internal/services"
)

type VideoHandlers struct {
	db                  *database.Database
	featureUsageService *services.FeatureUsageService
}

func NewVideoHandlers(db *database.Database) *VideoHandlers {
	return &VideoHandlers{
		db:                  db,
		featureUsageService: services.NewFeatureUsageService(db),
	}
}

func (v *VideoHandlers) GetAllVideos(c *gin.Context) {
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

	var videos []models.Video
	err = v.db.DB.NewSelect().
		Model(&videos).
		Where("user_id = ? AND deleted_at IS NULL", userID).
		Order("created_at DESC").
		Scan(ctx)

	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_READ_ERROR", "Failed to fetch videos", gin.H{
			"error": err.Error(),
		})
		return
	}

	videoMap := make(map[string]gin.H)
	for _, video := range videos {
		count, err := v.db.DB.NewSelect().
			Model((*models.Timestamp)(nil)).
			Where("user_id = ? AND video_id = ? AND deleted_at IS NULL", userID, video.VideoID).
			Count(ctx)

		if err != nil {
			count = 0
		}

		var latestTimestamp *time.Time
		err = v.db.DB.NewSelect().
			Model((*models.Timestamp)(nil)).
			Column("created_at").
			Where("user_id = ? AND video_id = ? AND deleted_at IS NULL", userID, video.VideoID).
			Order("created_at DESC").
			Limit(1).
			Scan(ctx, &latestTimestamp)

		var latestTimestampStr *string
		if err == nil && latestTimestamp != nil {
			isoString := latestTimestamp.Format(time.RFC3339)
			latestTimestampStr = &isoString
		}

		videoMap[video.VideoID] = gin.H{
			"video_id":         video.VideoID,
			"youtube_url":      video.YouTubeURL,
			"title":            video.Title,
			"thumbnail_url":    video.ThumbnailURL,
			"channel_id":       video.ChannelID,
			"channel_title":    video.ChannelTitle,
			"duration":         video.Duration,
			"published_at":     video.PublishedAt,
			"view_count":       video.ViewCount,
			"like_count":       video.LikeCount,
			"comment_count":    video.CommentCount,
			"ai_summary":       video.AISummary,
			"watched_duration": video.WatchedDuration,
			"count":            count,
			"latest_timestamp": latestTimestampStr,
			"created_at":       video.CreatedAt,
		}
	}

	var result []gin.H
	for _, video := range videoMap {
		result = append(result, video)
	}

	middleware.RespondWithOK(c, gin.H{
		"videos": result,
		"count":  len(result),
	})
}

func (v *VideoHandlers) GetVideoByID(c *gin.Context) {
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

	var video models.Video
	err = v.db.DB.NewSelect().
		Model(&video).
		Where("user_id = ? AND video_id = ? AND deleted_at IS NULL", userID, videoID).
		Scan(ctx)

	if err != nil {
		middleware.RespondWithError(c, http.StatusNotFound, "VIDEO_NOT_FOUND", "Video not found", gin.H{
			"error": err.Error(),
		})
		return
	}

	var timestamps []models.Timestamp
	err = v.db.DB.NewSelect().
		Model(&timestamps).
		Where("user_id = ? AND video_id = ? AND deleted_at IS NULL", userID, videoID).
		Order("timestamp ASC").
		Scan(ctx)

	if err != nil {
		timestamps = []models.Timestamp{}
	}

	middleware.RespondWithOK(c, gin.H{
		"video":           video,
		"timestamps":      timestamps,
		"timestamp_count": len(timestamps),
	})
}

func (v *VideoHandlers) DeleteVideo(c *gin.Context) {
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

	_, err = v.db.DB.NewUpdate().
		Model((*models.Video)(nil)).
		Set("deleted_at = NOW()").
		Where("user_id = ? AND video_id = ? AND deleted_at IS NULL", userID, videoID).
		Exec(ctx)

	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_ERROR", "Failed to delete video", gin.H{
			"error": err.Error(),
		})
		return
	}

	_, err = v.db.DB.NewUpdate().
		Model((*models.Timestamp)(nil)).
		Set("deleted_at = NOW()").
		Where("user_id = ? AND video_id = ? AND deleted_at IS NULL", userID, videoID).
		Exec(ctx)

	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_ERROR", "Failed to delete video timestamps", gin.H{
			"error": err.Error(),
		})
		return
	}

	middleware.RespondWithOK(c, gin.H{
		"message": "Video and all associated timestamps deleted successfully",
	})
}

func (v *VideoHandlers) GetRecentVideos(c *gin.Context) {
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

	limit := 10
	if param := c.Query("limit"); param != "" {
		if parsed, err := strconv.Atoi(param); err == nil && parsed > 0 && parsed <= 50 {
			limit = parsed
		}
	}

	ctx := context.Background()

	var videos []models.Video
	err = v.db.DB.NewSelect().
		Model(&videos).
		Where("user_id = ? AND deleted_at IS NULL", userID).
		Order("created_at DESC").
		Limit(limit).
		Scan(ctx)

	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_READ_ERROR", "Failed to fetch recent videos", gin.H{
			"error": err.Error(),
		})
		return
	}

	middleware.RespondWithOK(c, gin.H{
		"videos": videos,
		"count":  len(videos),
	})
}

func (v *VideoHandlers) CreateOrUpdateVideo(ctx context.Context, userID uuid.UUID, videoID string, title string) error {
	var existingVideo models.Video
	err := v.db.DB.NewSelect().
		Model(&existingVideo).
		Where("user_id = ? AND video_id = ?", userID, videoID).
		Scan(ctx)

	if err != nil {
		canAdd, err := v.featureUsageService.CheckUsageLimit(ctx, userID, "videos")
		if err != nil {
			return err
		}
		if !canAdd {
			return fmt.Errorf("video limit exceeded for your current plan")
		}

		video := &models.Video{
			UserID:  userID,
			VideoID: videoID,
			Title:   title,
		}

		_, err = v.db.DB.NewInsert().
			Model(video).
			Exec(ctx)

		if err != nil {
			return err
		}

		err = v.featureUsageService.IncrementUsage(ctx, userID, "videos")
		if err != nil {
			log.Printf("Warning: Failed to increment video usage: %v", err)
		}

		return nil
	}

	return nil
}

func (v *VideoHandlers) VideoExists(ctx context.Context, userID uuid.UUID, videoID string) (bool, error) {
	count, err := v.db.DB.NewSelect().
		Model((*models.Video)(nil)).
		Where("user_id = ? AND video_id = ? AND deleted_at IS NULL", userID, videoID).
		Count(ctx)

	if err != nil {
		return false, err
	}

	return count > 0, nil
}

func (v *VideoHandlers) CreateVideoIfNotExists(ctx context.Context, userID uuid.UUID, videoID string, youtubeURL string, title string) error {
	exists, err := v.VideoExists(ctx, userID, videoID)
	if err != nil {
		return err
	}

	if !exists {
		// Check usage limit before creating video
		canAdd, err := v.featureUsageService.CheckUsageLimit(ctx, userID, "videos")
		if err != nil {
			return err
		}
		if !canAdd {
			return fmt.Errorf("video limit exceeded for your current plan")
		}

		video := &models.Video{
			UserID:     userID,
			VideoID:    videoID,
			YouTubeURL: youtubeURL,
			Title:      title,
		}

		_, err = v.db.DB.NewInsert().
			Model(video).
			Exec(ctx)

		if err != nil {
			return err
		}

		err = v.featureUsageService.IncrementUsage(ctx, userID, "videos")
		if err != nil {
			// Log error but don't fail the video creation
			log.Printf("Warning: Failed to increment video usage: %v", err)
		}

		return nil
	}

	return nil
}

func (v *VideoHandlers) GetVideoByYouTubeURL(ctx context.Context, userID uuid.UUID, youtubeURL string) (*models.Video, error) {
	var video models.Video
	err := v.db.DB.NewSelect().
		Model(&video).
		Where("user_id = ? AND youtube_url = ? AND deleted_at IS NULL", userID, youtubeURL).
		Scan(ctx)

	if err != nil {
		return nil, err
	}

	return &video, nil
}

func (v *VideoHandlers) UpdateVideoMetadata(ctx context.Context, userID uuid.UUID, videoID string, youtubeURL string, title string) error {
	_, err := v.db.DB.NewUpdate().
		Model((*models.Video)(nil)).
		Set("youtube_url = ?", youtubeURL).
		Set("title = ?", title).
		Set("updated_at = NOW()").
		Where("user_id = ? AND video_id = ? AND deleted_at IS NULL", userID, videoID).
		Exec(ctx)

	return err
}

func (v *VideoHandlers) UpdateVideoMetadataHandler(c *gin.Context) {
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
		VideoID      string  `json:"video_id" binding:"required"`
		YouTubeURL   string  `json:"youtube_url" binding:"required"`
		Title        string  `json:"title" binding:"required"`
		Duration     *int    `json:"duration"`
		ThumbnailURL *string `json:"thumbnail_url"`
		ChannelTitle *string `json:"channel_title"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body", gin.H{
			"error": err.Error(),
		})
		return
	}

	ctx := context.Background()

	exists, err = v.VideoExists(ctx, userID, req.VideoID)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_ERROR", "Failed to check video existence", gin.H{
			"error": err.Error(),
		})
		return
	}

	if !exists {
		canAdd, err := v.featureUsageService.CheckUsageLimit(ctx, userID, "videos")
		if err != nil {
			middleware.RespondWithError(c, http.StatusInternalServerError, "USAGE_CHECK_ERROR", "Failed to check usage limit", gin.H{
				"error": err.Error(),
			})
			return
		}
		if !canAdd {
			middleware.RespondWithError(c, http.StatusForbidden, "USAGE_LIMIT_EXCEEDED", "Video limit exceeded for your current plan", gin.H{
				"feature": "videos",
			})
			return
		}

		video := &models.Video{
			UserID:     userID,
			VideoID:    req.VideoID,
			YouTubeURL: req.YouTubeURL,
			Title:      req.Title,
		}

		// Set optional fields if provided
		if req.Duration != nil {
			video.Duration = *req.Duration
		}
		if req.ThumbnailURL != nil {
			video.ThumbnailURL = *req.ThumbnailURL
		}
		if req.ChannelTitle != nil {
			video.ChannelTitle = *req.ChannelTitle
		}

		_, err = v.db.DB.NewInsert().
			Model(video).
			Exec(ctx)

		if err != nil {
			middleware.RespondWithError(c, http.StatusInternalServerError, "DB_ERROR", "Failed to create video", gin.H{
				"error": err.Error(),
			})
			return
		}

		// Increment usage after successful video creation
		err = v.featureUsageService.IncrementUsage(ctx, userID, "videos")
		if err != nil {
			log.Printf("Warning: Failed to increment video usage: %v", err)
		}

		middleware.RespondWithOK(c, gin.H{
			"message": "Video created successfully",
			"video":   video,
		})
		return
	}

	updateQuery := v.db.DB.NewUpdate().
		Model((*models.Video)(nil)).
		Set("youtube_url = ?", req.YouTubeURL).
		Set("title = ?", req.Title).
		Set("updated_at = NOW()").
		Where("user_id = ? AND video_id = ? AND deleted_at IS NULL", userID, req.VideoID)

	// Add optional fields to update
	if req.Duration != nil {
		updateQuery = updateQuery.Set("duration = ?", *req.Duration)
	}
	if req.ThumbnailURL != nil {
		updateQuery = updateQuery.Set("thumbnail_url = ?", *req.ThumbnailURL)
	}
	if req.ChannelTitle != nil {
		updateQuery = updateQuery.Set("channel_title = ?", *req.ChannelTitle)
	}

	_, updateErr := updateQuery.Exec(ctx)
	if updateErr != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_ERROR", "Failed to update video metadata", gin.H{
			"error": updateErr.Error(),
		})
		return
	}

	middleware.RespondWithOK(c, gin.H{
		"message": "Video metadata updated successfully",
	})
}

func (v *VideoHandlers) GetOrCreateVideoByYouTubeURL(ctx context.Context, userID uuid.UUID, youtubeURL string, videoID string, title string) (*models.Video, error) {
	video, err := v.GetVideoByYouTubeURL(ctx, userID, youtubeURL)
	if err == nil {
		if video.Title != title {
			_, updateErr := v.db.DB.NewUpdate().
				Model(video).
				Set("title = ?", title).
				Set("updated_at = NOW()").
				Where("id = ?", video.ID).
				Exec(ctx)
			if updateErr != nil {
				return nil, updateErr
			}
			video.Title = title
		}
		return video, nil
	}

	// Check usage limit before creating video
	canAdd, err := v.featureUsageService.CheckUsageLimit(ctx, userID, "videos")
	if err != nil {
		return nil, err
	}
	if !canAdd {
		return nil, fmt.Errorf("video limit exceeded for your current plan")
	}

	newVideo := &models.Video{
		UserID:     userID,
		VideoID:    videoID,
		YouTubeURL: youtubeURL,
		Title:      title,
	}

	_, insertErr := v.db.DB.NewInsert().
		Model(newVideo).
		Exec(ctx)

	if insertErr != nil {
		return nil, insertErr
	}

	err = v.featureUsageService.IncrementUsage(ctx, userID, "videos")
	if err != nil {
		log.Printf("Warning: Failed to increment video usage: %v", err)
	}

	return newVideo, nil
}

func (v *VideoHandlers) UpdateWatchedDurationHandler(c *gin.Context) {
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

	var req struct {
		WatchedDuration int `json:"watched_duration" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body", gin.H{
			"error": err.Error(),
		})
		return
	}

	ctx := context.Background()

	var currentWatchedDuration int
	err = v.db.DB.NewSelect().
		Model((*models.Video)(nil)).
		Column("watched_duration").
		Where("user_id = ? AND video_id = ? AND deleted_at IS NULL", userID, videoID).
		Scan(ctx, &currentWatchedDuration)

	if err != nil {
		if err.Error() == "no rows in result set" {
			// Check usage limit before creating video
			canAdd, err := v.featureUsageService.CheckUsageLimit(ctx, userID, "videos")
			if err != nil {
				middleware.RespondWithError(c, http.StatusInternalServerError, "USAGE_CHECK_ERROR", "Failed to check usage limit", gin.H{
					"error": err.Error(),
				})
				return
			}
			if !canAdd {
				middleware.RespondWithError(c, http.StatusForbidden, "USAGE_LIMIT_EXCEEDED", "Video limit exceeded for your current plan", gin.H{
					"feature": "videos",
				})
				return
			}

			video := &models.Video{
				UserID:          userID,
				VideoID:         videoID,
				WatchedDuration: req.WatchedDuration,
			}

			_, err = v.db.DB.NewInsert().
				Model(video).
				Exec(ctx)

			if err != nil {
				middleware.RespondWithError(c, http.StatusInternalServerError, "DB_ERROR", "Failed to create video with watched duration", gin.H{
					"error": err.Error(),
				})
				return
			}

			err = v.featureUsageService.IncrementUsage(ctx, userID, "videos")
			if err != nil {
				log.Printf("Warning: Failed to increment video usage: %v", err)
			}

			middleware.RespondWithOK(c, gin.H{
				"message":          "Video created with watched duration",
				"watched_duration": req.WatchedDuration,
			})
			return
		}

		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_ERROR", "Failed to get current watched duration", gin.H{
			"error": err.Error(),
		})
		return
	}

	if req.WatchedDuration > currentWatchedDuration {
		_, err = v.db.DB.NewUpdate().
			Model((*models.Video)(nil)).
			Set("watched_duration = ?", req.WatchedDuration).
			Set("updated_at = NOW()").
			Where("user_id = ? AND video_id = ? AND deleted_at IS NULL", userID, videoID).
			Exec(ctx)

		if err != nil {
			middleware.RespondWithError(c, http.StatusInternalServerError, "DB_ERROR", "Failed to update watched duration", gin.H{
				"error": err.Error(),
			})
			return
		}

		middleware.RespondWithOK(c, gin.H{
			"message":          "Watched duration updated successfully",
			"watched_duration": req.WatchedDuration,
		})
	} else {
		middleware.RespondWithOK(c, gin.H{
			"message":          "Watched duration unchanged (no increase)",
			"watched_duration": currentWatchedDuration,
		})
	}
}
