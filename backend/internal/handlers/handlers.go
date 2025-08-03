package handlers

import (
	"context"
	"net"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"github.com/shubhamku044/ytclipper/internal/database"
	"github.com/shubhamku044/ytclipper/internal/middleware"
)

type UserInfo struct {
	ID        string `json:"id"`
	Email     string `json:"email"`
	Name      string `json:"name,omitempty"`
	CreatedAt string `json:"created_at,omitempty"`
}

func HealthCheck(c *gin.Context) {
	middleware.RespondWithOK(c, gin.H{
		"status":    "healthy",
		"timestamp": time.Now().UTC(),
		"service":   "ytclipper-backend",
		"version":   "1.0.0",
	})
}

func DBHealthCheck(db *database.Database) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		status := "healthy"
		var err error

		if db != nil && db.DB != nil {
			err = db.Ping(ctx)
			if err != nil {
				status = "unhealthy"
			}
		} else {
			status = "disconnected"
		}

		if err != nil {
			middleware.RespondWithError(c, http.StatusServiceUnavailable, "DB_UNHEALTHY", "Database is not healthy", gin.H{
				"error": err.Error(),
			})
			return
		}

		middleware.RespondWithOK(c, gin.H{
			"status":    status,
			"timestamp": time.Now().UTC(),
			"database":  "postgresql",
		})
	}
}

func VerifyToken(c *gin.Context) {
	// This function is now handled by the auth handlers
	// Redirect to the auth status endpoint
	middleware.RespondWithOK(c, gin.H{
		"message":  "Token verification is handled by auth handlers",
		"endpoint": "/api/v1/auth/status",
	})
}

func GetUserProfile(c *gin.Context) {
	// This function is now handled by the auth handlers
	// Redirect to the auth user endpoint
	middleware.RespondWithOK(c, gin.H{
		"message":  "User profile is handled by auth handlers",
		"endpoint": "/api/v1/auth/me",
	})
}

func GetSession(c *gin.Context) {
	// This function is now handled by the auth handlers
	// Redirect to the auth session endpoint
	middleware.RespondWithOK(c, gin.H{
		"message":  "Session info is handled by auth handlers",
		"endpoint": "/api/v1/auth/status",
	})
}

type Handlers struct {
	// Add any dependencies here if needed
}

func NewHandlers() *Handlers {
	return &Handlers{}
}

// DNSDebugHandler helps diagnose DNS and network connectivity issues
func DNSDebugHandler(c *gin.Context) {
	results := make(map[string]interface{})

	// Test basic internet connectivity
	log.Info().Msg("Testing basic internet connectivity")
	_, err := net.DialTimeout("tcp", "8.8.8.8:53", 5*time.Second)
	if err != nil {
		log.Error().Err(err).Msg("Cannot reach Google DNS server")
		results["google_dns_connectivity"] = map[string]interface{}{
			"status": "failed",
			"error":  err.Error(),
		}
	} else {
		log.Info().Msg("Can reach Google DNS server")
		results["google_dns_connectivity"] = map[string]interface{}{
			"status": "success",
		}
	}

	// Test DNS resolution for Google OAuth
	log.Info().Msg("Testing DNS resolution for oauth2.googleapis.com")
	ips, err := net.LookupHost("oauth2.googleapis.com")
	if err != nil {
		log.Error().Err(err).Msg("DNS resolution failed for oauth2.googleapis.com")
		results["oauth2_googleapis_dns"] = map[string]interface{}{
			"status": "failed",
			"error":  err.Error(),
		}
	} else {
		log.Info().Strs("ips", ips).Msg("DNS resolution successful for oauth2.googleapis.com")
		results["oauth2_googleapis_dns"] = map[string]interface{}{
			"status": "success",
			"ips":    ips,
		}
	}

	// Test DNS resolution for Google APIs
	log.Info().Msg("Testing DNS resolution for www.googleapis.com")
	ips, err = net.LookupHost("www.googleapis.com")
	if err != nil {
		log.Error().Err(err).Msg("DNS resolution failed for www.googleapis.com")
		results["www_googleapis_dns"] = map[string]interface{}{
			"status": "failed",
			"error":  err.Error(),
		}
	} else {
		log.Info().Strs("ips", ips).Msg("DNS resolution successful for www.googleapis.com")
		results["www_googleapis_dns"] = map[string]interface{}{
			"status": "success",
			"ips":    ips,
		}
	}

	// Test HTTP connectivity to Google OAuth
	log.Info().Msg("Testing HTTP connectivity to oauth2.googleapis.com")
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get("https://oauth2.googleapis.com")
	if err != nil {
		log.Error().Err(err).Msg("HTTP connectivity failed for oauth2.googleapis.com")
		results["oauth2_googleapis_http"] = map[string]interface{}{
			"status": "failed",
			"error":  err.Error(),
		}
	} else {
		defer resp.Body.Close()
		log.Info().Int("status_code", resp.StatusCode).Msg("HTTP connectivity successful for oauth2.googleapis.com")
		results["oauth2_googleapis_http"] = map[string]interface{}{
			"status":      "success",
			"status_code": resp.StatusCode,
		}
	}

	middleware.RespondWithOK(c, gin.H{
		"dns_debug": results,
		"timestamp": time.Now().UTC(),
	})
}
