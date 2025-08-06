package timestamps

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/kkdai/youtube/v2"
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
		log.Printf("Video not found, creating new video record for: %s", req.VideoID)
		placeholderTitle := "Video " + req.VideoID
		placeholderURL := "https://youtube.com/watch?v=" + req.VideoID

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
		log.Printf("Successfully created video record")
	}

	var currentVideo models.Video
	var transcriptEmbedding []float32

	err = t.db.DB.NewSelect().
		Model(&currentVideo).
		Where("user_id = ? AND video_id = ? AND deleted_at IS NULL", userID, req.VideoID).
		Scan(context.Background())

	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_ERROR", "Failed to fetch video", gin.H{
			"error": err.Error(),
		})
		return
	}

	// Check if this user already has transcript embedding
	if len(currentVideo.TranscriptEmbedding) > 0 {
		log.Printf("Transcript embedding already exists for user %s and video %s", userID, req.VideoID)
		transcriptEmbedding = currentVideo.TranscriptEmbedding
	} else {
		var otherVideo models.Video
		err = t.db.DB.NewSelect().
			Model(&otherVideo).
			Where("video_id = ? AND transcript_embedding IS NOT NULL AND deleted_at IS NULL AND user_id != ?", req.VideoID, userID).
			Limit(1).
			Scan(context.Background())

		if err == nil && len(otherVideo.TranscriptEmbedding) > 0 {
			log.Printf("Found transcript embedding from another user, copying to current user")
			_, err = t.db.DB.NewUpdate().
				Model(&currentVideo).
				Set("transcript_embedding = ?", otherVideo.TranscriptEmbedding).
				Where("user_id = ? AND video_id = ?", userID, req.VideoID).
				Exec(context.Background())

			if err != nil {
				middleware.RespondWithError(c, http.StatusInternalServerError, "DB_ERROR", "Failed to copy transcript embedding", gin.H{
					"error": err.Error(),
				})
				return
			}
			transcriptEmbedding = otherVideo.TranscriptEmbedding
		} else {
			log.Printf("No existing transcript embedding found, generating new one")
			transcript, err := t.generateYouTubeTranscript(req.VideoID)
			if err != nil {
				log.Printf("Failed to generate transcript: %v", err)
				placeholderText := fmt.Sprintf("Video: %s. No transcript available.", video.Title)
				transcriptEmbedding, err = t.aiService.GenerateEmbedding(placeholderText)
				if err != nil {
					middleware.RespondWithError(c, http.StatusInternalServerError, "EMBEDDING_ERROR", "Failed to generate placeholder embedding", gin.H{
						"error": err.Error(),
					})
					return
				}
			} else {
				transcriptEmbedding, err = t.aiService.GenerateEmbedding(transcript)
				if err != nil {
					middleware.RespondWithError(c, http.StatusInternalServerError, "EMBEDDING_ERROR", "Failed to generate transcript embedding", gin.H{
						"error": err.Error(),
					})
					return
				}
			}

			_, err = t.db.DB.NewUpdate().
				Model(&currentVideo).
				Set("transcript_embedding = ?", transcriptEmbedding).
				Where("user_id = ? AND video_id = ?", userID, req.VideoID).
				Exec(context.Background())

			if err != nil {
				middleware.RespondWithError(c, http.StatusInternalServerError, "DB_ERROR", "Failed to save transcript embedding", gin.H{
					"error": err.Error(),
				})
				return
			}
		}
	}

	var timestamps []models.Timestamp
	err = t.db.DB.NewSelect().
		Model(&timestamps).
		Where("user_id = ? AND video_id = ? AND deleted_at IS NULL", userID, req.VideoID).
		Order("timestamp ASC").
		Scan(context.Background())
	if err != nil {
		timestamps = []models.Timestamp{}
	}

	if !req.Refresh && currentVideo.AISummary != "" && currentVideo.AISummaryGeneratedAt != nil {
		log.Printf("AI summary already exists for user %s and video %s, returning existing summary", userID, req.VideoID)
		middleware.RespondWithOK(c, gin.H{
			"summary":      currentVideo.AISummary,
			"video_id":     req.VideoID,
			"video_title":  currentVideo.Title,
			"note_count":   len(timestamps),
			"generated_at": currentVideo.AISummaryGeneratedAt,
			"cached":       true,
		})
		return
	}

	summary, err := t.generateFullVideoSummaryWithEmbedding(&currentVideo, timestamps)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "AI_ERROR", "Failed to generate full video summary", gin.H{
			"error": err.Error(),
		})
		return
	}

	// Check if streaming is requested
	stream := c.Query("stream") == "true"

	if stream {
		// Set headers for streaming
		c.Header("Content-Type", "text/event-stream")
		c.Header("Cache-Control", "no-cache")
		c.Header("Connection", "keep-alive")
		c.Header("Access-Control-Allow-Origin", "http://localhost:5173")
		c.Header("Access-Control-Allow-Headers", "Cache-Control")
		c.Header("Access-Control-Allow-Credentials", "true")

		// Flush headers immediately
		c.Writer.Flush()

		// Stream the summary word by word
		words := strings.Fields(summary)
		log.Printf("Starting to stream %d words", len(words))

		for i, word := range words {
			chunkData := gin.H{
				"word":  word,
				"index": i,
				"total": len(words),
			}

			// Convert to JSON
			jsonData, err := json.Marshal(chunkData)
			if err != nil {
				log.Printf("Failed to marshal chunk data: %v", err)
				continue
			}

			// Send SSE event in proper format
			eventData := fmt.Sprintf("event: chunk\ndata: %s\n\n", string(jsonData))
			log.Printf("Sending chunk %d/%d: %s", i+1, len(words), word)
			c.Writer.WriteString(eventData)
			c.Writer.Flush()
			time.Sleep(50 * time.Millisecond) // Adjust speed as needed
		}

		// Send completion event
		completeData := gin.H{
			"summary":      summary,
			"video_id":     req.VideoID,
			"video_title":  currentVideo.Title,
			"note_count":   len(timestamps),
			"generated_at": time.Now().UTC(),
			"cached":       false,
		}

		// Convert to JSON
		completeJsonData, err := json.Marshal(completeData)
		if err != nil {
			log.Printf("Failed to marshal complete data: %v", err)
		} else {
			// Send completion event in proper format
			completeEventData := fmt.Sprintf("event: complete\ndata: %s\n\n", string(completeJsonData))
			log.Printf("Sending completion event")
			c.Writer.WriteString(completeEventData)
			c.Writer.Flush()
		}

		// Save summary to database even when streaming
		now := time.Now().UTC()
		_, err = t.db.DB.NewUpdate().
			Model(&currentVideo).
			Set("ai_summary = ?", summary).
			Set("ai_summary_generated_at = ?", now).
			Where("user_id = ? AND video_id = ?", userID, req.VideoID).
			Exec(context.Background())

		if err != nil {
			log.Printf("Failed to save AI summary to database: %v", err)
		}
	} else {
		// Regular response
		now := time.Now().UTC()
		_, err = t.db.DB.NewUpdate().
			Model(&currentVideo).
			Set("ai_summary = ?", summary).
			Set("ai_summary_generated_at = ?", now).
			Where("user_id = ? AND video_id = ?", userID, req.VideoID).
			Exec(context.Background())

		if err != nil {
			log.Printf("Failed to save AI summary to database: %v", err)
		}

		middleware.RespondWithOK(c, gin.H{
			"summary":      summary,
			"video_id":     req.VideoID,
			"video_title":  currentVideo.Title,
			"note_count":   len(timestamps),
			"generated_at": now,
			"cached":       false,
		})
	}
}

