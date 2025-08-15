import { extractVideoId } from '@/lib/utils';
import {
  useGetUserVideosQuery,
  useHardDeleteVideoMutation,
  useRestoreVideoMutation,
  useSoftDeleteVideoMutation,
  type VideoFilters,
} from '@/services/videos';
import {
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  toast,
} from '@ytclipper/ui';
import { HardDrive, Plus, Trash2, Youtube } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

import { VideoCard } from '@/components/video/video-card';
import { VideoFiltersComponent } from '@/components/video/video-filters';
import { v4 as uuidv4 } from 'uuid';

const defaultFilters: VideoFilters = {
  search: '',
  status: 'active',
  sortBy: 'created_at',
  sortOrder: 'desc',
  durationRange: 'all',
  progressRange: 'all',
};

const parseFiltersFromSearchParams = (
  searchParams: URLSearchParams,
): VideoFilters => {
  return {
    search: searchParams.get('search') || '',
    status: (searchParams.get('status') as VideoFilters['status']) || 'active',
    sortBy:
      (searchParams.get('sortBy') as VideoFilters['sortBy']) || 'created_at',
    sortOrder:
      (searchParams.get('sortOrder') as VideoFilters['sortOrder']) || 'desc',
    durationRange:
      (searchParams.get('durationRange') as VideoFilters['durationRange']) ||
      'all',
    progressRange:
      (searchParams.get('progressRange') as VideoFilters['progressRange']) ||
      'all',
  };
};

const updateSearchParamsFromFilters = (
  searchParams: URLSearchParams,
  filters: VideoFilters,
) => {
  const newSearchParams = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (
      value &&
      value !== '' &&
      value !== 'all' &&
      !(key === 'sortBy' && value === 'created_at') &&
      !(key === 'sortOrder' && value === 'desc')
    ) {
      newSearchParams.set(key, value);
    }
  });

  return newSearchParams;
};

