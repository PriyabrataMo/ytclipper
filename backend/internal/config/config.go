package config

import (
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
	"github.com/rs/zerolog/log"
)

type Config struct {
	Server     ServerConfig
	Logger     LoggerConfig
	Database   DatabaseConfig
	JWT        JWTConfig
	Auth       AuthConfig
	Google     GoogleOAuthConfig
	API        APIConfig
	Monitoring MonitoringConfig
	OpenAI     OpenAIConfig
	Email      EmailConfig
}

type EmailConfig struct {
	SMTPHost     string
	SMTPPort     int
	SMTPUsername string
	SMTPPassword string
	FromEmail    string
	FromName     string
	UseTLS       bool
	UseSSL       bool
}

type OpenAIConfig struct {
	APIKey         string
	EmbeddingModel string
}
type GoogleOAuthConfig struct {
	ClientID     string
	ClientSecret string
	RedirectURL  string
}

type ServerConfig struct {
	Port string
	Env  string
}

type LoggerConfig struct {
	Level      string
	Pretty     bool
	TimeFormat string
}

type DatabaseConfig struct {
	URL      string // Full database URL (postgresql://user:pass@host:port/db)
	Host     string
	Port     string
	Name     string
	User     string
	Password string
	SSLMode  string
}

type JWTConfig struct {
	Secret             string
	AccessTokenExpiry  time.Duration
	RefreshTokenExpiry time.Duration
	TokenIssuer        string
	TokenAudience      string
}

type AuthConfig struct {
	JWTSecret           string
	JWTExpiryHours      int
	PasswordResetExpiry time.Duration
	TokenIssuer         string
	CookieDomain        string
	CookieSecure        bool
	CookieHTTPOnly      bool
}

type APIConfig struct {
	Timeout   time.Duration
	RateLimit int
}

type MonitoringConfig struct {
	MetricsEnabled bool
	TracingEnabled bool
}

func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Warn().Err(err).Msg("Error loading .env file, using environment variables")
	}

	return &Config{
		Google: GoogleOAuthConfig{
			ClientID:     getEnv("GOOGLE_CLIENT_ID", ""),
			ClientSecret: getEnv("GOOGLE_CLIENT_SECRET", ""),
			RedirectURL:  getEnv("GOOGLE_REDIRECT_URI", "http://localhost:8080/api/v1/auth/google/callback"),
		},
		Server: ServerConfig{
			Port: getEnv("PORT", "8080"),
			Env:  getEnv("ENV", "development"),
		},
		Logger: LoggerConfig{
			Level:      getEnv("LOG_LEVEL", "debug"),
			Pretty:     getBoolEnv("LOG_PRETTY", true),
			TimeFormat: time.RFC3339,
		},
		Database: DatabaseConfig{
			URL:      getEnv("DATABASE_URL", ""),
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			Name:     getEnv("DB_NAME", "ytclipper"),
			User:     getEnv("DB_USER", "postgres"),
			Password: getEnv("DB_PASSWORD", "postgres"),
			SSLMode:  getEnv("DB_SSL_MODE", "disable"),
		},
		JWT: JWTConfig{
			Secret:             getEnv("JWT_SECRET", "ytclipper_jwt_secret_key"),
			AccessTokenExpiry:  getDurationEnv("JWT_ACCESS_TOKEN_EXPIRY", 15*time.Minute),
			RefreshTokenExpiry: getDurationEnv("JWT_REFRESH_TOKEN_EXPIRY", 7*24*time.Hour),
			TokenIssuer:        getEnv("JWT_ISSUER", "ytclipper-api"),
			TokenAudience:      getEnv("JWT_AUDIENCE", "ytclipper-app"),
		},
		Auth: AuthConfig{
			JWTSecret:           getEnv("AUTH_JWT_SECRET", "ytclipper_secret_key"),
			JWTExpiryHours:      getIntEnv("AUTH_JWT_EXPIRY_HOURS", 72),
			PasswordResetExpiry: getDurationEnv("AUTH_PASSWORD_RESET_EXPIRY", 24*time.Hour),
			TokenIssuer:         getEnv("AUTH_TOKEN_ISSUER", "ytclipper-app"),
			CookieDomain:        getEnv("COOKIE_DOMAIN", ""),
			CookieSecure:        getBoolEnv("COOKIE_SECURE", false),
			CookieHTTPOnly:      getBoolEnv("COOKIE_HTTP_ONLY", true),
		},
		API: APIConfig{
			Timeout:   getDurationEnv("API_TIMEOUT", 30*time.Second),
			RateLimit: getIntEnv("API_RATE_LIMIT", 100),
		},
		Monitoring: MonitoringConfig{
			MetricsEnabled: getBoolEnv("METRICS_ENABLED", false),
			TracingEnabled: getBoolEnv("TRACING_ENABLED", false),
		},
		OpenAI: OpenAIConfig{
			APIKey:         getEnv("OPENAI_API_KEY", ""),
			EmbeddingModel: getEnv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small"),
		},
		Email: EmailConfig{
			SMTPHost:     getEnv("SMTP_HOST", "smtp.gmail.com"),
			SMTPPort:     getIntEnv("SMTP_PORT", 587),
			SMTPUsername: getEnv("SMTP_USERNAME", ""),
			SMTPPassword: getEnv("SMTP_PASSWORD", ""),
			FromEmail:    getEnv("SMTP_FROM_EMAIL", ""),
			FromName:     getEnv("SMTP_FROM_NAME", "YT Clipper"),
			UseTLS:       getBoolEnv("SMTP_USE_TLS", true),
			UseSSL:       getBoolEnv("SMTP_USE_SSL", false),
		},
	}
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return strings.TrimSpace(value)
}

func getBoolEnv(key string, defaultValue bool) bool {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}

	parsedValue, err := strconv.ParseBool(strings.TrimSpace(value))
	if err != nil {
		return defaultValue
	}

	return parsedValue
}

func getIntEnv(key string, defaultValue int) int {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}

	parsedValue, err := strconv.Atoi(strings.TrimSpace(value))
	if err != nil {
		return defaultValue
	}

	return parsedValue
}

func getDurationEnv(key string, defaultValue time.Duration) time.Duration {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}

	parsedValue, err := time.ParseDuration(strings.TrimSpace(value))
	if err != nil {
		return defaultValue
	}

	return parsedValue
}
