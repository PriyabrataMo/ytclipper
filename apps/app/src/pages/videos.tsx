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
import { useNavigate } from 'react-router';

import { VideoCard } from '@/components/video/video-card';
import { VideoFiltersComponent } from '@/components/video/video-filters';
import { v4 as uuidv4 } from 'uuid';

const defaultFilters: VideoFilters = {
  search: '',
  status: 'all',
  sortBy: 'created_at',
  sortOrder: 'desc',
  durationRange: 'all',
  progressRange: 'all',
};

export const VideosPage = () => {
  const navigate = useNavigate();
  const [videoUrl, setVideoUrl] = useState('');
  const [isAddingVideo, setIsAddingVideo] = useState(false);
  const [filters, setFilters] = useState<VideoFilters>(defaultFilters);
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
  };

  const handleClearFilters = () => {
    setFilters(defaultFilters);
  };

  const refetchData = () => {
    if (useFilteredQuery) {
      refetchFiltered();
    } else {
      refetchAll();
    }
  };

  const filteredVideosForDisplay = (filters.search || '').trim()
    ? videos.filter((video) =>
        video.title
          ?.toLowerCase()
          .includes((filters.search || '').toLowerCase()),
      )
    : videos;

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
            totalVideos={totalVideos}
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
        {isLoading && !filteredVideosForDisplay.length ? (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
            {Array.from({ length: videos.length ? videos.length + 1 : 5 }, () =>
              uuidv4(),
            ).map((id) => (
              <Card key={id} className='overflow-hidden'>
                {/* Thumbnail skeleton */}
                <div className='relative w-full h-40 bg-orange-50 animate-pulse'>
                  <div className='absolute inset-0 flex items-center justify-center'>
                    <div className='w-12 h-12 bg-orange-200 rounded-full animate-pulse' />
                  </div>
                  {/* Progress bar skeleton */}
                  <div className='absolute bottom-0 left-0 right-0 h-1 bg-orange-100'>
                    <div className='h-full bg-orange-300 w-1/3 animate-pulse' />
                  </div>
                </div>

                {/* Title skeleton */}
                <div className='p-4 space-y-2'>
                  <div className='h-4 bg-orange-100 rounded animate-pulse w-3/4' />
                  <div className='h-4 bg-orange-100 rounded animate-pulse w-1/2' />
                </div>

                {/* Metadata skeleton */}
                <div className='px-4 pb-4 space-y-3'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-2'>
                      <div className='w-4 h-4 bg-orange-200 rounded animate-pulse' />
                      <div className='h-3 bg-orange-100 rounded animate-pulse w-16' />
                    </div>
                    <div className='flex items-center space-x-2'>
                      <div className='w-4 h-4 bg-orange-200 rounded animate-pulse' />
                      <div className='h-3 bg-orange-100 rounded animate-pulse w-20' />
                    </div>
                  </div>

                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-2'>
                      <div className='h-3 bg-orange-100 rounded animate-pulse w-12' />
                      <div className='h-3 bg-orange-100 rounded animate-pulse w-16' />
                    </div>
                    <div className='flex items-center space-x-2'>
                      <div className='w-2 h-2 bg-orange-300 rounded-full animate-pulse' />
                      <div className='h-3 bg-orange-100 rounded animate-pulse w-14' />
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
