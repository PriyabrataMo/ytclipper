-- +goose Up
-- +goose StatementBegin

-- Add transcript_embedding column to the videos table
ALTER TABLE videos
ADD COLUMN IF NOT EXISTS transcript_embedding VECTOR(1536);

-- Create an index for fast approximate nearest neighbor search on transcript embeddings
CREATE INDEX IF NOT EXISTS idx_videos_transcript_embedding
ON videos USING ivfflat (transcript_embedding vector_cosine_ops);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP INDEX IF EXISTS idx_videos_transcript_embedding;
ALTER TABLE videos DROP COLUMN IF EXISTS transcript_embedding;
-- +goose StatementEnd
