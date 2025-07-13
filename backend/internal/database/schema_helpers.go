package database

import (
	"fmt"

	"github.com/rs/zerolog/log"
)

type SchemaChangeHelper struct {
	db *Database
}

func NewSchemaChangeHelper(db *Database) *SchemaChangeHelper {
	return &SchemaChangeHelper{db: db}
}

func (h *SchemaChangeHelper) AddColumnIfNotExists(tableName, columnName, columnType string) error {
	return h.db.SafeAddColumn(tableName, columnName, columnType)
}

func (h *SchemaChangeHelper) DropColumnIfExists(tableName, columnName string) error {
	return h.db.SafeDropColumn(tableName, columnName)
}

func (h *SchemaChangeHelper) RenameColumnIfExists(tableName, oldColumnName, newColumnName string) error {
	return h.db.SafeRenameColumn(tableName, oldColumnName, newColumnName)
}

func (h *SchemaChangeHelper) ChangeColumnType(tableName, columnName, newType string) error {
	var exists bool
	err := h.db.DB.Raw(`
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
		return fmt.Errorf("column %s does not exist in table %s", columnName, tableName)
	}

	// Get current column type
	var currentType string
	err = h.db.DB.Raw(`
		SELECT data_type 
		FROM information_schema.columns 
		WHERE table_schema = CURRENT_SCHEMA() 
		AND table_name = ? 
		AND column_name = ?
	`, tableName, columnName).Scan(&currentType).Error

	if err != nil {
		return fmt.Errorf("failed to get current column type: %w", err)
	}

	// If types are the same, no need to change
	if currentType == newType {
		log.Info().Str("table", tableName).Str("column", columnName).Msg("Column type already matches, skipping")
		return nil
	}

	log.Info().Str("table", tableName).Str("column", columnName).Str("from", currentType).Str("to", newType).Msg("Changing column type")

	// Attempt to change column type
	if err := h.db.DB.Exec(fmt.Sprintf("ALTER TABLE %s ALTER COLUMN %s TYPE %s", tableName, columnName, newType)).Error; err != nil {
		return fmt.Errorf("failed to change column type for %s.%s from %s to %s: %w", tableName, columnName, currentType, newType, err)
	}

	return nil
}

// CreateIndexIfNotExists creates an index if it doesn't exist
func (h *SchemaChangeHelper) CreateIndexIfNotExists(indexName, tableName, columnName string) error {
	// Check if index exists
	var exists bool
	err := h.db.DB.Raw(`
		SELECT EXISTS (
			SELECT FROM pg_indexes 
			WHERE tablename = ? 
			AND indexname = ? 
			AND schemaname = CURRENT_SCHEMA()
		)
	`, tableName, indexName).Scan(&exists).Error

	if err != nil {
		return fmt.Errorf("failed to check if index exists: %w", err)
	}

	if !exists {
		log.Info().Str("index", indexName).Str("table", tableName).Str("column", columnName).Msg("Creating index")
		if err := h.db.DB.Exec(fmt.Sprintf("CREATE INDEX %s ON %s(%s)", indexName, tableName, columnName)).Error; err != nil {
			return fmt.Errorf("failed to create index %s on %s(%s): %w", indexName, tableName, columnName, err)
		}
	}

	return nil
}

// DropIndexIfExists drops an index if it exists
func (h *SchemaChangeHelper) DropIndexIfExists(indexName string) error {
	// Check if index exists
	var exists bool
	err := h.db.DB.Raw(`
		SELECT EXISTS (
			SELECT FROM pg_indexes 
			WHERE indexname = ? 
			AND schemaname = CURRENT_SCHEMA()
		)
	`, indexName).Scan(&exists).Error

	if err != nil {
		return fmt.Errorf("failed to check if index exists: %w", err)
	}

	if exists {
		log.Info().Str("index", indexName).Msg("Dropping index")
		if err := h.db.DB.Exec(fmt.Sprintf("DROP INDEX %s", indexName)).Error; err != nil {
			return fmt.Errorf("failed to drop index %s: %w", indexName, err)
		}
	}

	return nil
}
