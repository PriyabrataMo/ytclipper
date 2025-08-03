import { useDebounce } from '@/hooks/use-debounce';
import {
  needsMetadataUpdate,
  useUpdateVideoMetadataMutation,
  useUpdateWatchedDurationMutation,
} from '@/services/videos';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setCurrentTimestamp,
  setVideoTitle,
} from '@/store/slices/timestampSlice';
import MDEditor from '@uiw/react-md-editor';
import {
  Button,
  Card,
  cn,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
} from '@ytclipper/ui';
import { Badge, Hash, Loader2, Plus, Tag, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  useCreateTimestampMutation,
  useSearchTagsMutation,
} from '../../services/timestamps';
import {
  YouTubePlayer,
  type VideoMetadata,
  type YouTubePlayerProps,
  type YouTubePlayerRef,
} from '../timestamps/youtube-player';

interface VideoPlayerProps extends Omit<YouTubePlayerProps, 'videoId'> {
  videoId: string;
  onTimeUpdate?: (currentTime: number) => void;
  onAddNote?: (timestamp: number) => void;
}

export const VideoPlayer = ({
  videoId,
  onAddNote,
  className,
}: VideoPlayerProps) => {
  const videoRef = useRef<YouTubePlayerRef>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [watchedDuration, setWatchedDuration] = useState(0);
  const timestampsData = useAppSelector((data) => data.timestamps);
  const dispatch = useAppDispatch();
  const [updateVideoMetadata] = useUpdateVideoMetadataMutation();
  const [updateWatchedDuration] = useUpdateWatchedDurationMutation();

  const debouncedWatchedDuration = useDebounce(watchedDuration, 5000);
  const lastSentDurationRef = useRef(0);

  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNote, setNewNote] = useState({
    timestamp: 0,
    title: '',
    note: '',
    tags: [] as string[],
  });
  const timeStampsSliceData = useAppSelector((state) => state.timestamps);
  const currentTime = timeStampsSliceData.currentTimestamp;
  const [tagInput, setTagInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [searchTags, { data: searchedTags }] = useSearchTagsMutation();
  const debouncedTagInput = useDebounce(tagInput, 300);
  const [createTimestamp, { isLoading: isCreating }] =
    useCreateTimestampMutation();

  const handlePlayerReady = () => {
    setIsPlayerReady(true);
  };

  const handlePlayerError = (error: number) => {
    console.error('Player error:', error);
    setIsPlayerReady(false);
  };

  const handleVideoTitle = async (title: string) => {
    dispatch(setVideoTitle(title));

    if (needsMetadataUpdate(videoId)) {
      try {
        await updateVideoMetadata({
          video_id: videoId,
          youtube_url: `https://youtube.com/watch?v=${videoId}`,
          title,
        }).unwrap();
        console.log('Video metadata updated successfully');
      } catch (error) {
        console.error('Failed to update video metadata:', error);
      }
    } else {
      console.log('Video metadata already exists, skipping update');
    }
  };

  const handleVideoMetadata = async (metadata: VideoMetadata) => {
    if (needsMetadataUpdate(videoId)) {
      try {
        await updateVideoMetadata({
          video_id: videoId,
          youtube_url: `https://youtube.com/watch?v=${videoId}`,
          title: metadata.title,
          duration: metadata.duration,
          thumbnail_url: metadata.thumbnail_url,
          channel_title: metadata.channel_title,
        }).unwrap();
        console.log('Basic video metadata updated successfully');
      } catch (error) {
        console.error('Failed to update video metadata:', error);
      }
    }
  };

  const handleWatchedDurationUpdate = (duration: number) => {
    if (duration > watchedDuration) {
      setWatchedDuration(duration);
    }
  };

  const handleCreateNote = async () => {
    if (newNote.title.trim()) {
      try {
        await createTimestamp({
          video_id: videoId,
          timestamp: currentTime,
          title: newNote.title,
          note: newNote.note,
          tags: newNote.tags,
        }).unwrap();

        setNewNote({ timestamp: 0, title: '', note: '', tags: [] });
        setIsAddingNote(false);
        // If you need to refetch data, implement it here.
      } catch (error) {
        console.error('Failed to create note:', error);
      }
    }
  };

  const handleCloseAddNote = () => {
    setIsAddingNote(false);
  };

  const addTag = (tags: string[], setTags: (tags: string[]) => void) => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
    }
    setTagInput('');
    setShowTagSuggestions(false);
  };

  const removeTag = (
    tagToRemove: string,
    tags: string[],
    setTags: (tags: string[]) => void,
  ) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const filteredTags = searchedTags?.data?.tags || [];

  useEffect(() => {
    if (debouncedTagInput.trim().length > 0) {
      searchTags({ query: debouncedTagInput });
    }
  }, [debouncedTagInput, searchTags]);

  useEffect(() => {
    if (debouncedWatchedDuration > lastSentDurationRef.current) {
      updateWatchedDuration({
        videoId,
        data: { watched_duration: Math.floor(debouncedWatchedDuration) },
      })
        .unwrap()
        .then(() => {
          lastSentDurationRef.current = debouncedWatchedDuration;
          console.log(
            'Watched duration sent to backend:',
            Math.floor(debouncedWatchedDuration),
          );
        })
        .catch((error) => {
          console.error('Failed to update watched duration:', error);
        });
    }
  }, [debouncedWatchedDuration, videoId, updateWatchedDuration]);

  useEffect(() => {
    return () => {
      if (watchedDuration > lastSentDurationRef.current) {
        updateWatchedDuration({
          videoId,
          data: { watched_duration: Math.floor(watchedDuration) },
        }).catch((error) => {
          console.error('Failed to send final watched duration update:', error);
        });
      }
    };
  }, [videoId, updateWatchedDuration, watchedDuration]);

  useEffect(() => {
    if (!isPlayerReady || !videoRef?.current) {
      return undefined;
    }

    const interval = setInterval(() => {
      const currentTime = videoRef.current?.getCurrentTime?.();
      if (typeof currentTime === 'number') {
        dispatch(setCurrentTimestamp(currentTime));
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isPlayerReady, videoRef, dispatch]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAddNote = () => {
    onAddNote?.(timestampsData.currentTimestamp);
    setIsAddingNote(true);
  };

  return (
    <Card className='w-full bg-video-bg p-0 gap-0 overflow-hidden shadow-video'>
      <YouTubePlayer
        videoId={videoId}
        onError={handlePlayerError}
        onReady={handlePlayerReady}
        onVideoTitle={handleVideoTitle}
        onVideoMetadata={handleVideoMetadata}
        onWatchedDurationUpdate={handleWatchedDurationUpdate}
        className={cn(className)}
        ref={videoRef}
      />
      <div className='bg-notes-bg p-3 border-t'>
        <div className='flex items-center justify-between'>
          <div className='text-sm text-muted-foreground'>
            <div>
              Current Time:{' '}
              <span className='text-orange-600 font-bold font-mono'>
                {formatTime(timestampsData.currentTimestamp)}
              </span>
            </div>
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={handleAddNote}
            className='text-xs h-8 px-3'
          >
            <Plus className='h-3 w-3 mr-1' />
            Add Note
          </Button>
          <Dialog open={isAddingNote} onOpenChange={handleCloseAddNote}>
            <DialogContent className='w-full !max-w-4xl md:!w-[64rem] max-h-[90vh] overflow-y-auto'>
              <DialogHeader>
                <DialogTitle>Add New Note</DialogTitle>
              </DialogHeader>
              <div className='flex flex-col md:flex-row md:space-x-8 space-y-4 md:space-y-0 w-full'>
                <div className='flex-1 min-w-0 space-y-2'>
                  <div>
                    <label
                      htmlFor='title'
                      className='text-sm font-medium text-gray-700 mb-2 block'
                    >
                      Title
                    </label>
                    <Input
                      id='title'
                      placeholder='Enter a descriptive title for your note...'
                      value={newNote.title}
                      onChange={(e) =>
                        setNewNote((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className='flex-1 space-y-2'>
                    <label
                      htmlFor='note'
                      className='text-sm font-medium text-gray-700 mb-2 block'
                    >
                      Note Content (Markdown Editor)
                    </label>
                    <p className='text-xs text-gray-500 mt-2'>
                      💡 Supports markdown: **bold**, *italic*, `code`,
                      [links](url), headers, lists, and more
                    </p>
                    <div className='border border-gray-300 rounded-lg overflow-hidden'>
                      <MDEditor
                        value={newNote.note}
                        onChange={(value) =>
                          setNewNote((prev) => ({
                            ...prev,
                            note: value || '',
                          }))
                        }
                        height={300}
                        preview='live'
                        className='w-full'
                      />
                    </div>
                  </div>
                </div>
                <div className='flex flex-col justify-between md:w-1/3 w-full'>
                  <div className='flex flex-col gap-2 h-full overflow-scroll px-2'>
                    <div>
                      <label
                        htmlFor='timestamp'
                        className='text-sm font-medium text-gray-700 mb-2 block'
                      >
                        Timestamp (Current Video Time)
                      </label>
                      <Input
                        id='timestamp'
                        type='text'
                        value={formatTime(currentTime)}
                        disabled
                        className='bg-gray-50 border-gray-300 text-gray-700 font-mono'
                      />
                    </div>
                    <div className='relative'>
                      <label
                        htmlFor='tags'
                        className='text-sm font-medium text-gray-700 mb-2 block'
                      >
                        Tags
                      </label>
                      <div className='flex gap-2'>
                        <Input
                          id='tags'
                          placeholder='Search existing tags or create new ones...'
                          value={tagInput}
                          onChange={(e) => {
                            setTagInput(e.target.value);
                            setShowTagSuggestions(e.target.value.length > 0);
                          }}
                          onKeyPress={(e) =>
                            e.key === 'Enter' &&
                            addTag(newNote.tags, (tags) =>
                              setNewNote((prev) => ({ ...prev, tags })),
                            )
                          }
                        />
                        <Button
                          type='button'
                          variant='outline'
                          onClick={() =>
                            addTag(newNote.tags, (tags) =>
                              setNewNote((prev) => ({ ...prev, tags })),
                            )
                          }
                        >
                          <Hash className='h-4 w-4' />
                        </Button>
                      </div>

                      {showTagSuggestions ? (
                        <div className='absolute z-10 w-full mt-1 bg-background border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto'>
                          {filteredTags.map((tag) => (
                            <button
                              key={tag.id}
                              type='button'
                              onClick={() => {
                                if (!newNote.tags.includes(tag.name)) {
                                  setNewNote((prev) => ({
                                    ...prev,
                                    tags: [...prev.tags, tag.name],
                                  }));
                                }
                                setTagInput('');
                                setShowTagSuggestions(false);
                              }}
                              className='w-full text-left px-4 p-2 hover:bg-secondary flex items-center gap-3 border-b border-gray-100 last:border-b-0 text-sm'
                            >
                              <Tag className='h-3 w-3 text-gray-400' />
                              <span className='text-gray-700'>{tag.name}</span>
                            </button>
                          ))}
                          {tagInput &&
                          !filteredTags.some(
                            (tag) =>
                              tag.name.toLowerCase() === tagInput.toLowerCase(),
                          ) ? (
                            <button
                              type='button'
                              onClick={() =>
                                addTag(newNote.tags, (tags) =>
                                  setNewNote((prev) => ({ ...prev, tags })),
                                )
                              }
                              className='w-full text-left px-4 py-2 hover:bg-secondary flex items-center text-orange-600 border-b border-gray-100 last:border-b-0 text-sm'
                            >
                              <Plus className='h-3 w-3' />
                              <span className='px-3'>
                                Create &ldquo;{tagInput}&rdquo;
                              </span>
                            </button>
                          ) : null}
                        </div>
                      ) : null}

                      <div className='flex flex-wrap gap-2 mt-3'>
                        {newNote.tags.map((tag) => (
                          <Badge key={tag} className='text-xs'>
                            {tag}
                            <Button
                              variant='ghost'
                              size='sm'
                              className='h-auto p-0 ml-1'
                              onClick={() =>
                                removeTag(tag, newNote.tags, (tags) =>
                                  setNewNote((prev) => ({ ...prev, tags })),
                                )
                              }
                            >
                              <X className='h-3 w-3' />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className='flex justify-between gap-2 mt-4'>
                    <Button
                      onClick={handleCreateNote}
                      className='flex-1'
                      disabled={isCreating}
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                          Creating Note...
                        </>
                      ) : (
                        'Create Note'
                      )}
                    </Button>
                    <Button variant='outline' onClick={handleCloseAddNote}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </Card>
  );
};