func (t *TimestampsHandlers) TestStreaming(c *gin.Context) {
	// Set headers for streaming
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("Access-Control-Allow-Origin", "http://localhost:5173")
	c.Header("Access-Control-Allow-Headers", "Cache-Control")
	c.Header("Access-Control-Allow-Credentials", "true")

	// Flush headers immediately
	c.Writer.Flush()

	// Test words
	testWords := []string{"Hello", "world", "this", "is", "a", "test", "of", "streaming"}

	for i, word := range testWords {
		chunkData := gin.H{
			"word":  word,
			"index": i,
			"total": len(testWords),
		}

		// Convert to JSON
		jsonData, err := json.Marshal(chunkData)
		if err != nil {
			log.Printf("Failed to marshal test chunk data: %v", err)
			continue
		}

		// Send SSE event in proper format
		eventData := fmt.Sprintf("event: chunk\ndata: %s\n\n", string(jsonData))
		log.Printf("Test: Sending chunk %d/%d: %s", i+1, len(testWords), word)
		c.Writer.WriteString(eventData)
		c.Writer.Flush()
		time.Sleep(100 * time.Millisecond)
	}

	// Send completion event
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
		log.Printf("Test: Sending completion event")
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

	// Generate embedding for the question
	queryEmbedding, err := t.aiService.GenerateEmbedding(req.Question)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "EMBEDDING_ERROR", "Failed to generate question embedding", gin.H{
			"error": err.Error(),
		})
		return
	}

	var contextBuilder strings.Builder
	contextBuilder.WriteString("# Video Context\n\n")

	// If video_id is provided, try to get transcript embedding and relevant notes
	if req.VideoID != "" {
		// Get video record to check for transcript embedding
		var video models.Video
		err = t.db.DB.NewSelect().
			Model(&video).
			Where("user_id = ? AND video_id = ? AND deleted_at IS NULL", userID, req.VideoID).
			Scan(context.Background())

		if err == nil && len(video.TranscriptEmbedding) > 0 {
			// Calculate similarity with transcript embedding
			transcriptSimilarity := CosineSimilarity(queryEmbedding, video.TranscriptEmbedding)
			log.Printf("Question similarity with transcript: %.3f", transcriptSimilarity)

			// If transcript is highly relevant, include it in context
			if transcriptSimilarity > 0.3 { // Threshold for relevance
				contextBuilder.WriteString("## Video Transcript Context\n\n")
				contextBuilder.WriteString("The question is highly relevant to the video transcript content. ")
				contextBuilder.WriteString("The AI will use the full video transcript to provide a comprehensive answer.\n\n")
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
		// If no video_id provided, search across all user notes
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

	// Create enhanced prompt that includes transcript context
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

	// Prepare relevant notes for response
	var relevantNotes []gin.H
	if req.VideoID != "" {
		// Get the scored results for the specific video
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

	middleware.RespondWithOK(c, gin.H{
		"answer":         answer,
		"question":       req.Question,
		"relevant_notes": relevantNotes,
		"context_count":  len(relevantNotes),
		"generated_at":   time.Now().UTC(),
	})
}

// generateYouTubeTranscript generates transcript for a YouTube video
func (t *TimestampsHandlers) generateYouTubeTranscript(videoID string) (string, error) {
	client := youtube.Client{}

	log.Println("Attempting to get video:", videoID)

	// Try to get video info first
	video, err := client.GetVideo(videoID)
	if err != nil {
		log.Printf("Error getting video info: %v", err)
		return "", fmt.Errorf("failed to get video info: %w", err)
	}

	log.Printf("Successfully got video: %s", video.Title)

	// Try to get transcript
	transcript, err := client.GetTranscript(video)
	if err != nil {
		log.Printf("Error getting transcript: %v", err)
		return "", fmt.Errorf("failed to get transcript: %w", err)
	}

	var transcriptText strings.Builder
	for _, line := range transcript {
		transcriptText.WriteString(line.Text)
		transcriptText.WriteString(" ")
	}

	log.Printf("Successfully generated transcript with %d lines", len(transcript))
	return transcriptText.String(), nil
}

func (t *TimestampsHandlers) generateFullVideoSummaryWithEmbedding(video *models.Video, timestamps []models.Timestamp) (string, error) {
	var content strings.Builder
	content.WriteString(fmt.Sprintf("# Full Video Summary: %s\n\n", video.Title))

	if video.Description != "" {
		content.WriteString(fmt.Sprintf("## Video Description\n%s\n\n", video.Description))
	}

	// Add user timestamps if available
	if len(timestamps) > 0 {
		content.WriteString("## User Notes and Timestamps\n\n")
		for _, ts := range timestamps {
			content.WriteString(fmt.Sprintf("### Timestamp: %.2f seconds\n", ts.Timestamp))
			if ts.Title != "" {
				content.WriteString(fmt.Sprintf("**Title:** %s\n\n", ts.Title))
			}
			if ts.Note != "" {
				content.WriteString(fmt.Sprintf("**Note:** %s\n\n", ts.Note))
			}
			if len(ts.Tags) > 0 {
				var tagNames []string
				for _, tag := range ts.Tags {
					tagNames = append(tagNames, tag.Name)
				}
				content.WriteString(fmt.Sprintf("**Tags:** %s\n\n", strings.Join(tagNames, ", ")))
			}
			content.WriteString("---\n\n")
		}
	}

	// Add transcript embedding information
	if len(video.TranscriptEmbedding) > 0 {
		content.WriteString("## Transcript Analysis\n\n")
		content.WriteString("This video has been analyzed using AI transcript embedding for comprehensive understanding.\n\n")
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
