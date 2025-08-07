package timestamps

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/kkdai/youtube/v2"
	"github.com/pgvector/pgvector-go"
	authhandlers "github.com/shubhamku044/ytclipper/internal/handlers/auth"
	"github.com/shubhamku044/ytclipper/internal/middleware"
	"github.com/shubhamku044/ytclipper/internal/models"
)

func (t *TimestampsHandlers) SearchTimestamps(c *gin.Context) {
	userIDStr, exists := authhandlers.GetUserID(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER_ID", "User ID not found", nil)
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_USER_ID", "Invalid user ID format", gin.H{
			"error": err.Error(),
		})
		return
	}

	var req SearchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body", gin.H{
			"error": err.Error(),
		})
		return
	}

	queryEmbedding, err := t.aiService.GenerateEmbedding(req.Query)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "EMBEDDING_ERROR", "Failed to generate query embedding", gin.H{
			"error": err.Error(),
		})
		return
	}

	query := t.db.DB.NewSelect().
		Model((*models.Timestamp)(nil)).
		Where("user_id = ? AND deleted_at IS NULL", userID)

	if req.VideoID != "" {
		query = query.Where("video_id = ?", req.VideoID)
	}

	var timestamps []models.Timestamp
	err = query.Scan(context.Background(), &timestamps)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_READ_ERROR", "Failed to fetch timestamps", gin.H{
			"error": err.Error(),
		})
		return
	}

	var scoredResults []ScoredTimestamp
	for _, ts := range timestamps {
		if len(ts.Embedding) > 0 {
			score := CosineSimilarity(queryEmbedding, ts.Embedding)
			scoredResults = append(scoredResults, ScoredTimestamp{
				Timestamp: ts,
				Score:     score,
			})
		}
	}

	sort.Slice(scoredResults, func(i, j int) bool {
		return scoredResults[i].Score > scoredResults[j].Score
	})

	limit := req.Limit
	if limit == 0 || limit > 50 {
		limit = 10
	}
	if len(scoredResults) > limit {
		scoredResults = scoredResults[:limit]
	}

	middleware.RespondWithOK(c, gin.H{
		"results": scoredResults,
		"query":   req.Query,
		"count":   len(scoredResults),
	})
}

func (t *TimestampsHandlers) SearchTranscriptEmbeddings(c *gin.Context) {
	userIDStr, exists := authhandlers.GetUserID(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER_ID", "User ID not found", nil)
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_USER_ID", "Invalid user ID format", gin.H{
			"error": err.Error(),
		})
		return
	}

	var req SearchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body", gin.H{
			"error": err.Error(),
		})
		return
	}

	queryEmbedding, err := t.aiService.GenerateEmbedding(req.Query)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "EMBEDDING_ERROR", "Failed to generate query embedding", gin.H{
			"error": err.Error(),
		})
		return
	}

	query := t.db.DB.NewSelect().
		Model((*models.TranscriptEmbedding)(nil)).
		Where("user_id = ? AND deleted_at IS NULL", userID)

	if req.VideoID != "" {
		query = query.Where("video_id = ?", req.VideoID)
	}

	var embeddings []models.TranscriptEmbedding
	err = query.Scan(context.Background(), &embeddings)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_READ_ERROR", "Failed to fetch transcript embeddings", gin.H{
			"error": err.Error(),
		})
		return
	}

	type ScoredTranscriptEmbedding struct {
		Embedding models.TranscriptEmbedding `json:"embedding"`
		Score     float64                    `json:"score"`
	}

	var scoredResults []ScoredTranscriptEmbedding
	for _, emb := range embeddings {
		embeddingSlice := emb.Embedding.Slice()
		if len(embeddingSlice) > 0 {
			score := CosineSimilarity(queryEmbedding, embeddingSlice)
			scoredResults = append(scoredResults, ScoredTranscriptEmbedding{
				Embedding: emb,
				Score:     float64(score),
			})
		}
	}

	sort.Slice(scoredResults, func(i, j int) bool {
		return scoredResults[i].Score > scoredResults[j].Score
	})

	limit := req.Limit
	if limit == 0 || limit > 50 {
		limit = 10
	}
	if len(scoredResults) > limit {
		scoredResults = scoredResults[:limit]
	}

	middleware.RespondWithOK(c, gin.H{
		"results": scoredResults,
		"query":   req.Query,
		"count":   len(scoredResults),
	})
}

