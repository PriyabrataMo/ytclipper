package subscription

import (
	"github.com/gin-gonic/gin"
	authhandlers "github.com/shubhamku044/ytclipper/internal/handlers/auth"
)

func SetupSubscriptionRoutes(router *gin.RouterGroup, handlers *SubscriptionHandlers, authMiddleware *authhandlers.AuthMiddleware) {
	subscription := router.Group("/subscription")
	subscription.Use(authMiddleware.RequireAuth())
	{
		subscription.GET("/profile", handlers.GetUserProfile)
		subscription.POST("/purchase", handlers.PurchaseSubscription)
	}
}
