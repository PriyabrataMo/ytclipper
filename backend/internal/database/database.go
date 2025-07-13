package database

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/rs/zerolog/log"
	"github.com/shubhamku044/ytclipper/internal/config"
	"github.com/shubhamku044/ytclipper/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type Database struct {
	DB *gorm.DB
}

// NewDatabase creates a new GORM database connection
func NewDatabase(cfg *config.Config) (*Database, error) {
	var dsn string

	// Check if DATABASE_URL is provided, otherwise build DSN from individual components
	if cfg.Database.URL != "" {
		dsn = cfg.Database.URL
	} else {
		// Build DSN (Data Source Name)
		dsn = fmt.Sprintf(
			"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
			cfg.Database.Host,
			cfg.Database.Port,
			cfg.Database.User,
			cfg.Database.Password,
			cfg.Database.Name,
			cfg.Database.SSLMode,
		)
	}

	// Configure GORM logger
	gormLogger := logger.New(
		&GormLogWriter{}, // Custom log writer that uses zerolog
		logger.Config{
			SlowThreshold:             200 * time.Millisecond,
			LogLevel:                  logger.Info,
			IgnoreRecordNotFoundError: true,
			Colorful:                  false,
		},
	)

	// Configure GORM with retry logic
	var db *gorm.DB
	var err error
	var retryCount int
	maxRetries := 5
	retryDelay := 2 * time.Second

	for retryCount < maxRetries {
		// Open GORM connection
		db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
			Logger: gormLogger,
			NowFunc: func() time.Time {
				return time.Now().UTC()
			},
		})

		if err == nil {
			// Test connection
			sqlDB, err := db.DB()
			if err == nil {
				err = sqlDB.Ping()
				if err == nil {
					// Configure connection pool settings
					sqlDB.SetMaxIdleConns(10)
					sqlDB.SetMaxOpenConns(100)
					sqlDB.SetConnMaxLifetime(time.Hour)
					break
				}
			}
		}

		retryCount++
		log.Warn().
			Err(err).
			Int("retry", retryCount).
			Int("maxRetries", maxRetries).
			Msg("Failed to connect to database, retrying...")

		if retryCount < maxRetries {
			time.Sleep(retryDelay)
			// Exponential backoff
			retryDelay *= 2
		}
	}

	if err != nil {
		return nil, fmt.Errorf("failed to connect to database after %d attempts: %w", maxRetries, err)
	}

	log.Info().
		Str("host", cfg.Database.Host).
		Str("port", cfg.Database.Port).
		Str("database", cfg.Database.Name).
		Str("user", cfg.Database.User).
		Msg("Successfully connected to database")

	return &Database{DB: db}, nil
}

// Close closes the database connection
func (db *Database) Close() {
	if db.DB != nil {
		sqlDB, err := db.DB.DB()
		if err == nil {
			err = sqlDB.Close()
			if err != nil {
				log.Error().Err(err).Msg("Error closing database connection")
			} else {
				log.Info().Msg("Database connection closed")
			}
		}
	}
}

// Ping checks if the database connection is alive
func (db *Database) Ping(ctx context.Context) error {
	sqlDB, err := db.DB.DB()
	if err != nil {
		return err
	}
	return sqlDB.PingContext(ctx)
}

// GormLogWriter is a custom log writer for GORM that uses zerolog
type GormLogWriter struct{}

// Printf implements the logger.Writer interface for GORM
func (w *GormLogWriter) Printf(format string, args ...interface{}) {
	log.Debug().Msgf(format, args...)
}

// MigrationVersion represents a database migration version
type MigrationVersion struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Version   string    `gorm:"unique;not null" json:"version"`
	AppliedAt time.Time `json:"applied_at"`
}

