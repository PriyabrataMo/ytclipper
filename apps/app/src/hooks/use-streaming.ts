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

export const useStreaming = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [progress, setProgress] = useState(0);

  const startStreaming = useCallback(
    async (
      url: string,
      body: Record<string, unknown>,
      onComplete?: (data: StreamingComplete) => void,
      onError?: (error: string) => void,
    ) => {
      setIsStreaming(true);
      setStreamedText('');
      setProgress(0);

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // body: JSON.stringify(body),
          credentials: 'include',
        });

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
          console.log('Received chunk:', chunk); // Debug log
          buffer += chunk;
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          let currentEvent = '';
          let currentData = '';

          console.log('Processing lines:', lines); // Debug log

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              currentEvent = line.slice(7);
            } else if (line.startsWith('data: ')) {
              currentData = line.slice(6);
            } else if (line === '') {
              // Empty line indicates end of event
              if (currentEvent && currentData) {
                if (currentData === '[DONE]') {
                  continue;
                }

                try {
                  const parsed = JSON.parse(currentData);
                  console.log('SSE Event:', currentEvent, 'Data:', parsed); // Debug log

                  if (currentEvent === 'chunk') {
                    const chunk: StreamingChunk = parsed;
                    setStreamedText(
                      (prev) => prev + (prev ? ' ' : '') + chunk.word,
                    );
                    setProgress((chunk.index / chunk.total) * 100);
                  } else if (currentEvent === 'complete') {
                    const complete: StreamingComplete = parsed;
                    onComplete?.(complete);
                    setIsStreaming(false);
                    return;
                  } else if (currentEvent === 'error') {
                    onError?.(parsed.error);
                    setIsStreaming(false);
                    return;
                  }
                } catch (e) {
                  console.error(
                    'Failed to parse SSE data:',
                    e,
                    'Raw data:',
                    currentData,
                    'Event:',
                    currentEvent,
                  );
                }
              }

              // Reset for next event
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
  }, []);

  return {
    isStreaming,
    streamedText,
    progress,
    startStreaming,
    stopStreaming,
  };
};
