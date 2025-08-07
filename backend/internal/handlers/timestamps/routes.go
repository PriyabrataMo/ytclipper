package timestamps

import (
	"github.com/gin-gonic/gin"
	authhandlers "github.com/shubhamku044/ytclipper/internal/handlers/auth"
)

func SetupTimestampRoutes(router *gin.RouterGroup, handlers *TimestampsHandlers, authMiddleware *authhandlers.AuthMiddleware) {
	timestampRoutes := router.Group("/timestamps")
	{
		timestampRoutes.Use(authMiddleware.RequireAuth())

		// Get all timestamps
		timestampRoutes.GET("", handlers.GetAllTimestamps)
		timestampRoutes.GET("/", handlers.GetAllTimestamps)

		// Create timestamp
		timestampRoutes.POST("", handlers.CreateTimestamp)
		timestampRoutes.POST("/", handlers.CreateTimestamp)

		// Get timestamps by video ID
		timestampRoutes.GET("/:id", handlers.GetTimestampsByVideoID)

		// Update timestamp
		timestampRoutes.PUT("/:id", handlers.UpdateTimestamp)

		// Delete timestamp
		timestampRoutes.DELETE("/:id", handlers.DeleteTimestamp)

		// Delete multiple timestamps
		timestampRoutes.DELETE("", handlers.DeleteMultipleTimestamps)
		timestampRoutes.DELETE("/", handlers.DeleteMultipleTimestamps)

		// Tags management
		timestampRoutes.GET("/tags", handlers.GetAllTags)
		timestampRoutes.POST("/tags/search", handlers.SearchTags)

		// Search timestamps
		timestampRoutes.POST("/search", handlers.SearchTimestamps)

		// Search transcript embeddings
		timestampRoutes.POST("/search-transcript", handlers.SearchTranscriptEmbeddings)

		// AI features
		timestampRoutes.GET("/summary/:id", handlers.GetVideoSummary)
		timestampRoutes.POST("/full-summary", handlers.GenerateFullVideoSummary)
		timestampRoutes.POST("/question", handlers.AnswerQuestion)

		// Test streaming endpoint
		timestampRoutes.GET("/test-stream", handlers.TestStreaming)

		// Embeddings management
		timestampRoutes.POST("/embeddings/backfill", handlers.BackfillEmbeddingsAsync)
		timestampRoutes.GET("/embeddings/status", handlers.GetEmbeddingStatus)
		timestampRoutes.POST("/embeddings/process-user", handlers.ProcessMissingEmbeddingsForUser)
		timestampRoutes.POST("/embeddings/process-all", handlers.ProcessAllMissingEmbeddings)
	}
}
