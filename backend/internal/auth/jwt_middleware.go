package auth

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	jwtmiddleware "github.com/auth0/go-jwt-middleware/v2"
	"github.com/auth0/go-jwt-middleware/v2/jwks"
	"github.com/auth0/go-jwt-middleware/v2/validator"
	"github.com/gin-gonic/gin"
	"github.com/shubhamku044/clipture/internal/config"
	"github.com/shubhamku044/clipture/internal/middleware"
)

// CustomClaims contains custom data we want from the token.
type CustomClaims struct {
	Scope string `json:"scope"`
}

// Validate does nothing for this example, but we need
// it to satisfy validator.CustomClaims interface.
func (c CustomClaims) Validate(ctx context.Context) error {
	return nil
}

func JWTMiddleware(cfg *config.Auth0Config) gin.HandlerFunc {
	issuerURL, err := url.Parse("https://" + cfg.Domain + "/")
	if err != nil {
		panic(fmt.Sprintf("Failed to parse the issuer url: %v", err))
	}

	provider := jwks.NewCachingProvider(issuerURL, 5*time.Minute)

	jwtValidator, err := validator.New(
		provider.KeyFunc,
		validator.RS256,
		issuerURL.String(),
		[]string{cfg.Audience},
		validator.WithCustomClaims(
			func() validator.CustomClaims {
				return &CustomClaims{}
			},
		),
		validator.WithAllowedClockSkew(time.Minute),
	)
	if err != nil {
		panic(fmt.Sprintf("Failed to set up the jwt validator: %v", err))
	}

	jwtMiddleware := jwtmiddleware.New(
		jwtValidator.ValidateToken,
		jwtmiddleware.WithErrorHandler(func(w http.ResponseWriter, r *http.Request, err error) {
			// This is handled by Gin, so we'll convert it
		}),
		jwtmiddleware.WithTokenExtractor(func(r *http.Request) (string, error) {
			// Extract token from Authorization header
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				return "", fmt.Errorf("authorization header is required")
			}

			// Check if it starts with "Bearer "
			if !strings.HasPrefix(authHeader, "Bearer ") {
				return "", fmt.Errorf("authorization header must start with Bearer")
			}

			// Extract the token
			token := strings.TrimPrefix(authHeader, "Bearer ")
			if token == "" {
				return "", fmt.Errorf("token is required")
			}

			return token, nil
		}),
	)

	return func(c *gin.Context) {
		var handler http.HandlerFunc = func(w http.ResponseWriter, r *http.Request) {
			c.Next()
		}

		// Wrap with JWT middleware
		jwtMiddleware.CheckJWT(handler).ServeHTTP(c.Writer, c.Request)

		// Check if there was an error during JWT validation
		if c.Writer.Written() {
			return
		}

		// If we get here, the JWT was valid
		// The validated claims are available in the request context
		claims := c.Request.Context().Value(jwtmiddleware.ContextKey{}).(*validator.ValidatedClaims)

		// Store user ID in Gin context for use in handlers
		if claims != nil && claims.RegisteredClaims.Subject != "" {
			c.Set("user_id", claims.RegisteredClaims.Subject)
		}
	}
}

// RequireAuth is a Gin middleware that requires authentication
func RequireAuth(cfg *config.Auth0Config) gin.HandlerFunc {
	jwtMiddleware := JWTMiddleware(cfg)

	return func(c *gin.Context) {
		// Try JWT first
		jwtMiddleware(c)

		// If JWT failed, check for session cookie (for web app)
		if c.Writer.Written() {
			// JWT failed, try session authentication
			if _, err := c.Cookie("id_token"); err == nil {
				// Has session, continue
				c.Next()
				return
			}

			// No valid authentication found
			middleware.RespondWithError(c, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required", nil)
			c.Abort()
			return
		}

		// JWT was successful, continue
		c.Next()
	}
}

func GetUserID(c *gin.Context) (string, bool) {
	userID, exists := c.Get("user_id")
	if !exists {
		return "", false
	}

	userIDStr, ok := userID.(string)
	return userIDStr, ok
}

func GetClaims(c *gin.Context) (*validator.ValidatedClaims, bool) {
	claims, exists := c.Get("claims")
	if !exists {
		return nil, false
	}

	validatedClaims, ok := claims.(*validator.ValidatedClaims)
	return validatedClaims, ok
}
