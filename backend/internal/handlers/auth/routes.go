package auth

import (
	"github.com/gin-gonic/gin"
)

func SetupAuthRoutes(r *gin.Engine, authHandlers *AuthHandlers, oauthHandlers *OAuthHandlers, authMiddleware *AuthMiddleware) {
	auth := r.Group("/api/v1/auth")
	{
		auth.POST("/register", authHandlers.RegisterHandler)
		auth.POST("/login", authHandlers.LoginHandler)
		auth.POST("/forgot-password", authHandlers.ForgotPasswordHandler)
		auth.POST("/reset-password", authHandlers.ResetPasswordHandler)
		auth.POST("/refresh", authHandlers.RefreshTokenHandler())

		auth.GET("/google/login", oauthHandlers.LoginHandler())
		auth.GET("/google/callback", oauthHandlers.CallbackHandler())
		auth.POST("/logout", oauthHandlers.LogoutHandler())

		protected := auth.Group("")
		protected.Use(authMiddleware.RequireAuth())
		{
			protected.GET("/me", authHandlers.GetCurrentUserHandler())
			protected.GET("/status", authHandlers.AuthStatusHandler)
			protected.POST("/add-password", authHandlers.AddPasswordHandler)
			protected.GET("/access-token", authHandlers.GetAccessToken())

			protected.POST("/send-otp", authHandlers.SendOTPHandler)
			protected.POST("/verify-otp", authHandlers.VerifyOTPHandler)
		}
	}
}
