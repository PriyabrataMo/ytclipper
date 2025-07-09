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
	Auth0      Auth0Config
	API        APIConfig
	Monitoring MonitoringConfig
}

type Auth0Config struct {
	Domain       string
	ClientID     string
	ClientSecret string
	CallbackURL  string
	Audience     string
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
	Secret string
	Expiry time.Duration
}

type AuthConfig struct {
	JWTSecret           string
	JWTExpiryHours      int
	PasswordResetExpiry time.Duration
	TokenIssuer         string
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
		Auth0: Auth0Config{
			Domain:       getEnv("AUTH0_DOMAIN", ""),
			ClientID:     getEnv("AUTH0_CLIENT_ID", ""),
			ClientSecret: getEnv("AUTH0_CLIENT_SECRET", ""),
			CallbackURL:  getEnv("AUTH0_CALLBACK_URL", "http://localhost:8080/callback"),
			Audience:     getEnv("AUTH0_AUDIENCE", ""),
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
			Secret: getEnv("JWT_SECRET", "development_secret"),
			Expiry: getDurationEnv("JWT_EXPIRY", 24*time.Hour),
		},
		Auth: AuthConfig{
			JWTSecret:           getEnv("AUTH_JWT_SECRET", "ytclipper_secret_key"),
			JWTExpiryHours:      getIntEnv("AUTH_JWT_EXPIRY_HOURS", 72),
			PasswordResetExpiry: getDurationEnv("AUTH_PASSWORD_RESET_EXPIRY", 24*time.Hour),
			TokenIssuer:         getEnv("AUTH_TOKEN_ISSUER", "ytclipper-app"),
		},
		API: APIConfig{
			Timeout:   getDurationEnv("API_TIMEOUT", 30*time.Second),
			RateLimit: getIntEnv("API_RATE_LIMIT", 100),
		},
		Monitoring: MonitoringConfig{
			MetricsEnabled: getBoolEnv("METRICS_ENABLED", false),
			TracingEnabled: getBoolEnv("TRACING_ENABLED", false),
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
