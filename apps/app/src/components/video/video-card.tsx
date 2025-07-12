import { Card, CardContent, CardHeader, CardTitle } from '@ytclipper/ui';
import { Clock, Play, User } from 'lucide-react';
import { Link } from 'react-router';

import { type Video } from '@/types';

interface VideoCardProps {
  video: Video;
}

export const VideoCard = ({ video }: VideoCardProps) => {
  return (
    <Link to={`/video/${video.id}`} className='block group'>
      <Card className='overflow-hidden hover:shadow-lg transition-shadow duration-200 group-hover:scale-[1.02] transition-transform'>
        <div className='relative'>
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className='w-full h-48 object-cover'
          />
          <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center'>
            <Play className='w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity' />
          </div>
          <div className='absolute bottom-2 right-2 bg-black bg-opacity-80 text-white px-2 py-1 rounded text-sm'>
            {video.duration}
          </div>
        </div>
        <CardHeader className='pb-2'>
          <CardTitle className='text-lg line-clamp-2 group-hover:text-blue-600 transition-colors'>
            {video.title}
          </CardTitle>
        </CardHeader>
        <CardContent className='pt-0'>
          <p className='text-gray-600 text-sm mb-3 line-clamp-2'>
            {video.description}
          </p>
          <div className='flex items-center justify-between text-sm text-gray-500'>
            <div className='flex items-center space-x-1'>
              <User className='w-4 h-4' />
              <span>{video.channelName}</span>
            </div>
            <div className='flex items-center space-x-1'>
              <Clock className='w-4 h-4' />
              <span>{video.notes.length} notes</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
