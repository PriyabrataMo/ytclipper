import { type Video } from '@/types';

import { VideoCard } from './video-card';

interface VideoListProps {
  videos: Video[];
}

export const VideoList = ({ videos }: VideoListProps) => {
  if (videos.length === 0) {
    return (
      <div className='text-center py-12'>
        <p className='text-gray-500 text-lg'>No videos found.</p>
        <p className='text-gray-400 text-sm mt-2'>
          Start clipping your first YouTube video to see it here!
        </p>
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
};
