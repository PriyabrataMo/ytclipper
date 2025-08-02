package dashboard

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/shubhamku044/ytclipper/internal/database"
	authhandlers "github.com/shubhamku044/ytclipper/internal/handlers/auth"
	"github.com/shubhamku044/ytclipper/internal/middleware"
	"github.com/shubhamku044/ytclipper/internal/models"
)

type DashboardHandlers struct {
	db *database.Database
}

func NewDashboardHandlers(db *database.Database) *DashboardHandlers {
	return &DashboardHandlers{
		db: db,
	}
}

func SetupDashboardRoutes(router *gin.RouterGroup, handlers *DashboardHandlers, authMiddleware *authhandlers.AuthMiddleware) {
	dashboard := router.Group("/dashboard")
	dashboard.Use(authMiddleware.RequireAuth())
	{
		dashboard.GET("/stats", handlers.GetDashboardStats)
		dashboard.GET("/most-used-tags", handlers.GetMostUsedTags)
		dashboard.GET("/recent-videos", handlers.GetRecentVideos)
		dashboard.GET("/recent-activity", handlers.GetRecentActivity)
		dashboard.GET("/recent-notes", handlers.GetRecentNotes)
	}
}

func (d *DashboardHandlers) GetMostUsedTags(c *gin.Context) {
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
	tags, err := d.getMostUsedTags(ctx, userID)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "TAGS_ERROR", "Failed to get most used tags", gin.H{
			"error": err.Error(),
		})
		return
	}

	middleware.RespondWithOK(c, gin.H{"tags": tags})
}

func (d *DashboardHandlers) GetRecentVideos(c *gin.Context) {
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
	videos, err := d.getRecentVideos(ctx, userID)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "VIDEOS_ERROR", "Failed to get recent videos", gin.H{
			"error": err.Error(),
		})
		return
	}

	middleware.RespondWithOK(c, gin.H{"videos": videos})
}

func (d *DashboardHandlers) GetRecentActivity(c *gin.Context) {
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
	activities, err := d.getRecentActivity(ctx, userID)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "ACTIVITY_ERROR", "Failed to get recent activity", gin.H{
			"error": err.Error(),
		})
		return
	}

	middleware.RespondWithOK(c, gin.H{"activities": activities})
}

func (d *DashboardHandlers) GetRecentNotes(c *gin.Context) {
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
	notes, err := d.getRecentNotes(ctx, userID)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "NOTES_ERROR", "Failed to get recent notes", gin.H{
			"error": err.Error(),
		})
		return
	}

	middleware.RespondWithOK(c, gin.H{"notes": notes})
}

func (d *DashboardHandlers) GetDashboardStats(c *gin.Context) {
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
	stats, err := d.getDashboardStats(ctx, userID)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "STATS_ERROR", "Failed to get dashboard stats", gin.H{
			"error": err.Error(),
		})
		return
	}

	middleware.RespondWithOK(c, gin.H{"stats": stats})
}

func (d *DashboardHandlers) getMostUsedTags(ctx context.Context, userID uuid.UUID) ([]gin.H, error) {
	type TagCount struct {
		Name  string `bun:"name"`
		Count int64  `bun:"count"`
	}

	var tagCounts []TagCount
	err := d.db.DB.NewSelect().
		Model((*models.Tag)(nil)).
		ColumnExpr("tags.name, COUNT(*) as count").
		Join("JOIN timestamp_tags tt ON tags.id = tt.tag_id").
		Join("JOIN timestamps ts ON tt.timestamp_id = ts.id").
		Where("ts.user_id = ? AND ts.deleted_at IS NULL AND tags.deleted_at IS NULL", userID).
		Group("tags.id, tags.name").
		Order("count DESC").
		Limit(10).
		Scan(ctx, &tagCounts)
	if err != nil {
		return nil, fmt.Errorf("failed to query most used tags: %w", err)
	}

	tags := make([]gin.H, len(tagCounts))
	for i, tc := range tagCounts {
		tags[i] = gin.H{
			"name":  tc.Name,
			"count": tc.Count,
		}
	}

	return tags, nil
}

func (d *DashboardHandlers) getRecentVideos(ctx context.Context, userID uuid.UUID) ([]gin.H, error) {
	type VideoData struct {
		VideoID         string     `bun:"video_id"`
		Title           string     `bun:"title"`
		ThumbnailURL    string     `bun:"thumbnail_url"`
		Duration        int        `bun:"duration"`
		WatchedDuration int        `bun:"watched_duration"`
		NoteCount       int64      `bun:"note_count"`
		LatestTimestamp *time.Time `bun:"latest_timestamp"`
	}

	var videoData []VideoData
	err := d.db.DB.NewSelect().
		Model((*models.Video)(nil)).
		Column("v.video_id", "v.title", "v.thumbnail_url", "v.duration", "v.watched_duration").
		Column("COUNT(ts.id) as note_count").
		Column("MAX(ts.created_at) as latest_timestamp").
		Join("LEFT JOIN timestamps ts ON v.video_id = ts.video_id AND ts.user_id = ? AND ts.deleted_at IS NULL", userID).
		Where("v.user_id = ? AND v.deleted_at IS NULL", userID).
		Group("v.id, v.video_id, v.title, v.thumbnail_url, v.duration, v.watched_duration").
		Order("latest_timestamp DESC NULLS LAST, v.created_at DESC").
		Limit(5).
		Scan(ctx, &videoData)
	if err != nil {
		return nil, fmt.Errorf("failed to query recent videos: %w", err)
	}

	videos := make([]gin.H, len(videoData))
	for i, vd := range videoData {
		var progress int
		if vd.Duration > 0 {
			progress = int((float64(vd.WatchedDuration) / float64(vd.Duration)) * 100)
		}

		var latestTimestampStr string
		if vd.LatestTimestamp != nil {
			latestTimestampStr = vd.LatestTimestamp.Format(time.RFC3339)
		}

		videos[i] = gin.H{
			"video_id":         vd.VideoID,
			"title":            vd.Title,
			"thumbnail_url":    vd.ThumbnailURL,
			"duration":         vd.Duration,
			"note_count":       vd.NoteCount,
			"latest_timestamp": latestTimestampStr,
			"watch_progress":   progress,
		}
	}

	return videos, nil
}

