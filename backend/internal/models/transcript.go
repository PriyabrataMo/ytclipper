package models

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/pgvector/pgvector-go"
	"github.com/uptrace/bun"
)

type TranscriptEmbedding struct {
	bun.BaseModel `bun:"table:transcript_embeddings,alias:te"`

	ID         int64           `json:"id" bun:"id,pk,autoincrement"`
	UserID     uuid.UUID       `json:"user_id" bun:"user_id,type:uuid,notnull"`
	VideoID    string          `json:"video_id" bun:"video_id,notnull"`
	ChunkIndex int             `json:"chunk_index" bun:"chunk_index,notnull"`
	StartTime  *float64        `json:"start_time" bun:"start_time"`
	EndTime    *float64        `json:"end_time" bun:"end_time"`
	Text       string          `json:"text" bun:"text,notnull"`
	Embedding  pgvector.Vector `json:"-" bun:"embedding,type:vector(1536)"`
	CreatedAt  time.Time       `json:"created_at" bun:"created_at,notnull"`
	UpdatedAt  time.Time       `json:"updated_at" bun:"updated_at,notnull"`
	DeletedAt  *time.Time      `json:"deleted_at" bun:"deleted_at,soft_delete,nullzero"`
}

func (te *TranscriptEmbedding) BeforeInsert(ctx context.Context) error {
	if te.CreatedAt.IsZero() {
		te.CreatedAt = time.Now()
	}
	if te.UpdatedAt.IsZero() {
		te.UpdatedAt = time.Now()
	}
	return nil
}

func (te *TranscriptEmbedding) BeforeUpdate(ctx context.Context) error {
	te.UpdatedAt = time.Now()
	return nil
}
