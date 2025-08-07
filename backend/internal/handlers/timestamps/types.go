package timestamps

import "time"

type TagSearchRequest struct {
	Query string `json:"query" binding:"required"`
	Limit int    `json:"limit,omitempty"`
}

type CreateTimestampRequest struct {
	VideoID   string   `json:"video_id" binding:"required"`
	Timestamp float64  `json:"timestamp" binding:"required"`
	Title     string   `json:"title"`
	Note      string   `json:"note"`
	Tags      []string `json:"tags"`
}

type FullVideoSummaryRequest struct {
	VideoID string `json:"video_id" binding:"required"`
	Refresh bool   `json:"refresh,omitempty"`
}

type SearchRequest struct {
	Query   string `json:"query" binding:"required"`
	VideoID string `json:"video_id,omitempty"`
	Limit   int    `json:"limit,omitempty"`
}

type DeleteMultipleRequest struct {
	IDs []string `json:"ids" binding:"required"`
}

type EmbeddingRequest struct {
	Input          []string `json:"input"`
	Model          string   `json:"model"`
	EncodingFormat string   `json:"encoding_format,omitempty"`
}

type EmbeddingResponse struct {
	Data []struct {
		Embedding []float32 `json:"embedding"`
		Index     int       `json:"index"`
	} `json:"data"`
}

type ChatRequest struct {
	Model    string `json:"model"`
	Messages []struct {
		Role    string `json:"role"`
		Content string `json:"content"`
	} `json:"messages"`
	MaxTokens   int     `json:"max_tokens,omitempty"`
	Temperature float64 `json:"temperature,omitempty"`
}

type ChatResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

type ScoredTimestamp struct {
	Timestamp interface{} `json:"timestamp"`
	Score     float32     `json:"score"`
}

type VideoInfo struct {
	VideoID string    `json:"video_id"`
	Latest  time.Time `json:"latest_timestamp"`
	Count   int       `json:"count"`
}
