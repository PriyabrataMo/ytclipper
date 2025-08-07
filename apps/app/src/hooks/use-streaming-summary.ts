import config from '@/config';
import { useCallback, useState } from 'react';

interface StreamingChunk {
  word: string;
  index: number;
  total: number;
}

interface StreamingComplete {
  summary: string;
  video_id: string;
  video_title: string;
  note_count: number;
  generated_at: string;
  cached: boolean;
}

export const useStreamingSummary = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [progress, setProgress] = useState(0);
  const [finalSummary, setFinalSummary] = useState('');

  const generateStreamingSummary = useCallback(
    async (
      videoId: string,
      refresh: boolean = false,
      onComplete?: (data: StreamingComplete) => void,
      onError?: (error: string) => void,
    ) => {
      setIsStreaming(true);
      setStreamedText('');
      setProgress(0);
      setFinalSummary('');

      try {
        const response = await fetch(
          `${config.apiUrl}/api/v1/timestamps/full-summary?stream=true`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              video_id: videoId,
              refresh,
            }),
            credentials: 'include',
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          let currentEvent = '';
          let currentData = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              currentEvent = line.slice(7);
            } else if (line.startsWith('data: ')) {
              currentData = line.slice(6);
            } else if (line === '') {
              if (currentEvent && currentData) {
                if (currentData === '[DONE]') {
                  continue;
                }

                try {
                  const parsed = JSON.parse(currentData);

                  if (currentEvent === 'chunk') {
                    const chunkData: StreamingChunk = parsed;
                    setStreamedText(
                      (prev) => prev + (prev ? ' ' : '') + chunkData.word,
                    );
                    setProgress((chunkData.index / chunkData.total) * 100);
                  } else if (currentEvent === 'complete') {
                    const completeData: StreamingComplete = parsed;
                    setFinalSummary(completeData.summary);
                    onComplete?.(completeData);
                    setIsStreaming(false);
                    return;
                  } else if (currentEvent === 'error') {
                    onError?.(parsed.error);
                    setIsStreaming(false);
                    return;
                  }
                } catch (e) {
                  console.error('Failed to parse SSE data:', e);
                }
              }

              currentEvent = '';
              currentData = '';
            }
          }
        }
      } catch (error) {
        console.error('Streaming error:', error);
        onError?.(error instanceof Error ? error.message : 'Unknown error');
        setIsStreaming(false);
      }
    },
    [],
  );

  const stopStreaming = useCallback(() => {
    setIsStreaming(false);
    setStreamedText('');
    setProgress(0);
    setFinalSummary('');
  }, []);

  return {
    isStreaming,
    streamedText,
    progress,
    finalSummary,
    generateStreamingSummary,
    stopStreaming,
  };
};