func (t *TimestampsHandlers) GetVideoSummary(c *gin.Context) {
	userIDStr, exists := authhandlers.GetUserID(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER_ID", "User ID not found", nil)
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_USER_ID", "Invalid user ID format", gin.H{
			"error": err.Error(),
		})
		return
	}

	videoID := c.Param("id")
	if videoID == "" {
		middleware.RespondWithError(c, http.StatusBadRequest, "MISSING_VIDEO_ID", "Video ID is required", nil)
		return
	}

	var video models.Video
	err = t.db.DB.NewSelect().
		Model(&video).
		Where("user_id = ? AND video_id = ? AND deleted_at IS NULL", userID, videoID).
		Scan(context.Background())

	if err != nil {
		middleware.RespondWithError(c, http.StatusNotFound, "VIDEO_NOT_FOUND", "Video not found or does not belong to user", gin.H{
			"error": err.Error(),
		})
		return
	}

	var aiSummary string
	if video.AISummary != "" && video.AISummaryGeneratedAt != nil {
		aiSummary = video.AISummary
	} else {
		aiSummary = ""
	}

	middleware.RespondWithOK(c, gin.H{
		"summary":      aiSummary,
		"video_id":     videoID,
		"cached":       aiSummary != "",
		"generated_at": video.AISummaryGeneratedAt,
	})
}

