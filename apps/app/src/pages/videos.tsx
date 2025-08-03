import { extractVideoId } from '@/lib/utils';
import { useGetUserVideosQuery } from '@/services/videos';
import { useAppSelector } from '@/store/hooks';
import { selectVideos } from '@/store/slices/videoSlice';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  toast,
} from '@ytclipper/ui';
import { Calendar, Clock, Play, Plus, Search, Youtube } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';

import { v4 as uuidv4 } from 'uuid';

// Helper function to format duration
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

// Helper function to calculate watch progress percentage
const getWatchProgress = (
  watchedDuration: number,
  totalDuration: number,
): number => {
  if (totalDuration <= 0) {
    return 0;
  }

  // Consider it fully watched if difference is less than 30 seconds
  const difference = totalDuration - watchedDuration;
  if (difference <= 30) {
    return 100;
  }

  return Math.min((watchedDuration / totalDuration) * 100, 100);
};

// Helper function to get progress color based on percentage
const getProgressColor = (percentage: number): string => {
  if (percentage >= 100) {
    return 'bg-green-500';
  } // Completed
  if (percentage >= 90) {
    return 'bg-green-500';
  } // Almost completed
  if (percentage >= 50) {
    return 'bg-orange-500';
  } // Halfway
  return 'bg-blue-500'; // Started
};

export const VideosPage = () => {
  const { data, isLoading } = useGetUserVideosQuery();
  const navigate = useNavigate();
  const [videoUrl, setVideoUrl] = useState('');
  const [isAddingVideo, setIsAddingVideo] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const reduxVideos = useAppSelector(selectVideos);
  const videos = reduxVideos.length > 0 ? reduxVideos : data?.data.videos || [];

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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVideoUrlSubmit();
    }
  };

  const filteredVideos = searchTerm.trim()
    ? videos.filter((video) =>
        video.title?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : videos;

  return (
    <div className='p-6 max-w-7xl mx-auto bg-background'>
      <div className='mb-6'>
        <div className='flex items-center justify-between mb-4'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>Your Videos</h1>
            <p className='text-gray-600 text-sm mt-1'>
              {videos.length} video{videos.length !== 1 ? 's' : ''} •{' '}
              {videos.reduce((sum, v) => sum + v.count, 0)} total notes
            </p>
          </div>

          <div className='flex items-center gap-3'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
              <Input
                placeholder='Search videos...'
                className='pl-10 w-64'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant='outline' size='sm'>
              <Plus className='w-4 h-4 mr-2' />
              Add Video
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
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
              <CardHeader className='pb-2'>
                <div className='space-y-2'>
                  <div className='h-4 bg-orange-100 rounded animate-pulse w-3/4' />
                  <div className='h-4 bg-orange-100 rounded animate-pulse w-1/2' />
                </div>
              </CardHeader>

              {/* Metadata skeleton */}
              <CardContent className='pt-0'>
                <div className='space-y-3'>
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
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

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

      {!isLoading && (
        <div className='mb-6'>
          <Card className='border-dashed border-2 border-gray-300 hover:border-orange-400 transition-colors bg-gray-50/50'>
            <CardContent className='p-4'>
              <div className='flex items-center gap-3'>
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
                  variant='outline'
                >
                  <Plus className='w-4 h-4 mr-2' />
                  {isAddingVideo ? 'Loading...' : 'Add Video'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
        {filteredVideos.map((video) => {
          const hasDuration = video.duration && video.duration > 0;
          const watchProgress =
            hasDuration && video.duration
              ? getWatchProgress(video.watched_duration || 0, video.duration)
              : 0;
          const progressColor = getProgressColor(watchProgress);

          return (
            <Link
              key={video.video_id}
              to={`/timestamps/${video.video_id}`}
              className='block group'
            >
              <Card className='overflow-hidden hover:shadow-lg transition-all duration-200 group-hover:scale-[1.02]'>
                <div className='relative w-full h-40 bg-gray-300 flex items-center justify-center'>
                  <div className='text-gray-500 text-center absolute inset-0 flex flex-col items-center justify-center'>
                    <Play className='w-12 h-12 mx-auto mb-2 opacity-50' />
                    <p className='text-sm'>Video Thumbnail</p>
                  </div>

                  <img
                    src={`https://img.youtube.com/vi/${video.video_id}/hqdefault.jpg`}
                    alt={`Video ${video.video_id}`}
                    className='w-full h-full object-cover relative z-20'
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src.includes('hqdefault')) {
                        target.src = `https://img.youtube.com/vi/${video.video_id}/mqdefault.jpg`;
                      } else if (target.src.includes('mqdefault')) {
                        target.src = `https://img.youtube.com/vi/${video.video_id}/default.jpg`;
                      } else {
                        target.style.display = 'none';
                      }
                    }}
                    onLoad={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'block';
                    }}
                    loading='lazy'
                  />

                  <div className='absolute inset-0 bg-black/0 bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center z-30'>
                    <Play className='w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity' />
                  </div>

                  <div className='absolute top-2 right-2 bg-black bg-opacity-80 text-white px-2 py-1 rounded text-sm z-30'>
                    {video.count > 1 ? `${video.count} Notes` : '1 Note'}
                  </div>

                  {/* Watch Progress Bar */}
                  {hasDuration ? (
                    <div className='absolute bottom-0 left-0 right-0 h-1 bg-gray-800 bg-opacity-50 z-30'>
                      <div
                        className={`h-full ${progressColor} transition-all duration-300 ease-out`}
                        style={{ width: `${watchProgress}%` }}
                      />
                    </div>
                  ) : null}
                </div>

                <CardHeader className='pb-2'>
                  <CardTitle className='text-base line-clamp-2 group-hover:text-orange-600 transition-colors'>
                    {video.title ? video.title : `Video: ${video.video_id}`}
                  </CardTitle>
                </CardHeader>

                <CardContent className='pt-0'>
                  <div className='space-y-2 text-sm text-gray-600'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center space-x-1'>
                        <Clock className='w-4 h-4' />
                        <span>{video.count} timestamps</span>
                      </div>
                      <div className='flex items-center space-x-1'>
                        <Calendar className='w-4 h-4' />
                        <span>
                          {video.latest_timestamp
                            ? new Date(
                                video.latest_timestamp,
                              ).toLocaleDateString()
                            : 'No notes yet'}
                        </span>
                      </div>
                    </div>

                    {/* Duration and Watch Progress Info - Always show this section for consistent height */}
                    <div className='flex items-center justify-between text-xs min-h-[1rem]'>
                      {hasDuration ? (
                        <>
                          <div className='flex items-center space-x-2'>
                            <span className='text-gray-500'>
                              {video.duration
                                ? formatDuration(video.duration)
                                : ''}
                            </span>
                            {video.watched_duration &&
                            video.watched_duration > 0 ? (
                              <span className='text-gray-400'>
                                • {formatDuration(video.watched_duration)}{' '}
                                watched
                              </span>
                            ) : null}
                          </div>
                          {watchProgress > 0 && (
                            <div className='flex items-center space-x-1'>
                              <div
                                className={`w-2 h-2 rounded-full ${progressColor}`}
                              />
                              <span className='text-gray-500'>
                                {Math.round(watchProgress)}% complete
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className='text-gray-400'>No duration info</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
