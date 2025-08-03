-- +goose Up
-- +goose StatementBegin
-- Remove unique constraint from google_id

-- Drop the existing unique constraint on google_id
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_google_id_key;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- Recreate the original unique constraint
ALTER TABLE users ADD CONSTRAINT users_google_id_key UNIQUE (google_id);
-- +goose StatementEnd
