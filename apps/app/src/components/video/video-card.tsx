import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@ytclipper/ui';
import {
  Calendar,
  Clock,
  HardDrive,
  Play,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';

import type { VideoSummary } from '@/services/videos';

interface VideoCardProps {
  video: VideoSummary;
  onDelete?: (videoId: string) => void;
  onRestore?: (videoId: string) => void;
  onHardDelete?: (videoId: string) => void;
  showDeleted?: boolean;
}

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

export const VideoCard = ({
  video,
  onDelete,
  onRestore,
  onHardDelete,
  showDeleted = false,
}: VideoCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const hasDuration = video.duration && video.duration > 0;
  const watchProgress =
    hasDuration && video.duration
      ? getWatchProgress(video.watched_duration || 0, video.duration)
      : 0;
  const progressColor = getProgressColor(watchProgress);

  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  return (
    <Link
      to={`/timestamps/${video.video_id}`}
      className='block group'
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card
        className={`overflow-hidden hover:shadow-lg transition-all duration-200 group-hover:scale-[1.02] ${showDeleted ? 'opacity-75 border-red-200' : ''}`}
      >
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

          {/* Action buttons overlay - only show on hover */}
          {isHovered ? (
            <div className='absolute top-2 left-2 flex gap-2 z-40'>
              {showDeleted ? (
                <>
                  {onRestore ? (
                    <Button
                      variant='outline'
                      size='sm'
                      className='bg-white/90 hover:bg-white text-green-600 border-green-200 hover:border-green-300'
                      onClick={(e) =>
                        handleActionClick(e, () => onRestore(video.video_id))
                      }
                    >
                      <RotateCcw className='w-3 h-3' />
                    </Button>
                  ) : null}
                  {onHardDelete ? (
                    <Button
                      variant='outline'
                      size='sm'
                      className='bg-white/90 hover:bg-white text-red-600 border-red-200 hover:border-red-300'
                      onClick={(e) =>
                        handleActionClick(e, () => onHardDelete(video.video_id))
                      }
                    >
                      <HardDrive className='w-3 h-3' />
                    </Button>
                  ) : null}
                </>
              ) : (
                onDelete && (
                  <Button
                    variant='outline'
                    size='sm'
                    className='bg-white/90 hover:bg-white text-red-600 border-red-200 hover:border-red-300'
                    onClick={(e) =>
                      handleActionClick(e, () => onDelete(video.video_id))
                    }
                  >
                    <Trash2 className='w-3 h-3' />
                  </Button>
                )
              )}
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
                    ? new Date(video.latest_timestamp).toLocaleDateString()
                    : 'No notes yet'}
                </span>
              </div>
            </div>

            {/* Duration and Watch Progress Info */}
            <div className='flex items-center justify-between text-xs min-h-[1rem]'>
              {hasDuration ? (
                <>
                  <div className='flex items-center space-x-2'>
                    <span className='text-gray-500'>
                      {video.duration ? formatDuration(video.duration) : ''}
                    </span>
                    {video.watched_duration && video.watched_duration > 0 ? (
                      <span className='text-gray-400'>
                        • {formatDuration(video.watched_duration)} watched
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
};
