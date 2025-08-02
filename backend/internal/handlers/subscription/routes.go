package subscription

import (
	"github.com/gin-gonic/gin"
)

func SetupSubscriptionRoutes(router *gin.Engine, subscriptionHandlers *SubscriptionHandlers, authMiddleware interface{}) {
	subscription := router.Group("/api/v1/subscription")
	{
		// Public routes (no auth required)
		subscription.GET("/plans", subscriptionHandlers.GetAvailablePlans)

		// Protected routes (auth required)
		protected := subscription.Group("")
		// protected.Use(authMiddleware.RequireAuth()) // Uncomment when auth middleware is available
		{
			protected.GET("/current", subscriptionHandlers.GetUserSubscription)
			protected.GET("/features", subscriptionHandlers.GetUserFeatures)
			protected.POST("/validate-coupon", subscriptionHandlers.ValidateCoupon)
			protected.POST("/cancel", subscriptionHandlers.CancelSubscription)
			protected.GET("/invoices", subscriptionHandlers.GetSubscriptionInvoices)
		}
	}
}
