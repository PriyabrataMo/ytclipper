-- +goose Up
-- +goose StatementBegin
-- Create partial unique index (without CONCURRENTLY to avoid transaction issues)
-- This will briefly lock the table but should be quick for small tables
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id_unique 
ON users (google_id) 
WHERE google_id IS NOT NULL AND google_id != '';
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- Drop the partial unique index
DROP INDEX IF EXISTS idx_users_google_id_unique;
-- +goose StatementEnd