// RunMigrations runs auto-migrations for all models with enhanced error handling
func (db *Database) RunMigrations() error {
	log.Info().Msg("Checking database migrations...")

	// First, ensure the migration_versions table exists
	if err := db.DB.AutoMigrate(&MigrationVersion{}); err != nil {
		log.Error().Err(err).Msg("Failed to create migration_versions table")
		return err
	}

	// Check current migration version
	currentVersion := "v1.2.0" // Update this when you add new migrations
	var existingVersion MigrationVersion

	err := db.DB.Where("version = ?", currentVersion).First(&existingVersion).Error
	if err == nil {
		log.Info().Str("version", currentVersion).Msg("Database is already up to date")
		return nil
	}

	if !errors.Is(err, gorm.ErrRecordNotFound) {
		log.Error().Err(err).Msg("Failed to check migration version")
		return err
	}

	log.Info().Str("version", currentVersion).Msg("Running database migrations...")

	// Handle potential schema conflicts before running migrations
	if err := db.handleSchemaConflicts(); err != nil {
		log.Error().Err(err).Msg("Failed to handle schema conflicts")
		return err
	}

	// Get all models
	modelsToMigrate := models.AllModels()

	// Run auto-migration for all models
	if err := db.DB.AutoMigrate(modelsToMigrate...); err != nil {
		log.Error().Err(err).Msg("Failed to run database migrations")
		return err
	}

	// Record the migration version
	migrationRecord := MigrationVersion{
		Version:   currentVersion,
		AppliedAt: time.Now(),
	}

	if err := db.DB.Create(&migrationRecord).Error; err != nil {
		log.Error().Err(err).Msg("Failed to record migration version")
		return err
	}

	log.Info().Str("version", currentVersion).Msg("Database migrations completed successfully")
	return nil
}

// handleSchemaConflicts handles common schema migration issues
func (db *Database) handleSchemaConflicts() error {
	// Check if we need to handle UUID to bigint conversion
	if err := db.handleUUIDToBigintConversion(); err != nil {
		return err
	}

	// Add more conflict handlers as needed
	return nil
}

// handleUUIDToBigintConversion handles the conversion from uint to UUID for ID columns
func (db *Database) handleUUIDToBigintConversion() error {
	// List of tables that might need uint to UUID conversion
	tables := []string{"users", "refresh_tokens", "user_sessions"}

	for _, table := range tables {
		// Check if table exists
		var exists bool
		err := db.DB.Raw("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = CURRENT_SCHEMA() AND table_name = ?)", table).Scan(&exists).Error
		if err != nil {
			return fmt.Errorf("failed to check if table %s exists: %w", table, err)
		}

		if !exists {
			continue // Table doesn't exist, skip
		}

		// Check if ID column is integer type (uint) or UUID type
		var dataType string
		err = db.DB.Raw(`
			SELECT data_type 
			FROM information_schema.columns 
			WHERE table_schema = CURRENT_SCHEMA() 
			AND table_name = ? 
			AND column_name = 'id'
		`, table).Scan(&dataType).Error

		if err != nil {
			return fmt.Errorf("failed to check column type for table %s: %w", table, err)
		}

		// If ID column is integer type (bigint, integer, etc.) and we need UUID, recreate the table
		if dataType == "bigint" || dataType == "integer" {
			log.Info().Str("table", table).Str("currentType", dataType).Msg("Converting ID column to UUID")

			if err := db.recreateTableWithUUIDs(table); err != nil {
				return fmt.Errorf("failed to recreate table %s: %w", table, err)
			}
		} else if dataType == "uuid" {
			log.Info().Str("table", table).Msg("Table already uses UUID primary key")
		}
	}

	return nil
}

// recreateTableWithUUIDs recreates a table with UUID ID instead of integer or fixes UUID issues
func (db *Database) recreateTableWithUUIDs(tableName string) error {
	// For development, we'll just drop and recreate
	// In production, you'd want to backup data first

	log.Warn().Str("table", tableName).Msg("Dropping table due to incompatible schema change")

	// Drop the table (CASCADE will handle foreign key constraints)
	if err := db.DB.Exec(fmt.Sprintf("DROP TABLE IF EXISTS %s CASCADE", tableName)).Error; err != nil {
		return fmt.Errorf("failed to drop table %s: %w", tableName, err)
	}

	return nil
}

