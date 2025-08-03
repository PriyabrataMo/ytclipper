-- +goose Up
-- +goose StatementBegin

-- Remove the problematic unique constraint on youtube_url
ALTER TABLE videos DROP CONSTRAINT IF EXISTS videos_youtube_id_key;

-- Create a composite unique constraint on (user_id, youtube_url) if needed
-- This allows the same YouTube URL to exist for different users
CREATE UNIQUE INDEX IF NOT EXISTS idx_videos_user_youtube_url ON videos(user_id, youtube_url);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

-- Drop the composite unique index
DROP INDEX IF EXISTS idx_videos_user_youtube_url;

-- Re-add the global unique constraint (this might fail if there are duplicates)
-- ALTER TABLE videos ADD CONSTRAINT videos_youtube_id_key UNIQUE (youtube_url);

-- +goose StatementEnd