func (t *TimestampsHandlers) GenerateFullVideoSummary(c *gin.Context) {
	userIDStr, exists := authhandlers.GetUserID(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER_ID", "User ID not found", nil)
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_USER_ID", "Invalid user ID format", gin.H{
			"error": err.Error(),
		})
		return
	}

	var req FullVideoSummaryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body", gin.H{
			"error": err.Error(),
		})
		return
	}

	var video models.Video
	err = t.db.DB.NewSelect().
		Model(&video).
		Where("user_id = ? AND video_id = ? AND deleted_at IS NULL", userID, req.VideoID).
		Scan(context.Background())
	if err != nil {
		placeholderTitle := "Video " + req.VideoID
		placeholderURL := "https://youtube.com/watch?v=" + req.VideoID

		canAdd, err := t.featureUsageService.CheckUsageLimit(context.Background(), userID, "videos")
		if err != nil {
			middleware.RespondWithError(c, http.StatusInternalServerError, "USAGE_CHECK_ERROR", "Failed to check usage limit", gin.H{
				"error": err.Error(),
			})
			return
		}
		if !canAdd {
			middleware.RespondWithError(c, http.StatusForbidden, "USAGE_LIMIT_EXCEEDED", "Video limit exceeded for your current plan", gin.H{
				"feature": "videos",
			})
			return
		}

		video = models.Video{
			UserID:     userID,
			VideoID:    req.VideoID,
			YouTubeURL: placeholderURL,
			Title:      placeholderTitle,
		}

		_, err = t.db.DB.NewInsert().
			Model(&video).
			Exec(context.Background())
		if err != nil {
			middleware.RespondWithError(c, http.StatusInternalServerError, "DB_ERROR", "Failed to create video", gin.H{
				"error": err.Error(),
			})
			return
		}

		err = t.featureUsageService.IncrementUsage(context.Background(), userID, "videos")
		if err != nil {
			log.Printf("Warning: Failed to increment video usage: %v", err)
		}
	}

	if !req.Refresh && video.AISummary != "" && video.AISummaryGeneratedAt != nil {
		middleware.RespondWithOK(c, gin.H{
			"summary":      video.AISummary,
			"video_id":     req.VideoID,
			"video_title":  video.Title,
			"generated_at": video.AISummaryGeneratedAt,
			"cached":       true,
		})
		return
	}

	canGenerate, err := t.featureUsageService.CheckUsageLimit(context.Background(), userID, "ai_summaries")
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "USAGE_CHECK_ERROR", "Failed to check usage limit", gin.H{
			"error": err.Error(),
		})
		return
	}
	if !canGenerate {
		middleware.RespondWithError(c, http.StatusForbidden, "USAGE_LIMIT_EXCEEDED", "AI summary limit exceeded for your current plan", gin.H{
			"feature": "ai_summaries",
		})
		return
	}

	var transcriptEmbedding []models.TranscriptEmbedding
	err = t.db.DB.NewSelect().
		Model(&transcriptEmbedding).
		Where("video_id = ?", req.VideoID).
		Scan(context.Background())
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_READ_ERROR", "Failed to fetch transcript embedding", gin.H{
			"error": err.Error(),
		})
		return
	}

	var transcript string
	if len(transcriptEmbedding) == 0 {
		transcript, err = t.generateYouTubeTranscript(req.VideoID)
		if err == nil {
			t.ProcessEmbeddingInBackground(userIDStr, req.VideoID, transcript)
		}
	} else {
		var texts []string
		for _, embedding := range transcriptEmbedding {
			if embedding.StartTime != nil && embedding.EndTime != nil {
				startTime := formatTimestamp(*embedding.StartTime)
				endTime := formatTimestamp(*embedding.EndTime)
				texts = append(texts, fmt.Sprintf("%s-%s: %s", startTime, endTime, embedding.Text))
			} else {
				texts = append(texts, embedding.Text)
			}
		}
		transcript = strings.Join(texts, "\n")
	}

	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "TRANSCRIPT_ERROR", "Failed to generate transcript", gin.H{
			"error": err.Error(),
		})
		return
	}

	summary, err := t.generateFullVideoSummary(&video, transcript)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "AI_ERROR", "Failed to generate full video summary", gin.H{
			"error": err.Error(),
		})
		return
	}

	stream := c.Query("stream") == "true"

	if stream {
		c.Header("Content-Type", "text/event-stream")
		c.Header("Cache-Control", "no-cache")
		c.Header("Connection", "keep-alive")

		allowedOrigins := []string{
			"http://localhost:5173",             // Local development
			"http://localhost:3000",             // Alternative local port
			"https://ytclipper.com",             // Production domain
			"https://app.ytclipper.com",         // Production with www
			"https://app-staging.ytclipper.com", // Staging environment
		}

		origin := c.GetHeader("Origin")
		for _, allowedOrigin := range allowedOrigins {
			if origin == allowedOrigin {
				c.Header("Access-Control-Allow-Origin", origin)
				break
			}
		}

		c.Header("Access-Control-Allow-Headers", "Cache-Control")
		c.Header("Access-Control-Allow-Credentials", "true")

		c.Writer.Flush()

		words := strings.Fields(summary)

		for i, word := range words {
			chunkData := gin.H{
				"word":  word,
				"index": i,
				"total": len(words),
			}

			jsonData, err := json.Marshal(chunkData)
			if err != nil {
				continue
			}

			eventData := fmt.Sprintf("event: chunk\ndata: %s\n\n", string(jsonData))
			c.Writer.WriteString(eventData)
			c.Writer.Flush()
			time.Sleep(50 * time.Millisecond)
		}

		completeData := gin.H{
			"summary":      summary,
			"video_id":     req.VideoID,
			"video_title":  video.Title,
			"generated_at": time.Now().UTC(),
			"cached":       false,
		}

		completeJsonData, err := json.Marshal(completeData)
		if err != nil {
			log.Printf("Failed to marshal complete data: %v", err)
		} else {
			completeEventData := fmt.Sprintf("event: complete\ndata: %s\n\n", string(completeJsonData))
			c.Writer.WriteString(completeEventData)
			c.Writer.Flush()
		}

		now := time.Now().UTC()
		_, err = t.db.DB.NewUpdate().
			Model(&video).
			Set("ai_summary = ?", summary).
			Set("ai_summary_generated_at = ?", now).
			Where("user_id = ? AND video_id = ?", userID, req.VideoID).
			Exec(context.Background())

		if err != nil {
			log.Printf("Failed to save AI summary to database: %v", err)
		}

		err = t.featureUsageService.IncrementUsage(context.Background(), userID, "ai_summaries")
		if err != nil {
			log.Printf("Warning: Failed to increment AI summary usage: %v", err)
		}
	} else {
		now := time.Now().UTC()
		_, err = t.db.DB.NewUpdate().
			Model(&video).
			Set("ai_summary = ?", summary).
			Set("ai_summary_generated_at = ?", now).
			Where("user_id = ? AND video_id = ?", userID, req.VideoID).
			Exec(context.Background())

		if err != nil {
			log.Printf("Failed to save AI summary to database: %v", err)
		}

		err = t.featureUsageService.IncrementUsage(context.Background(), userID, "ai_summaries")
		if err != nil {
			log.Printf("Warning: Failed to increment AI summary usage: %v", err)
		}

		middleware.RespondWithOK(c, gin.H{
			"summary":      summary,
			"video_id":     req.VideoID,
			"video_title":  video.Title,
			"generated_at": now,
			"cached":       false,
		})
	}
}