export const VideosPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [videoUrl, setVideoUrl] = useState('');
  const [isAddingVideo, setIsAddingVideo] = useState(false);

  // Initialize filters from URL search params
  const [filters, setFilters] = useState<VideoFilters>(() => {
    return parseFiltersFromSearchParams(searchParams);
  });

  const [useFilteredQuery, setUseFilteredQuery] = useState(false);

  // API queries
  const {
    data: allVideosData,
    isLoading: isLoadingAll,
    refetch: refetchAll,
  } = useGetUserVideosQuery();
  const {
    data: filteredVideosData,
    isLoading: isLoadingFiltered,
    refetch: refetchFiltered,
  } = useGetUserVideosQuery(filters, { skip: !useFilteredQuery });

  // Mutations
  const [softDeleteVideo] = useSoftDeleteVideoMutation();
  const [hardDeleteVideo] = useHardDeleteVideoMutation();
  const [restoreVideo] = useRestoreVideoMutation();

  // State for modals
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'soft' | 'hard'>('soft');

  // Get videos from Redux store or API
  const allVideos = allVideosData?.data?.videos || [];
  const filteredVideos = filteredVideosData?.data?.videos || [];

  const videos = useFilteredQuery ? filteredVideos : allVideos;
  const isLoading = useFilteredQuery ? isLoadingFiltered : isLoadingAll;

  // Calculate video counts
  const activeVideos = allVideos.filter((v) => !v.deleted_at).length;
  const deletedVideos = allVideos.filter((v) => v.deleted_at).length;
  const totalVideos = allVideos.length;

  // Check if filters are active
  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'search') {
      return value !== '';
    }
    if (key === 'sortBy') {
      return value !== 'created_at';
    }
    if (key === 'sortOrder') {
      return value !== 'desc';
    }
    return value !== 'all';
  });

  // Switch to filtered query when filters are active
  useEffect(() => {
    setUseFilteredQuery(hasActiveFilters);
  }, [hasActiveFilters]);

  // Update filters when URL search params change (e.g., browser back/forward)
  useEffect(() => {
    const newFilters = parseFiltersFromSearchParams(searchParams);
    setFilters(newFilters);
  }, [searchParams]);

  const handleVideoUrlSubmit = () => {
    if (videoUrl) {
      const id = extractVideoId(videoUrl);
      if (id) {
        setIsAddingVideo(true);
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

  const handleDeleteVideo = async () => {
    if (videoToDelete === null) {
      return;
    }

    try {
      if (deleteType === 'soft') {
        await softDeleteVideo({ videoId: videoToDelete });
        toast('Video moved to trash successfully!', {
          description: 'You can restore it later or permanently delete it.',
        });
      } else {
        await hardDeleteVideo({ videoId: videoToDelete });
        toast('Video permanently deleted!', {
          description: 'This action cannot be undone.',
        });
      }

      setVideoToDelete(null);
      setDeleteModalOpen(false);
      refetchData();
    } catch (error) {
      console.error('Failed to delete video:', error);
      toast('Failed to delete video', {
        description: 'An error occurred while deleting the video.',
      });
    }
  };

  const handleRestoreVideo = async (videoId: string) => {
    try {
      await restoreVideo({ videoId });
      toast('Video restored successfully!', {
        description: 'The video is now active again.',
      });
      refetchData();
    } catch (error) {
      console.error('Failed to restore video:', error);
      toast('Failed to restore video', {
        description: 'An error occurred while restoring the video.',
      });
    }
  };

  const handleHardDeleteVideo = async (videoId: string) => {
    setVideoToDelete(videoId);
    setDeleteType('hard');
    setDeleteModalOpen(true);
  };

  const handleSoftDeleteVideo = async (videoId: string) => {
    setVideoToDelete(videoId);
    setDeleteType('soft');
    setDeleteModalOpen(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVideoUrlSubmit();
    }
  };

  const handleFiltersChange = (newFilters: VideoFilters) => {
    setFilters(newFilters);
    // Update URL search params
    const newSearchParams = updateSearchParamsFromFilters(
      new URLSearchParams(searchParams),
      newFilters,
    );
    setSearchParams(newSearchParams, { replace: true });
  };

  const handleClearFilters = () => {
    setFilters(defaultFilters);
    // Clear URL search params
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const refetchData = () => {
    if (useFilteredQuery) {
      refetchFiltered();
    } else {
      refetchAll();
    }
  };

  // Use videos directly since filtering is now done on backend
  const filteredVideosForDisplay = videos;

  return (
    <>
      <div className='p-6 max-w-7xl mx-auto bg-background'>
        <div className='mb-6'>
          <div className='flex-1 lg:flex space-y-4 items-center justify-between mb-4'>
            <div>
              <h1 className='text-2xl font-bold text-gray-900'>Your Videos</h1>
              <p className='text-gray-600 text-sm mt-1'>
                {totalVideos} video{totalVideos !== 1 ? 's' : ''} •{' '}
                {allVideos.reduce((sum, v) => sum + v.count, 0)} total notes
              </p>
            </div>

            <div className='flex items-center gap-3'>
              <Button variant='outline' size='sm'>
                <Plus className='w-4 h-4 mr-2' />
                Add Video
              </Button>
            </div>
          </div>
        </div>

        {/* Filters Component */}
        <div className='mb-4'>
          <VideoFiltersComponent
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
            activeVideos={activeVideos}
            deletedVideos={deletedVideos}
          />
        </div>

        {/* Compact Add Video Section */}
        {!isLoading && (
          <div className='mb-6'>
            <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200'>
              <div className='flex-1'>
                <Input
                  type='text'
                  placeholder='Paste YouTube URL to add a new video...'
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className='w-full'
                />
              </div>
              <Button
                onClick={handleVideoUrlSubmit}
                disabled={!videoUrl.trim() || isAddingVideo}
                size='sm'
              >
                <Plus className='w-4 h-4 mr-2' />
                {isAddingVideo ? 'Loading...' : 'Add Video'}
              </Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
            {Array.from({ length: 8 }, () => uuidv4()).map((id) => (
              <Card key={id} className='overflow-hidden animate-pulse'>
                {/* Thumbnail skeleton */}
                <div className='relative w-full h-40 bg-gray-200'>
                  <div className='absolute inset-0 flex items-center justify-center'>
                    <div className='w-12 h-12 bg-gray-300 rounded-full' />
                  </div>
                  {/* Progress bar skeleton */}
                  <div className='absolute bottom-0 left-0 right-0 h-1 bg-gray-300'>
                    <div className='h-full bg-gray-400 w-1/3' />
                  </div>
                  {/* Note count skeleton */}
                  <div className='absolute top-2 right-2 bg-gray-300 rounded px-2 py-1'>
                    <div className='w-12 h-3 bg-gray-400 rounded' />
                  </div>
                </div>

                {/* Content skeleton */}
                <div className='p-4 space-y-3'>
                  {/* Title skeleton */}
                  <div className='space-y-2'>
                    <div className='h-4 bg-gray-200 rounded w-full' />
                    <div className='h-4 bg-gray-200 rounded w-3/4' />
                  </div>

                  {/* Metadata skeleton */}
                  <div className='space-y-2 pt-2'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center space-x-2'>
                        <div className='w-4 h-4 bg-gray-300 rounded' />
                        <div className='h-3 bg-gray-200 rounded w-16' />
                      </div>
                      <div className='flex items-center space-x-2'>
                        <div className='w-4 h-4 bg-gray-300 rounded' />
                        <div className='h-3 bg-gray-200 rounded w-20' />
                      </div>
                    </div>

                    <div className='flex items-center justify-between'>
                      <div className='flex items-center space-x-2'>
                        <div className='h-3 bg-gray-200 rounded w-12' />
                        <div className='h-3 bg-gray-200 rounded w-16' />
                      </div>
                      <div className='flex items-center space-x-2'>
                        <div className='w-2 h-2 bg-gray-300 rounded-full' />
                        <div className='h-3 bg-gray-200 rounded w-14' />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : null}

        {/* Empty State */}
        {videos.length === 0 && !isLoading ? (
          <div className='text-center py-16'>
            <div className='max-w-sm mx-auto'>
              <div className='mb-6'>
                <div className='w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                  <Youtube className='w-8 h-8 text-orange-600' />
                </div>
                <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                  No videos yet
                </h3>
                <p className='text-gray-500 text-sm'>
                  Start by adding a YouTube video to create your first note!
                </p>
              </div>

              <div className='bg-white rounded-lg border border-gray-200 p-4 shadow-sm'>
                <div className='space-y-3'>
                  <Input
                    type='text'
                    placeholder='Paste YouTube URL here...'
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className='w-full'
                  />
                  <Button
                    onClick={handleVideoUrlSubmit}
                    disabled={!videoUrl.trim() || isAddingVideo}
                    className='w-full'
                  >
                    <Plus className='w-4 h-4 mr-2' />
                    {isAddingVideo
                      ? 'Loading...'
                      : 'Add Video & Start Taking Notes'}
                  </Button>
                </div>
                <p className='text-xs text-gray-400 mt-2 text-center'>
                  Supports YouTube.com and youtu.be links
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Videos Grid */}
        {!isLoading && filteredVideosForDisplay.length > 0 && (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
            {filteredVideosForDisplay.map((video) => (
              <VideoCard
                key={video.video_id}
                video={video}
                onDelete={handleSoftDeleteVideo}
                onRestore={handleRestoreVideo}
                onHardDelete={handleHardDeleteVideo}
                showDeleted={!!video.deleted_at}
              />
            ))}
          </div>
        )}

        {/* No Results State */}
        {!isLoading &&
          videos.length > 0 &&
          filteredVideosForDisplay.length === 0 && (
            <div className='text-center py-16'>
              <div className='max-w-sm mx-auto'>
                <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                  <Youtube className='w-8 h-8 text-gray-400' />
                </div>
                <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                  No videos match your filters
                </h3>
                <p className='text-gray-500 text-sm mb-4'>
                  Try adjusting your search criteria or clearing some filters.
                </p>
                <Button variant='outline' onClick={handleClearFilters}>
                  Clear All Filters
                </Button>
              </div>
            </div>
          )}
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {deleteType === 'soft' ? 'Move to Trash' : 'Permanently Delete'}
            </DialogTitle>
          </DialogHeader>
          <div className='my-4'>
            {deleteType === 'soft' ? (
              <>
                Are you sure you want to move this video to the trash? You can
                restore it later.
                <div className='mt-2 text-sm text-gray-600'>
                  The video and all its notes will be hidden but not permanently
                  deleted.
                </div>
              </>
            ) : (
              <>
                Are you sure you want to permanently delete this video and all
                its notes?
                <div className='mt-2 text-sm text-red-600 font-medium'>
                  This action cannot be undone and will permanently remove all
                  data.
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={deleteType === 'soft' ? 'outline' : 'destructive'}
              onClick={handleDeleteVideo}
            >
              {deleteType === 'soft' ? (
                <>
                  <Trash2 className='w-4 h-4 mr-2' />
                  Move to Trash
                </>
              ) : (
                <>
                  <HardDrive className='w-4 h-4 mr-2' />
                  Permanently Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