// SafeAddColumn adds a column if it doesn't exist
func (db *Database) SafeAddColumn(tableName, columnName, columnType string) error {
	// Check if column exists
	var exists bool
	err := db.DB.Raw(`
		SELECT EXISTS (
			SELECT FROM information_schema.columns 
			WHERE table_schema = CURRENT_SCHEMA() 
			AND table_name = ? 
			AND column_name = ?
		)
	`, tableName, columnName).Scan(&exists).Error

	if err != nil {
		return fmt.Errorf("failed to check if column exists: %w", err)
	}

	if !exists {
		log.Info().Str("table", tableName).Str("column", columnName).Msg("Adding new column")
		if err := db.DB.Exec(fmt.Sprintf("ALTER TABLE %s ADD COLUMN %s %s", tableName, columnName, columnType)).Error; err != nil {
			return fmt.Errorf("failed to add column %s to table %s: %w", columnName, tableName, err)
		}
	}

	return nil
}

// SafeDropColumn drops a column if it exists
func (db *Database) SafeDropColumn(tableName, columnName string) error {
	// Check if column exists
	var exists bool
	err := db.DB.Raw(`
		SELECT EXISTS (
			SELECT FROM information_schema.columns 
			WHERE table_schema = CURRENT_SCHEMA() 
			AND table_name = ? 
			AND column_name = ?
		)
	`, tableName, columnName).Scan(&exists).Error

	if err != nil {
		return fmt.Errorf("failed to check if column exists: %w", err)
	}

	if exists {
		log.Info().Str("table", tableName).Str("column", columnName).Msg("Dropping column")
		if err := db.DB.Exec(fmt.Sprintf("ALTER TABLE %s DROP COLUMN %s", tableName, columnName)).Error; err != nil {
			return fmt.Errorf("failed to drop column %s from table %s: %w", columnName, tableName, err)
		}
	}

	return nil
}

// SafeRenameColumn renames a column if the old one exists and new one doesn't
func (db *Database) SafeRenameColumn(tableName, oldColumnName, newColumnName string) error {
	// Check if old column exists
	var oldExists bool
	err := db.DB.Raw(`
		SELECT EXISTS (
			SELECT FROM information_schema.columns 
			WHERE table_schema = CURRENT_SCHEMA() 
			AND table_name = ? 
			AND column_name = ?
		)
	`, tableName, oldColumnName).Scan(&oldExists).Error

	if err != nil {
		return fmt.Errorf("failed to check if old column exists: %w", err)
	}

	// Check if new column exists
	var newExists bool
	err = db.DB.Raw(`
		SELECT EXISTS (
			SELECT FROM information_schema.columns 
			WHERE table_schema = CURRENT_SCHEMA() 
			AND table_name = ? 
			AND column_name = ?
		)
	`, tableName, newColumnName).Scan(&newExists).Error

	if err != nil {
		return fmt.Errorf("failed to check if new column exists: %w", err)
	}

	if oldExists && !newExists {
		log.Info().Str("table", tableName).Str("old", oldColumnName).Str("new", newColumnName).Msg("Renaming column")
		if err := db.DB.Exec(fmt.Sprintf("ALTER TABLE %s RENAME COLUMN %s TO %s", tableName, oldColumnName, newColumnName)).Error; err != nil {
			return fmt.Errorf("failed to rename column %s to %s in table %s: %w", oldColumnName, newColumnName, tableName, err)
		}
	}

	return nil
}

// AutoMigrate runs migrations for the provided models
func (db *Database) AutoMigrate(models ...interface{}) error {
	return db.DB.AutoMigrate(models...)
}

// CreateRecord creates a new record in the database
func (db *Database) CreateRecord(value interface{}) error {
	return db.DB.Create(value).Error
}

// FindRecord finds a record by its primary key
func (db *Database) FindRecord(dest interface{}, primaryKey interface{}) error {
	return db.DB.First(dest, primaryKey).Error
}

// UpdateRecord updates a record in the database
func (db *Database) UpdateRecord(value interface{}) error {
	return db.DB.Save(value).Error
}

// DeleteRecord deletes a record from the database
func (db *Database) DeleteRecord(value interface{}) error {
	return db.DB.Delete(value).Error
}