func (t *TimestampsHandlers) TestStreaming(c *gin.Context) {
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("Access-Control-Allow-Origin", "http://localhost:5173")
	c.Header("Access-Control-Allow-Headers", "Cache-Control")
	c.Header("Access-Control-Allow-Credentials", "true")

	c.Writer.Flush()

	testWords := []string{"Hello", "world", "this", "is", "a", "test", "of", "streaming"}

	for i, word := range testWords {
		chunkData := gin.H{
			"word":  word,
			"index": i,
			"total": len(testWords),
		}

		jsonData, err := json.Marshal(chunkData)
		if err != nil {
			log.Printf("Failed to marshal test chunk data: %v", err)
			continue
		}

		eventData := fmt.Sprintf("event: chunk\ndata: %s\n\n", string(jsonData))
		c.Writer.WriteString(eventData)
		c.Writer.Flush()
		time.Sleep(100 * time.Millisecond)
	}

	completeData := gin.H{
		"summary":      "Test streaming completed successfully",
		"video_id":     "test",
		"video_title":  "Test Video",
		"note_count":   0,
		"generated_at": time.Now().UTC(),
		"cached":       false,
	}

	completeJsonData, err := json.Marshal(completeData)
	if err != nil {
		log.Printf("Failed to marshal test complete data: %v", err)
	} else {
		completeEventData := fmt.Sprintf("event: complete\ndata: %s\n\n", string(completeJsonData))
		c.Writer.WriteString(completeEventData)
		c.Writer.Flush()
	}
}

