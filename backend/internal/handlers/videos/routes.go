package videos

import (
	"github.com/gin-gonic/gin"
	authhandlers "github.com/shubhamku044/ytclipper/internal/handlers/auth"
)

func SetupVideoRoutes(router *gin.RouterGroup, handlers *VideoHandlers, authMiddleware *authhandlers.AuthMiddleware) {
	videoRoutes := router.Group("/ytclipper/videos")
	{
		videoRoutes.Use(authMiddleware.RequireAuth())
		videoRoutes.GET("", handlers.GetAllVideos)
		videoRoutes.GET("/recent", handlers.GetRecentVideos)
		videoRoutes.GET("/:id", handlers.GetVideoByID)
		videoRoutes.DELETE("/:id", handlers.DeleteVideo)
		videoRoutes.DELETE("/:id/hard", handlers.HardDeleteVideo)
		videoRoutes.PUT("/metadata", handlers.UpdateVideoMetadataHandler)

		videoRoutes.PUT("/:id/watched-duration", handlers.UpdateWatchedDurationHandler)
	}
}
