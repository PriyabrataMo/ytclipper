-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS transcript_embeddings (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    video_id VARCHAR(255) NOT NULL,
    chunk_index INT NOT NULL,
    start_time FLOAT,
    end_time FLOAT,
    text TEXT NOT NULL,
    embedding VECTOR(1536), -- 1536 for OpenAI text-embedding-3-small
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Ensure unique chunks per video
    UNIQUE(video_id, user_id, chunk_index)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_transcript_embeddings_video_user 
ON transcript_embeddings(video_id, user_id);

CREATE INDEX IF NOT EXISTS idx_transcript_embeddings_time_range 
ON transcript_embeddings(video_id, start_time, end_time);

-- Create vector similarity search index
CREATE INDEX IF NOT EXISTS idx_transcript_embeddings_vector
ON transcript_embeddings USING ivfflat (embedding vector_cosine_ops);

-- Create index for soft deletes
CREATE INDEX IF NOT EXISTS idx_transcript_embeddings_deleted_at 
ON transcript_embeddings(deleted_at);

-- Remove transcript_embedding column from videos table
DROP INDEX IF EXISTS idx_videos_transcript_embedding;
ALTER TABLE videos DROP COLUMN IF EXISTS transcript_embedding;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE videos
ADD COLUMN IF NOT EXISTS transcript_embedding VECTOR(1536);

-- Recreate the old index
CREATE INDEX IF NOT EXISTS idx_videos_transcript_embedding
ON videos USING ivfflat (transcript_embedding vector_cosine_ops);

-- Drop the transcript_embeddings table
DROP TABLE IF EXISTS transcript_embeddings CASCADE;

-- +goose StatementEnd