func (t *TimestampsHandlers) AnswerQuestion(c *gin.Context) {
	userIDStr, exists := authhandlers.GetUserID(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER_ID", "User ID not found", nil)
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_USER_ID", "Invalid user ID format", gin.H{
			"error": err.Error(),
		})
		return
	}

	type QuestionRequest struct {
		Question string `json:"question" binding:"required"`
		VideoID  string `json:"video_id,omitempty"`
		Context  int    `json:"context,omitempty"`
	}

	var req QuestionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body", gin.H{
			"error": err.Error(),
		})
		return
	}

	canAsk, err := t.featureUsageService.CheckUsageLimit(context.Background(), userID, "ai_questions")
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "USAGE_CHECK_ERROR", "Failed to check usage limit", gin.H{
			"error": err.Error(),
		})
		return
	}
	if !canAsk {
		middleware.RespondWithError(c, http.StatusForbidden, "USAGE_LIMIT_EXCEEDED", "AI question limit exceeded for your current plan", gin.H{
			"feature": "ai_questions",
		})
		return
	}

	queryEmbedding, err := t.aiService.GenerateEmbedding(req.Question)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "EMBEDDING_ERROR", "Failed to generate question embedding", gin.H{
			"error": err.Error(),
		})
		return
	}

	var contextBuilder strings.Builder
	contextBuilder.WriteString("# Video Context\n\n")

	if req.VideoID != "" {
		var transcriptEmbeddings []models.TranscriptEmbedding
		err = t.db.DB.NewSelect().
			Model(&transcriptEmbeddings).
			Where("video_id = ?", req.VideoID).
			Scan(context.Background())

		if err == nil && len(transcriptEmbeddings) > 0 {
			log.Printf("Found %d transcript embeddings for video %s", len(transcriptEmbeddings), req.VideoID)

			type ScoredTranscriptChunk struct {
				Embedding models.TranscriptEmbedding
				Score     float64
			}

			var scoredChunks []ScoredTranscriptChunk
			for _, emb := range transcriptEmbeddings {
				embeddingSlice := emb.Embedding.Slice()
				if len(embeddingSlice) > 0 {
					score := CosineSimilarity(queryEmbedding, embeddingSlice)
					scoredChunks = append(scoredChunks, ScoredTranscriptChunk{
						Embedding: emb,
						Score:     float64(score),
					})
				}
			}

			sort.Slice(scoredChunks, func(i, j int) bool {
				return scoredChunks[i].Score > scoredChunks[j].Score
			})

			contextLimit := req.Context
			if contextLimit == 0 {
				contextLimit = 10
			}
			if len(scoredChunks) > contextLimit {
				scoredChunks = scoredChunks[:contextLimit]
			}

			if len(scoredChunks) > 0 {
				contextBuilder.WriteString("## Relevant Video Transcript Segments\n\n")

				for i, scored := range scoredChunks {
					emb := scored.Embedding
					startTime := formatTimestamp(*emb.StartTime)
					endTime := formatTimestamp(*emb.EndTime)

					contextBuilder.WriteString(fmt.Sprintf("### Segment %d (%s-%s, Relevance: %.3f)\n\n",
						i+1, startTime, endTime, scored.Score))
					contextBuilder.WriteString(fmt.Sprintf("**Content:**\n%s\n\n", emb.Text))
					contextBuilder.WriteString("---\n\n")
				}
			}
		} else {
			transcript, err := t.generateYouTubeTranscript(req.VideoID)
			if err == nil {
				contextBuilder.WriteString("## Video Transcript\n\n")
				contextBuilder.WriteString(transcript)
				contextBuilder.WriteString("\n\n")

				t.ProcessEmbeddingInBackground(userIDStr, req.VideoID, transcript)
			}
		}

		// Get relevant user notes for this video
		searchReq := SearchRequest{
			Query:   req.Question,
			VideoID: req.VideoID,
			Limit:   req.Context,
		}
		if searchReq.Limit == 0 {
			searchReq.Limit = 5
		}

		query := t.db.DB.NewSelect().
			Model((*models.Timestamp)(nil)).
			Where("user_id = ? AND video_id = ? AND deleted_at IS NULL", userID, req.VideoID)

		var timestamps []models.Timestamp
		err = query.Scan(context.Background(), &timestamps)
		if err != nil {
			middleware.RespondWithError(c, http.StatusInternalServerError, "DB_READ_ERROR", "Failed to fetch timestamps", gin.H{
				"error": err.Error(),
			})
			return
		}

		var scoredResults []ScoredTimestamp
		for _, ts := range timestamps {
			if len(ts.Embedding) > 0 {
				score := CosineSimilarity(queryEmbedding, ts.Embedding)
				scoredResults = append(scoredResults, ScoredTimestamp{
					Timestamp: ts,
					Score:     score,
				})
			}
		}

		sort.Slice(scoredResults, func(i, j int) bool {
			return scoredResults[i].Score > scoredResults[j].Score
		})

		if len(scoredResults) > searchReq.Limit {
			scoredResults = scoredResults[:searchReq.Limit]
		}

		if len(scoredResults) > 0 {
			contextBuilder.WriteString("## Relevant User Notes\n\n")

			for i, scored := range scoredResults {
				ts := scored.Timestamp.(models.Timestamp)
				contextBuilder.WriteString(fmt.Sprintf("### Note %d (Timestamp: %.2f seconds, Relevance: %.3f)\n\n", i+1, ts.Timestamp, scored.Score))
				if ts.Title != "" {
					contextBuilder.WriteString(fmt.Sprintf("**Title:** %s\n\n", ts.Title))
				}
				if ts.Note != "" {
					contextBuilder.WriteString(fmt.Sprintf("**Content:**\n%s\n\n", ts.Note))
				}
				if len(ts.Tags) > 0 {
					var tagNames []string
					for _, tag := range ts.Tags {
						tagNames = append(tagNames, tag.Name)
					}
					contextBuilder.WriteString(fmt.Sprintf("**Tags:** %s\n\n", strings.Join(tagNames, ", ")))
				}
				contextBuilder.WriteString("---\n\n")
			}
		}
	} else {
		searchReq := SearchRequest{
			Query: req.Question,
			Limit: req.Context,
		}
		if searchReq.Limit == 0 {
			searchReq.Limit = 5
		}

		query := t.db.DB.NewSelect().
			Model((*models.Timestamp)(nil)).
			Where("user_id = ? AND deleted_at IS NULL", userID)

		var timestamps []models.Timestamp
		err = query.Scan(context.Background(), &timestamps)
		if err != nil {
			middleware.RespondWithError(c, http.StatusInternalServerError, "DB_READ_ERROR", "Failed to fetch timestamps", gin.H{
				"error": err.Error(),
			})
			return
		}

		var scoredResults []ScoredTimestamp
		for _, ts := range timestamps {
			if len(ts.Embedding) > 0 {
				score := CosineSimilarity(queryEmbedding, ts.Embedding)
				scoredResults = append(scoredResults, ScoredTimestamp{
					Timestamp: ts,
					Score:     score,
				})
			}
		}

		sort.Slice(scoredResults, func(i, j int) bool {
			return scoredResults[i].Score > scoredResults[j].Score
		})

		if len(scoredResults) > searchReq.Limit {
			scoredResults = scoredResults[:searchReq.Limit]
		}

		if len(scoredResults) > 0 {
			contextBuilder.WriteString("## Relevant User Notes\n\n")

			for i, scored := range scoredResults {
				ts := scored.Timestamp.(models.Timestamp)
				contextBuilder.WriteString(fmt.Sprintf("### Note %d (Video: %s, Timestamp: %.2f seconds, Relevance: %.3f)\n\n", i+1, ts.VideoID, ts.Timestamp, scored.Score))
				if ts.Title != "" {
					contextBuilder.WriteString(fmt.Sprintf("**Title:** %s\n\n", ts.Title))
				}
				if ts.Note != "" {
					contextBuilder.WriteString(fmt.Sprintf("**Content:**\n%s\n\n", ts.Note))
				}
				if len(ts.Tags) > 0 {
					var tagNames []string
					for _, tag := range ts.Tags {
						tagNames = append(tagNames, tag.Name)
					}
					contextBuilder.WriteString(fmt.Sprintf("**Tags:** %s\n\n", strings.Join(tagNames, ", ")))
				}
				contextBuilder.WriteString("---\n\n")
			}
		}
	}

	prompt := fmt.Sprintf(`You are an AI assistant helping answer questions about video content. 

Question: "%s"

%s

Please provide a comprehensive answer based on the context above. If the question is about a specific video and you have access to the video transcript, use that information to provide a more complete answer. If the notes don't contain enough information to answer the question, please say so clearly. You can reference specific timestamps in your answer.

Make your answer helpful, accurate, and well-structured.`,
		req.Question, contextBuilder.String())

	answer, err := t.aiService.GenerateTextCompletion(prompt)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "AI_ERROR", "Failed to generate answer", gin.H{
			"error": err.Error(),
		})
		return
	}

	var relevantNotes []gin.H
	if req.VideoID != "" {
		query := t.db.DB.NewSelect().
			Model((*models.Timestamp)(nil)).
			Where("user_id = ? AND video_id = ? AND deleted_at IS NULL", userID, req.VideoID)

		var timestamps []models.Timestamp
		err = query.Scan(context.Background(), &timestamps)
		if err == nil {
			for _, ts := range timestamps {
				if len(ts.Embedding) > 0 {
					score := CosineSimilarity(queryEmbedding, ts.Embedding)
					relevantNotes = append(relevantNotes, gin.H{
						"id":        ts.ID,
						"timestamp": ts.Timestamp,
						"title":     ts.Title,
						"note":      ts.Note,
						"tags":      ts.Tags,
						"score":     score,
					})
				}
			}
		}
	}

	err = t.featureUsageService.IncrementUsage(context.Background(), userID, "ai_questions")
	if err != nil {
		log.Printf("Warning: Failed to increment AI question usage: %v", err)
	}

	middleware.RespondWithOK(c, gin.H{
		"answer":         answer,
		"question":       req.Question,
		"relevant_notes": relevantNotes,
		"context_count":  len(relevantNotes),
		"generated_at":   time.Now().UTC(),
	})
}

