package router

import (
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/shubhamku044/clipture/internal/auth"
	"github.com/shubhamku044/clipture/internal/config"
	"github.com/shubhamku044/clipture/internal/database"
	"github.com/shubhamku044/clipture/internal/handlers"
	"github.com/shubhamku044/clipture/internal/middleware"
)

// SetupRouter sets up the router with all routes and middleware
func SetupRouter(db *database.Database, cfg *config.Config) *gin.Engine {
	r := gin.Default()

	// Add middlewares
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))
	r.Use(middleware.ErrorHandler())
	r.Use(middleware.ResponseFormatter())
	r.Use(middleware.RequestLogger())

	// Initialize Auth0 service
	auth0Service, err := auth.NewAuth0Service(&cfg.Auth0)
	if err != nil {
		panic("Failed to initialize Auth0 service: " + err.Error())
	}

	// Add NoRoute handler for proper 404 responses
	r.NoRoute(func(c *gin.Context) {
		middleware.RespondWithError(c, http.StatusNotFound, "NOT_FOUND", "The requested resource could not be found", gin.H{
			"documentation": "/api/docs",
		})
	})

	// Root health check endpoints
	r.GET("/health", handlers.HealthCheck)
	r.GET("/db-health", handlers.DBHealthCheck(db))

	// Auth0 routes
	r.GET("/login", auth0Service.LoginHandler())
	r.GET("/callback", auth0Service.CallbackHandler())
	r.GET("/logout", auth0Service.LogoutHandler())

	// Root welcome page
	r.GET("/", func(c *gin.Context) {
		middleware.RespondWithOK(c, gin.H{
			"name":        "Clipture API",
			"description": "A modern screen capture and annotation service",
			"version":     "1.0.0",
			"status":      "running",
			"endpoints": map[string]string{
				"health":    "/health",
				"db_health": "/db-health",
				"api_v1":    "/api/v1",
			},
			"repository": "https://github.com/shubhamku044/clipture",
		})
	})

	// API v1 routes
	v1 := r.Group("/api/v1")
	{
		// API v1 welcome page
		v1.GET("/", func(c *gin.Context) {
			middleware.RespondWithOK(c, gin.H{
				"name":        "Clipture API",
				"description": "A modern screen capture and annotation service",
				"version":     "1.0.0",
				"status":      "running",
				"endpoints": map[string]string{
					"health":    "/api/v1/health",
					"db_health": "/api/v1/db-health",
				},
			})
		})

		// Health check endpoints
		v1.GET("/health", handlers.HealthCheck)
		v1.GET("/db-health", handlers.DBHealthCheck(db))

		// Auth routes (to be implemented)
		authRoutes := v1.Group("/auth")
		{
			authRoutes.GET("/user", auth0Service.GetUserInfo())
			authRoutes.GET("/logout", auth0Service.LogoutHandler())
		}

		// Protected routes (to be implemented)
		protected := v1.Group("")
		protected.Use(auth.RequireAuth(&cfg.Auth0))
		{
			protected.GET("/profile", func(c *gin.Context) {
				// Get user ID from context
				userID, exists := auth.GetUserID(c)
				if !exists {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "User ID not found"})
					return
				}

				// Get full claims if needed
				claims, exists := auth.GetClaims(c)
				if !exists {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Claims not found"})
					return
				}

				c.JSON(http.StatusOK, gin.H{
					"message":    "This is a protected route",
					"user_id":    userID,
					"email":      claims.RegisteredClaims.Subject,
					"issued_at":  claims.RegisteredClaims.IssuedAt,
					"expires_at": claims.RegisteredClaims.Expiry,
				})
			})
		}
	}

	return r
}
