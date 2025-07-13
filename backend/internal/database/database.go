// Package database for connection and migrations
package database

import (
	"context"
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

func NewDatabase(cfg *config.Config) (*Database, error) {
	var dsn string

	if cfg.Database.URL != "" {
		dsn = cfg.Database.URL
	} else {
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

	gormLogger := logger.New(
		&GormLogWriter{},
		logger.Config{
			SlowThreshold:             200 * time.Millisecond,
			LogLevel:                  logger.Info,
			IgnoreRecordNotFoundError: true,
			Colorful:                  false,
		},
	)

	var db *gorm.DB
	var err error
	var retryCount int
	maxRetries := 5
	retryDelay := 2 * time.Second

	for retryCount < maxRetries {
		db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
			Logger: gormLogger,
			NowFunc: func() time.Time {
				return time.Now().UTC()
			},
		})

		if err == nil {
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

func (db *Database) Ping(ctx context.Context) error {
	sqlDB, err := db.DB.DB()
	if err != nil {
		return err
	}
	return sqlDB.PingContext(ctx)
}

type GormLogWriter struct{}

func (w *GormLogWriter) Printf(format string, args ...interface{}) {
	log.Debug().Msgf(format, args...)
}

func (d *Database) RunMigrations() error {
	return d.DB.AutoMigrate(models.AllModels()...)
}

func (d *Database) Create(value interface{}) error {
	return d.DB.Create(value).Error
}

func (d *Database) Find(dest interface{}, id interface{}) error {
	return d.DB.First(dest, id).Error
}

func (d *Database) Update(value interface{}) error {
	return d.DB.Save(value).Error
}

func (d *Database) Delete(value interface{}) error {
	return d.DB.Delete(value).Error
}
