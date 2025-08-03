-- +goose Up
-- +goose StatementBegin
-- Remove unique constraint from youtube_url column
ALTER TABLE videos DROP CONSTRAINT IF EXISTS videos_youtube_url_key;

-- If the constraint has a different name, you might need to find it first:
-- SELECT constraint_name FROM information_schema.table_constraints 
-- WHERE table_name = 'videos' AND constraint_type = 'UNIQUE';


-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

-- Re-add unique constraint to youtube_url column
ALTER TABLE videos ADD CONSTRAINT videos_youtube_url_key UNIQUE (youtube_url);

-- +goose StatementEnd