func (d *DashboardHandlers) getRecentActivity(ctx context.Context, userID uuid.UUID) ([]gin.H, error) {
	type ActivityData struct {
		Title     string    `bun:"title"`
		CreatedAt time.Time `bun:"created_at"`
	}

	var activityData []ActivityData
	err := d.db.DB.NewSelect().
		Model((*models.Timestamp)(nil)).
		Column("title", "created_at").
		Where("user_id = ? AND deleted_at IS NULL", userID).
		Order("created_at DESC").
		Limit(5).
		Scan(ctx, &activityData)
	if err != nil {
		return nil, fmt.Errorf("failed to query recent activity: %w", err)
	}

	activities := make([]gin.H, len(activityData))
	for i, ad := range activityData {
		activities[i] = gin.H{
			"title":     ad.Title,
			"timestamp": ad.CreatedAt.Format(time.RFC3339),
			"duration":  300, // This seems like a hardcoded value - consider making it dynamic
		}
	}

	return activities, nil
}

func (d *DashboardHandlers) getRecentNotes(ctx context.Context, userID uuid.UUID) ([]gin.H, error) {
	type NoteData struct {
		ID         string    `bun:"id"`
		Title      string    `bun:"title"`
		CreatedAt  time.Time `bun:"created_at"`
		VideoTitle *string   `bun:"video_title"`
	}

	var noteData []NoteData
	err := d.db.DB.NewSelect().
		Model((*models.Timestamp)(nil)).
		Column("timestamps.id", "timestamps.title", "timestamps.created_at").
		Column("v.title as video_title").
		Join("LEFT JOIN videos v ON timestamps.video_id = v.video_id AND v.user_id = timestamps.user_id AND v.deleted_at IS NULL").
		Where("timestamps.user_id = ? AND timestamps.deleted_at IS NULL", userID).
		Order("timestamps.created_at DESC").
		Limit(10).
		Scan(ctx, &noteData)
	if err != nil {
		return nil, fmt.Errorf("failed to query recent notes: %w", err)
	}

	notes := make([]gin.H, len(noteData))
	for i, nd := range noteData {
		var tags []string
		err := d.db.DB.NewSelect().
			Model((*models.Tag)(nil)).
			Column("tags.name").
			Join("JOIN timestamp_tags tt ON tags.id = tt.tag_id").
			Where("tt.timestamp_id = ?", nd.ID).
			Scan(ctx, &tags)
		if err != nil {
			// Log the error but don't fail the entire request
			tags = []string{}
		}

		videoTitle := ""
		if nd.VideoTitle != nil {
			videoTitle = *nd.VideoTitle
		}

		notes[i] = gin.H{
			"id":          nd.ID,
			"title":       nd.Title,
			"video_title": videoTitle,
			"created_at":  nd.CreatedAt.Format(time.RFC3339),
			"tags":        tags,
		}
	}

	return notes, nil
}

func (d *DashboardHandlers) getDashboardStats(ctx context.Context, userID uuid.UUID) (gin.H, error) {
	var totalNotes int64
	count, err := d.db.DB.NewSelect().
		Model((*models.Timestamp)(nil)).
		Where("user_id = ? AND deleted_at IS NULL", userID).
		Count(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get total notes count: %w", err)
	}
	totalNotes = int64(count)

	var weeklyNotes int64
	weekAgo := time.Now().AddDate(0, 0, -7)
	count, err = d.db.DB.NewSelect().
		Model((*models.Timestamp)(nil)).
		Where("user_id = ? AND created_at >= ? AND deleted_at IS NULL", userID, weekAgo).
		Count(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get weekly notes count: %w", err)
	}
	weeklyNotes = int64(count)

	var totalVideos int64
	count, err = d.db.DB.NewSelect().
		Model((*models.Video)(nil)).
		Where("user_id = ? AND deleted_at IS NULL", userID).
		Count(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get total videos count: %w", err)
	}
	totalVideos = int64(count)

	var totalWatchTime int64
	err = d.db.DB.NewSelect().
		Model((*models.Video)(nil)).
		ColumnExpr("SUM(watched_duration)").
		Where("user_id = ? AND deleted_at IS NULL", userID).
		Scan(ctx, &totalWatchTime)
	if err != nil {
		return nil, fmt.Errorf("failed to get total watch time: %w", err)
	}

	if totalWatchTime < 0 {
		totalWatchTime = 0
	}

	return gin.H{
		"total_notes":      totalNotes,
		"videos_watched":   totalVideos,
		"total_watch_time": totalWatchTime,
		"weekly_activity":  weeklyNotes,
	}, nil
}