func formatTimestamp(duration float64) string {
	hours := int(duration) / 3600
	minutes := (int(duration) % 3600) / 60
	seconds := int(duration) % 60

	return fmt.Sprintf("[%02d:%02d:%02d]", hours, minutes, seconds)
}

func (t *TimestampsHandlers) generateYouTubeTranscript(videoID string) (string, error) {
	client := youtube.Client{}

	video, err := client.GetVideo(videoID)
	if err != nil {
		if strings.Contains(err.Error(), "400") {
			return "", fmt.Errorf("video not accessible (400 error) - possible reasons: private video, region-restricted, or transcript disabled for video %s", videoID)
		}
		return "", fmt.Errorf("failed to get video info for video %s: %w", videoID, err)
	}

	if len(video.CaptionTracks) == 0 {
		return "", fmt.Errorf("no captions available for video %s", videoID)
	}

	var transcript youtube.VideoTranscript
	var transcriptErr error
	for _, captionTrack := range video.CaptionTracks {
		transcript, transcriptErr = client.GetTranscript(video, captionTrack.LanguageCode)
		if transcriptErr == nil {
			break
		}
	}

	if transcriptErr != nil {
		return "", fmt.Errorf("failed to get transcript for video %s: %w", videoID, transcriptErr)
	}

	var transcriptText strings.Builder
	transcriptText.WriteString("TRANSCRIPT WITH TIMESTAMPS:\n\n")
	for _, entry := range transcript {
		startTimeSeconds := float64(entry.StartMs) / 1000.0
		timestamp := formatTimestamp(startTimeSeconds)
		transcriptText.WriteString(fmt.Sprintf("%s %s\n", timestamp, entry.Text))
	}

	result := strings.TrimSpace(transcriptText.String())
	if result == "" {
		return "", fmt.Errorf("transcript is empty for video %s", videoID)
	}

	return result, nil
}

