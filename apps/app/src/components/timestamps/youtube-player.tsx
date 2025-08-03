import { AspectRatio, Button } from '@ytclipper/ui';
import { Plus } from 'lucide-react';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

interface YTPlayerOptions {
  height?: string;
  width?: string;
  videoId: string;
  playerVars?: {
    playsinline?: number;
    enablejsapi?: number;
    origin?: string;
    autoplay?: number;
    controls?: number;
    rel?: number;
  };
  events?: {
    onReady?: (event: { target: YTPlayerClass }) => void;
    onError?: (event: { data: number }) => void;
    onStateChange?: (event: { data: number; target: YTPlayerClass }) => void;
  };
}

interface YTPlayerClass {
  seekTo(seconds: number, allowSeekAhead?: boolean): void;
  playVideo(): void;
  pauseVideo(): void;
  destroy(): void;
  getIframe(): HTMLIFrameElement;
  getCurrentTime(): number;
  getDuration(): number;
  getVideoData(): {
    title: string;
    video_id: string;
    author: string;
    video_quality: string;
    video_embed_frame: string;
  };
  getVideoUrl(): string;
  getPlaylist(): string[];
  getPlaylistIndex(): number;
  getAvailablePlaybackRates(): number[];
  getPlaybackRate(): number;
  getAvailableQualityLevels(): string[];
  getPlaybackQuality(): string;
  getPlayerState(): number;
}

export interface VideoMetadata {
  video_id: string;
  title: string;
  duration?: number;
  thumbnail_url?: string;
  channel_title?: string;
}

declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        options: YTPlayerOptions,
      ) => YTPlayerClass;
      PlayerState: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

export interface YouTubePlayerProps {
  videoId: string;
  onReady?: () => void;
  onError?: (error: number) => void;
  onVideoTitle?: (title: string) => void;
  onVideoMetadata?: (metadata: VideoMetadata) => void;
  onWatchedDurationUpdate?: (watchedDuration: number) => void;
  className?: string;
}

interface YouTubePlayerRef {
  seekTo: (seconds: number) => void;
  play: () => void;
  pause: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getWatchedDuration: () => number;
  onVideoTitle?: () => string | null;
  getVideoData?: () => {
    title: string;
    video_id: string;
  };
  getVideoMetadata?: () => VideoMetadata | null;
}

let isAPILoaded = false;
let isAPILoading = false;
const waitingComponents: (() => void)[] = [];

const loadYouTubeAPI = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (isAPILoaded) {
      resolve();
      return;
    }

    if (isAPILoading) {
      waitingComponents.push(() => resolve());
      return;
    }

    isAPILoading = true;

    window.onYouTubeIframeAPIReady = () => {
      isAPILoaded = true;
      isAPILoading = false;
      waitingComponents.forEach((callback) => callback());
      waitingComponents.length = 0;
      resolve();
    };

    const existingScript = document.querySelector(
      'script[src="https://www.youtube.com/iframe_api"]',
    );
    if (existingScript) {
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;
    tag.onload = () => {
      console.log('YouTube API script loaded');
    };
    tag.onerror = (error) => {
      console.error('Failed to load YouTube API script:', error);
      isAPILoading = false;
      reject(error);
    };

    const firstScriptTag = document.getElementsByTagName('script')[0];
    if (firstScriptTag && firstScriptTag.parentNode) {
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    } else {
      document.head.appendChild(tag);
    }

    setTimeout(() => {
      if (isAPILoading) {
        console.error('YouTube API loading timeout');
        isAPILoading = false;
        reject(new Error('YouTube API loading timeout'));
      }
    }, 15000);
  });
};

