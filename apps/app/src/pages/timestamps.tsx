import { AIChat, NotesPanel } from '@/components/notes';
import { VideoPlayer } from '@/components/video';
import { useStreamingSummary } from '@/hooks/use-streaming-summary';
import { useYouTubePlayer } from '@/hooks/youtube-player';
import { extractVideoId } from '@/lib/utils';
import { useGetVideoSummaryQuery } from '@/services/timestamps';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  toast,
} from '@ytclipper/ui';
import {
  Bot,
  Check,
  Copy,
  FileText,
  Loader2,
  Play,
  Sparkles,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useNavigate, useParams } from 'react-router';

export const TimestampsPage = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const [videoUrl, setVideoUrl] = useState('');
  const [fullSummary, setFullSummary] = useState('');
  const [isGeneratingFullSummary, setIsGeneratingFullSummary] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const { data: videoSummary } = useGetVideoSummaryQuery(videoId || '', {
    skip: !videoId,
    refetchOnMountOrArgChange: true,
  });

  useEffect(() => {
    if (videoSummary) {
      setFullSummary(videoSummary.data.summary);
      if (videoSummary.data.cached) {
        toast('Full video summary retrieved from cache!', {
          description: 'Using previously generated comprehensive summary.',
        });
      }
    }
  }, [videoSummary]);

  const { seekTo } = useYouTubePlayer();
  const { isStreaming, streamedText, progress, generateStreamingSummary } =
    useStreamingSummary();

  function useIsLargeScreen() {
    const [isLargeScreen, setIsLargeScreen] = useState(false);

    useEffect(() => {
      const mediaQuery = window.matchMedia('(min-width: 1024px)');
      const updateMatch = () => setIsLargeScreen(mediaQuery.matches);

      updateMatch();
      mediaQuery.addEventListener('change', updateMatch);
      return () => mediaQuery.removeEventListener('change', updateMatch);
    }, []);

    return isLargeScreen;
  }

  const isLargeScreen = useIsLargeScreen();

  const handleVideoUrlSubmit = () => {
    if (videoUrl) {
      const id = extractVideoId(videoUrl);
      if (id) {
        navigate(`/timestamps/${id}`);
        setVideoUrl('');
        toast('Video loaded successfully!', {
          description: 'You can now start taking notes at any timestamp.',
        });
      } else {
        toast('Invalid YouTube URL', {
          description: 'Please enter a valid YouTube video URL.',
        });
      }
    }
  };

  const handleGenerateFullVideoSummary = async () => {
    if (!videoId) {
      return;
    }

    setIsGeneratingFullSummary(true);
    setShowAnimation(true);

    try {
      await generateStreamingSummary(
        videoId,
        true,
        (data) => {
          setFullSummary(data.summary);
          if (data.cached) {
            toast('Full video summary retrieved from cache!', {
              description: 'Using previously generated comprehensive summary.',
            });
          } else {
            toast('Full video summary generated successfully!', {
              description:
                'AI has analyzed the entire video transcript and created a comprehensive summary.',
            });
          }
        },
        (error) => {
          console.error('Failed to generate full video summary:', error);

          const errorData = error as {
            data?: {
              error?: { code?: string; details?: { feature?: string } };
            };
          };
          if (errorData?.data?.error?.code === 'USAGE_LIMIT_EXCEEDED') {
            const feature = errorData?.data?.error?.details?.feature;
            let message = 'Usage limit exceeded for your current plan.';

            if (feature === 'ai_summaries') {
              message =
                'You have reached the AI summary limit for your current plan.';
            } else if (feature === 'videos') {
              message =
                'You have reached the video limit for your current plan.';
            } else if (feature === 'notes') {
              message =
                'You have reached the note limit for your current plan.';
            } else if (feature === 'ai_questions') {
              message =
                'You have reached the AI question limit for your current plan.';
            }

            toast.error(message, {
              description: 'Upgrade your plan to continue using this feature.',
              action: {
                label: 'Upgrade Now',
                onClick: () => {
                  window.location.href = '/pricing';
                },
              },
            });
          } else {
            toast('Failed to generate full video summary', {
              description: 'Please try again later.',
            });
          }
        },
      );
    } catch (error: unknown) {
      console.error('Failed to generate full video summary:', error);

      // Check if it's a usage limit exceeded error
      const errorData = error as {
        data?: { error?: { code?: string; details?: { feature?: string } } };
      };
      if (errorData?.data?.error?.code === 'USAGE_LIMIT_EXCEEDED') {
        const feature = errorData?.data?.error?.details?.feature;
        let message = 'Usage limit exceeded for your current plan.';

        if (feature === 'ai_summaries') {
          message =
            'You have reached the AI summary limit for your current plan.';
        } else if (feature === 'videos') {
          message = 'You have reached the video limit for your current plan.';
        } else if (feature === 'notes') {
          message = 'You have reached the note limit for your current plan.';
        } else if (feature === 'ai_questions') {
          message =
            'You have reached the AI question limit for your current plan.';
        }

        toast.error(message, {
          description: 'Upgrade your plan to continue using this feature.',
          action: {
            label: 'Upgrade Now',
            onClick: () => {
              window.location.href = '/pricing';
            },
          },
        });
      } else {
        toast('Failed to generate full video summary', {
          description: 'Please try again later.',
        });
      }
    } finally {
      setIsGeneratingFullSummary(false);
      setTimeout(() => setShowAnimation(false), 1000);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  if (!videoId) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <h2 className='text-xl font-semibold text-gray-900 mb-2'>
            Invalid Video ID
          </h2>
          <p className='text-gray-600'>
            No video ID provided in the URL parameters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col min-h-screen'>
      <main className='flex-1 max-w-9xl px-4 sm:px-6 lg:px-8 w-full'>
        <ResizablePanelGroup
          direction={isLargeScreen ? 'horizontal' : 'vertical'}
          className='h-full'
        >
          <ResizablePanel
            defaultSize={60}
            minSize={40}
            style={{ overflow: 'visible' }}
          >
            <div className='h-full'>
              <VideoPlayer
                videoId={videoId}
                className='w-full h-full rounded-b-none'
              />

              <div className='flex items-center justify-between mt-4'>
                <div className='w-full'>
                  <div className='flex gap-2'>
                    <Input
                      placeholder='Paste YouTube video URL here...'
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === 'Enter' && handleVideoUrlSubmit()
                      }
                    />
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={handleVideoUrlSubmit}
                      className='text-xs h-10 px-4'
                    >
                      <Play className='h-3 w-3 mr-1' />
                      Load Video
                    </Button>
                  </div>
                </div>
              </div>

              {/* Full Video Summary Card */}
              <Card className='mt-4'>
                <CardHeader className='pb-3'>
                  <div className='flex items-center justify-between'>
                    <CardTitle className='text-lg flex items-center gap-2'>
                      <Bot className='h-5 w-5' />
                      Full Video Analysis
                    </CardTitle>
                    <div className='flex gap-2'>
                      {fullSummary ? (
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => copyToClipboard(fullSummary)}
                        >
                          {copied ? (
                            <Check className='h-4 w-4 text-green-600' />
                          ) : (
                            <Copy className='h-4 w-4' />
                          )}
                        </Button>
                      ) : null}
                      <div className='flex gap-2'>
                        <Button
                          size='sm'
                          onClick={handleGenerateFullVideoSummary}
                          disabled={isGeneratingFullSummary}
                          className='h-10 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                        >
                          {isGeneratingFullSummary ? (
                            <>
                              <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <Sparkles className='h-4 w-4 mr-2' />
                              Full Analysis
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {showAnimation && isGeneratingFullSummary ? (
                    <div className='mb-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200'>
                      <div className='flex items-center justify-center space-x-2'>
                        <div className='animate-pulse'>
                          <div className='w-2 h-2 bg-purple-500 rounded-full' />
                        </div>
                        <div className='animate-pulse delay-100'>
                          <div className='w-2 h-2 bg-blue-500 rounded-full' />
                        </div>
                        <div className='animate-pulse delay-200'>
                          <div className='w-2 h-2 bg-purple-500 rounded-full' />
                        </div>
                        <span className='text-sm text-purple-700 font-medium'>
                          AI is analyzing the full video transcript...
                        </span>
                      </div>
                    </div>
                  ) : null}

                  {fullSummary || streamedText ? (
                    <div className='space-y-3'>
                      <div className='bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 text-sm text-gray-700 border border-purple-200 prose prose-sm max-w-none'>
                        {isStreaming ? (
                          <div className='space-y-4'>
                            <div className='text-sm text-gray-600 whitespace-pre-wrap'>
                              {streamedText}
                              <span className='animate-pulse'>|</span>
                            </div>
                            <div className='w-full bg-gray-200 rounded-full h-2'>
                              <div
                                className='bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300'
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <div className='text-xs text-gray-500 text-center'>
                              Generating summary... {Math.round(progress)}%
                            </div>
                          </div>
                        ) : (
                          <ReactMarkdown
                            components={{
                              h1: ({ children }) => (
                                <h1 className='text-xl font-bold text-gray-900 mb-4'>
                                  {children}
                                </h1>
                              ),
                              h2: ({ children }) => (
                                <h2 className='text-lg font-semibold text-gray-800 mb-3 mt-6'>
                                  {children}
                                </h2>
                              ),
                              h3: ({ children }) => (
                                <h3 className='text-base font-medium text-gray-700 mb-2 mt-4'>
                                  {children}
                                </h3>
                              ),
                              strong: ({ children }) => (
                                <strong className='font-semibold text-gray-900'>
                                  {children}
                                </strong>
                              ),
                              em: ({ children }) => (
                                <em className='italic text-gray-700'>
                                  {children}
                                </em>
                              ),
                              li: ({ children }) => {
                                const text = children?.toString() || '';
                                const timestampMatch =
                                  text.match(/\[(\d{2}):(\d{2})\]/);

                                if (timestampMatch) {
                                  return (
                                    <li className='mb-1 text-gray-700'>
                                      {text
                                        .split(/\[(\d{2}):(\d{2})\]/)
                                        .map((part, index) => {
                                          const key = `${part}-${index}`;
                                          if (part.match(/^\d{2}:\d{2}$/)) {
                                            const minutes = parseInt(
                                              part.split(':')[0],
                                              10,
                                            );
                                            const seconds = parseInt(
                                              part.split(':')[1],
                                              10,
                                            );
                                            const totalSeconds =
                                              minutes * 60 + seconds;
                                            return (
                                              <button
                                                key={key}
                                                onClick={() => {
                                                  seekTo(totalSeconds);
                                                  toast(
                                                    'Jumping to timestamp',
                                                    {
                                                      description: `Seeking to [${part}]`,
                                                    },
                                                  );
                                                }}
                                                className='text-blue-600 font-semibold cursor-pointer hover:text-blue-800 hover:underline mx-1'
                                              >
                                                [{part}]
                                              </button>
                                            );
                                          }
                                          return part;
                                        })}
                                    </li>
                                  );
                                }

                                return (
                                  <li className='mb-1 text-gray-700'>
                                    {children}
                                  </li>
                                );
                              },
                              ul: ({ children }) => (
                                <ul className='list-disc list-inside mb-4 space-y-1'>
                                  {children}
                                </ul>
                              ),
                              ol: ({ children }) => (
                                <ol className='list-decimal list-inside mb-4 space-y-1'>
                                  {children}
                                </ol>
                              ),
                              p: ({ children }) => (
                                <p className='mb-3 text-gray-700 leading-relaxed'>
                                  {children}
                                </p>
                              ),
                              code: ({ children }) => (
                                <code className='bg-gray-100 px-1 py-0.5 rounded text-sm font-mono'>
                                  {children}
                                </code>
                              ),
                            }}
                          >
                            {fullSummary}
                          </ReactMarkdown>
                        )}
                      </div>
                      <div className='flex flex-wrap gap-2'>
                        <Badge
                          variant='outline'
                          className='bg-purple-100 text-purple-700 border-purple-300'
                        >
                          #full-analysis
                        </Badge>
                        <Badge
                          variant='outline'
                          className='bg-blue-100 text-blue-700 border-blue-300'
                        >
                          #transcript
                        </Badge>
                        <Badge
                          variant='outline'
                          className='bg-green-100 text-green-700 border-green-300'
                        >
                          #timestamps
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className='space-y-3'>
                      <p className='text-sm text-muted-foreground'>
                        Generate a comprehensive analysis of the entire video
                        using AI transcript analysis. This includes key moments
                        with clickable timestamps, main takeaways, and detailed
                        insights.
                      </p>
                      <div className='flex flex-wrap gap-2'>
                        <Badge
                          variant='outline'
                          className='bg-purple-100 text-purple-700 border-purple-300'
                        >
                          #ai-analysis
                        </Badge>
                        <Badge
                          variant='outline'
                          className='bg-blue-100 text-blue-700 border-blue-300'
                        >
                          #comprehensive
                        </Badge>
                        <Badge
                          variant='outline'
                          className='bg-green-100 text-green-700 border-green-300'
                        >
                          #clickable-timestamps
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </ResizablePanel>

          <ResizableHandle className='m-4' />

          <ResizablePanel
            defaultSize={40}
            minSize={30}
            style={{ overflow: 'visible' }}
          >
            <div className='h-full'>
              <Tabs defaultValue='notes' className='h-full flex flex-col'>
                <TabsList className='grid w-full grid-cols-2'>
                  <TabsTrigger
                    value='notes'
                    className='flex items-center gap-2'
                  >
                    <FileText className='h-4 w-4' />
                    Notes
                  </TabsTrigger>
                  <TabsTrigger value='ai' className='flex items-center gap-2'>
                    <Bot className='h-4 w-4' />
                    AI Chat
                  </TabsTrigger>
                </TabsList>

                <TabsContent value='notes' className='flex-1 mt-4'>
                  <NotesPanel videoId={videoId} />
                </TabsContent>

                <TabsContent value='ai' className='flex-1 mt-4'>
                  <AIChat
                    videoId={videoId}
                    currentTimestamp={Date.now() / 1000}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
  );
};