func (t *TimestampsHandlers) generateFullVideoSummary(video *models.Video, transcript string) (string, error) {
	var content strings.Builder
	content.WriteString(fmt.Sprintf("# Full Video Summary: %s\n\n", video.Title))

	if video.Description != "" {
		content.WriteString(fmt.Sprintf("## Video Description\n%s\n\n", video.Description))
	}

	if transcript != "" {
		content.WriteString(fmt.Sprintf("## Video Transcript\n%s\n\n", transcript))
	}

	prompt := `Act as an expert content analyst. Create a comprehensive, well-organized summary of this YouTube video using the provided information and transcript analysis.

Structure your response like this:

# 📺 [Video Title]

## 🎯 Overview
[2-3 sentence summary of main topic and purpose]

## 🔑 Key Points

Analyze the video content and identify the actual main topics/concepts discussed. Create 3-5 relevant topic sections based on what's actually taught in the video. Use descriptive, specific topic names that reflect the actual content.

Examples of good topic names:
- "Database Indexing Fundamentals"
- "B-Tree Index Performance"
- "Index Optimization Strategies"
- "Query Performance Analysis"
- "Real-world Indexing Examples"

For each topic, include:
- **Important detail:** explanation
- **Key insight:** explanation
- **Supporting point:** explanation (when relevant)

## ⏰ Key Moments (Clickable Timestamps)
Include ONLY the most important timestamps where viewers should jump to. Format as:
- **[00:15]** - Brief description of what happens at this moment
- **[02:30]** - Brief description of what happens at this moment
- **[05:45]** - Brief description of what happens at this moment

**Guidelines for timestamps:**
- Only include 3-5 most critical moments
- Focus on key insights, demonstrations, or important announcements
- Avoid timestamps for introductions, transitions, or minor details
- Make descriptions concise but informative

## 💡 Main Takeaways
1. **Primary insight:** Detailed explanation
2. **Secondary insight:** Detailed explanation
3. **Action item:** What viewers should do

## 🎯 Bottom Line
[One paragraph conclusion summarizing the core message]

---

**Important:** 
- Format the response exactly as shown above with proper markdown syntax
- Use bold text for emphasis, proper headings
- Ensure timestamps are in the format [MM:SS] for clickable functionality
- Create topic names that are specific and descriptive based on the actual video content
- Don't use generic names like "Main Topic 1" - use actual topic names

Now analyze this content and identify the most important moments for timestamps:
` + content.String()

	return t.aiService.GenerateTextCompletion(prompt)
}

func (t *TimestampsHandlers) ProcessEmbeddingInBackground(userIdStr, videoID, transcript string) {
	go func() {
		err := t.generateAndSaveTranscriptEmbedding(userIdStr, videoID, transcript)
		if err != nil {
			log.Printf("Failed to process embedding for video %s: %v", videoID, err)
		}
	}()
}