export const YouTubePlayer = forwardRef<YouTubePlayerRef, YouTubePlayerProps>(
  (
    {
      videoId,
      onReady,
      onError,
      onVideoTitle,
      onVideoMetadata,
      onWatchedDurationUpdate,
      className = '',
    }: YouTubePlayerProps,
    ref,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const playerInstanceRef = useRef<YTPlayerClass | null>(null);
    const playerIdRef = useRef<string>(
      `youtube-player-${Math.random().toString(36).substring(2, 15)}`,
    );
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [videoTitle, setVideoTitle] = useState<string | null>(null);
    const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(
      null,
    );
    const [watchedDuration, setWatchedDuration] = useState<number>(0);
    const onVideoTitleRef = useRef(onVideoTitle);
    const onVideoMetadataRef = useRef(onVideoMetadata);
    const onWatchedDurationUpdateRef = useRef(onWatchedDurationUpdate);

    const onReadyRef = useRef(onReady);
    const onErrorRef = useRef(onError);
    useEffect(() => {
      onVideoTitleRef.current = onVideoTitle;
    }, [onVideoTitle]);
    useEffect(() => {
      onReadyRef.current = onReady;
    }, [onReady]);

    useEffect(() => {
      onErrorRef.current = onError;
    }, [onError]);

    useEffect(() => {
      onVideoMetadataRef.current = onVideoMetadata;
      console.log('onVideoMetadataRef', onVideoMetadataRef.current);
    }, [onVideoMetadata]);

    useEffect(() => {
      onWatchedDurationUpdateRef.current = onWatchedDurationUpdate;
    }, [onWatchedDurationUpdate]);

    const playerMethods = useMemo<YouTubePlayerRef>(() => {
      return {
        seekTo: (seconds: number) => {
          if (playerInstanceRef.current && isPlayerReady) {
            try {
              playerInstanceRef.current.seekTo(seconds, true);
            } catch (error) {
              console.error('Error seeking:', error);
            }
          } else {
            console.warn(
              'Player not ready for seeking. Ready:',
              isPlayerReady,
              'Instance:',
              !!playerInstanceRef.current,
            );
          }
        },
        play: () => {
          if (playerInstanceRef.current && isPlayerReady) {
            try {
              playerInstanceRef.current.playVideo();
            } catch (error) {
              console.error('Error playing:', error);
            }
          }
        },
        pause: () => {
          if (playerInstanceRef.current && isPlayerReady) {
            try {
              playerInstanceRef.current.pauseVideo();
            } catch (error) {
              console.error('Error pausing:', error);
            }
          }
        },
        getCurrentTime: () => {
          if (playerInstanceRef.current && isPlayerReady) {
            try {
              return playerInstanceRef.current.getCurrentTime();
            } catch (error) {
              console.error('Error getting current time:', error);
            }
          }
          return 0;
        },
        getDuration: () => {
          if (playerInstanceRef.current && isPlayerReady) {
            try {
              return playerInstanceRef.current.getDuration();
            } catch (error) {
              console.error('Error getting duration:', error);
            }
          }
          return 0;
        },
        getWatchedDuration: () => {
          return watchedDuration;
        },
        getVideoTitle: () => {
          return videoTitle;
        },
        getVideoData: () => {
          if (playerInstanceRef.current && isPlayerReady) {
            try {
              return playerInstanceRef.current.getVideoData();
            } catch (error) {
              console.error('Error getting video data:', error);
            }
          }
          return { title: '', video_id: '' };
        },
        getVideoMetadata: () => {
          return videoMetadata;
        },
      };
    }, [isPlayerReady, videoTitle, videoMetadata, watchedDuration]);

    React.useImperativeHandle(ref, () => playerMethods, [playerMethods]);

    const handlePlayerReady = useCallback(() => {
      setIsPlayerReady(true);
      setError(null);
      if (playerInstanceRef.current) {
        try {
          const videoData = playerInstanceRef.current.getVideoData();
          const title = videoData.title;
          if (title) {
            setVideoTitle(title);
            onVideoTitleRef.current?.(title);
          }

          // Get comprehensive video metadata
          const metadata = playerInstanceRef.current.getVideoData();
          const duration = playerInstanceRef.current.getDuration();

          // Create basic metadata object with only available data
          const videoMetadataData: VideoMetadata = {
            video_id: metadata.video_id,
            title: metadata.title,
            channel_title: metadata.author,
            duration,
            thumbnail_url: `https://img.youtube.com/vi/${metadata.video_id}/hqdefault.jpg`,
          };

          setVideoMetadata(videoMetadataData);
          onVideoMetadataRef.current?.(videoMetadataData);
        } catch (error) {
          console.error('Error fetching video title:', error);
        }
      }

      onReadyRef.current?.();
    }, []);

    useEffect(() => {
      if (!isPlayerReady || !playerInstanceRef.current) {
        return undefined;
      }

      const updateWatchedDuration = () => {
        if (playerInstanceRef.current) {
          const currentTime = playerInstanceRef.current.getCurrentTime();
          const playerState = playerInstanceRef.current.getPlayerState();

          if (playerState === 1 && currentTime > 0) {
            setWatchedDuration(currentTime);
            onWatchedDurationUpdateRef.current?.(currentTime);
          }
        }
      };

      const durationInterval = setInterval(updateWatchedDuration, 10000);

      return () => {
        clearInterval(durationInterval);
      };
    }, [isPlayerReady]);

    const handlePlayerError = useCallback((event: { data: number }) => {
      console.error('YouTube player error:', event.data);
      const errorMessages: { [key: number]: string } = {
        2: 'Invalid video ID',
        5: 'HTML5 player error',
        100: 'Video not found or private',
        101: 'Video not allowed in embedded players',
        150: 'Video not allowed in embedded players',
      };
      const errorMessage =
        errorMessages[event.data] || `Unknown error (${event.data})`;
      setError(errorMessage);
      onErrorRef.current?.(event.data);
    }, []);

    useEffect(() => {
      const initializePlayer = async () => {
        const currentVideoId = videoId;
        if (!containerRef.current || !currentVideoId) {
          return;
        }

        try {
          await loadYouTubeAPI();

          containerRef.current.innerHTML = '';
          const playerDiv = document.createElement('div');
          playerDiv.id = playerIdRef.current;
          playerDiv.style.cssText = 'width: 100%; height: 100%;';
          containerRef.current.appendChild(playerDiv);

          playerInstanceRef.current = new window.YT.Player(
            playerIdRef.current,
            {
              height: '100%',
              width: '100%',
              videoId: currentVideoId,
              playerVars: {
                playsinline: 1,
                enablejsapi: 1,
                origin: window.location.origin,
                rel: 0,
                controls: 1,
                autoplay: 0,
              },
              events: {
                onReady: handlePlayerReady,
                onError: handlePlayerError,
                onStateChange: () => {},
              },
            },
          );
        } catch (err) {
          console.error('Failed to initialize YouTube player:', err);
          setError('Failed to load YouTube player');
        }
      };

      if (videoId) {
        setIsPlayerReady(false);
        setError(null);
        initializePlayer();
      }

      return () => {
        if (playerInstanceRef.current) {
          try {
            playerInstanceRef.current.destroy();
          } catch (err) {
            console.warn('Error destroying player:', err);
          }
          playerInstanceRef.current = null;
        }
        setIsPlayerReady(false);
      };
    }, [videoId, handlePlayerReady, handlePlayerError]);

    if (error) {
      return (
        <div
          className={`bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded ${className}`}
        >
          <strong className='font-bold'>Error: </strong>
          <span>{error}</span>
        </div>
      );
    }

    return (
      <AspectRatio ratio={16 / 9} className='w-full'>
        <div
          className={`relative bg-black rounded-lg overflow-hidden ${className}`}
        >
          <div ref={containerRef} className='w-full h-full min-h-[200px]' />

          {!isPlayerReady && !error && (
            <div className='absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100'>
              <div className='text-center'>
                <div className='relative mb-6'>
                  <div className='w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto' />
                  <div className='absolute inset-0 flex items-center justify-center'>
                    <div className='w-8 h-8 bg-orange-500 rounded-full animate-pulse' />
                  </div>
                </div>

                <div className='mb-4'>
                  <h3 className='text-lg font-semibold text-gray-800 mb-2'>
                    Loading YouTube Player
                  </h3>
                  <p className='text-gray-600 text-sm'>
                    Please wait while we prepare your video...
                  </p>
                </div>

                <div className='flex justify-center space-x-1 mb-4'>
                  <div className='w-2 h-2 bg-orange-400 rounded-full animate-pulse' />
                  <div
                    className='w-2 h-2 bg-orange-400 rounded-full animate-pulse'
                    style={{ animationDelay: '0.2s' }}
                  />
                  <div
                    className='w-2 h-2 bg-orange-400 rounded-full animate-pulse'
                    style={{ animationDelay: '0.4s' }}
                  />
                </div>

                <div className='bg-white/80 backdrop-blur-sm rounded-lg p-3 text-xs text-gray-600'>
                  <div className='space-y-1'>
                    <div className='flex justify-between'>
                      <span>API Status:</span>
                      <span
                        className={
                          isAPILoaded ? 'text-green-600' : 'text-orange-600'
                        }
                      >
                        {isAPILoaded ? 'Ready' : 'Loading...'}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span>Video ID:</span>
                      <span className='font-mono text-gray-700'>{videoId}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <Button
            variant='floating'
            size='icon'
            className='absolute top-4 right-4 rounded-full'
            onClick={() => {
              console.log('Add to Clip button clicked');
            }}
          >
            <Plus className='h-5 w-5' />
          </Button>
        </div>
      </AspectRatio>
    );
  },
);

YouTubePlayer.displayName = 'YouTubePlayer';

export type { YouTubePlayerRef };