func (t *TimestampsHandlers) generateAndSaveTranscriptEmbedding(userIDStr, videoID, transcript string) error {
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return fmt.Errorf("invalid user ID: %w", err)
	}

	chunks, err := t.parseTranscriptIntoChunks(transcript)
	if err != nil {
		return fmt.Errorf("failed to parse transcript: %w", err)
	}

	_, err = t.db.DB.NewDelete().
		Model((*models.TranscriptEmbedding)(nil)).
		Where("video_id = ? AND user_id = ?", videoID, userID).
		Exec(context.Background())
	if err != nil {
		log.Printf("Warning: failed to delete existing embeddings for video %s: %v", videoID, err)
	}

	for i, chunk := range chunks {
		embedding, err := t.aiService.GenerateEmbedding(chunk.Text)
		if err != nil {
			log.Printf("Failed to generate embedding for chunk %d of video %s: %v", i, videoID, err)
			continue
		}

		transcriptEmbedding := &models.TranscriptEmbedding{
			UserID:     userID,
			VideoID:    videoID,
			ChunkIndex: i,
			StartTime:  &chunk.StartTime,
			EndTime:    &chunk.EndTime,
			Text:       chunk.Text,
			Embedding:  pgvector.NewVector(embedding),
		}

		_, err = t.db.DB.NewInsert().
			Model(transcriptEmbedding).
			Exec(context.Background())
		if err != nil {
			log.Printf("Failed to save embedding for chunk %d of video %s: %v", i, videoID, err)
			continue
		}
	}

	log.Printf("Successfully processed %d transcript chunks for video %s", len(chunks), videoID)
	return nil
}

type TranscriptChunk struct {
	StartTime float64
	EndTime   float64
	Text      string
}

func (t *TimestampsHandlers) parseTranscriptIntoChunks(transcript string) ([]TranscriptChunk, error) {
	lines := strings.Split(transcript, "\n")

	var chunks []TranscriptChunk
	var currentChunk strings.Builder
	var chunkStartTime float64
	var chunkEndTime float64
	var chunkIndex int

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		if strings.Contains(line, "TRANSCRIPT WITH TIMESTAMPS:") {
			continue
		}

		if strings.HasPrefix(line, "[") {
			if currentChunk.Len() > 0 {
				chunks = append(chunks, TranscriptChunk{
					StartTime: chunkStartTime,
					EndTime:   chunkEndTime,
					Text:      strings.TrimSpace(currentChunk.String()),
				})
				chunkIndex++
			}

			endBracket := strings.Index(line, "]")
			if endBracket == -1 {
				continue
			}

			timestampStr := line[1:endBracket]
			timeInSeconds := parseTimestampToSeconds(timestampStr)

			chunkStartTime = timeInSeconds
			currentChunk.Reset()

			text := strings.TrimSpace(line[endBracket+1:])
			if text != "" {
				currentChunk.WriteString(text)
				currentChunk.WriteString(" ")
			}
		} else {
			if currentChunk.Len() > 0 {
				currentChunk.WriteString(" ")
			}
			currentChunk.WriteString(line)
		}
	}

	if currentChunk.Len() > 0 {
		chunks = append(chunks, TranscriptChunk{
			StartTime: chunkStartTime,
			EndTime:   chunkEndTime,
			Text:      strings.TrimSpace(currentChunk.String()),
		})
	}

	for i := 0; i < len(chunks)-1; i++ {
		chunks[i].EndTime = chunks[i+1].StartTime
	}

	if len(chunks) > 0 {
		lastChunk := &chunks[len(chunks)-1]
		if lastChunk.EndTime == 0 {
			lastChunk.EndTime = lastChunk.StartTime + 60.0
		}
	}

	return chunks, nil
}

func parseTimestampToSeconds(timestamp string) float64 {
	parts := strings.Split(timestamp, ":")

	if len(parts) == 3 {
		hours, err1 := strconv.Atoi(parts[0])
		minutes, err2 := strconv.Atoi(parts[1])
		seconds, err3 := strconv.Atoi(parts[2])

		if err1 != nil || err2 != nil || err3 != nil {
			return 0.0
		}

		return float64(hours*3600 + minutes*60 + seconds)
	}

	if len(parts) == 2 {
		minutes, err1 := strconv.Atoi(parts[0])
		seconds, err2 := strconv.Atoi(parts[1])

		if err1 != nil || err2 != nil {
			return 0.0
		}

		return float64(minutes*60 + seconds)
	}

	return 0.0
}
