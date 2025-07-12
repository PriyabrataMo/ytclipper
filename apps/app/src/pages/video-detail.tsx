import { useAuth0 } from '@auth0/auth0-react';
import { Button } from '@ytclipper/ui';
import { Calendar, Clock, Share2, User } from 'lucide-react';
import { Navigate, useParams } from 'react-router';

import { Navigation, PageLayout } from '@/components/layout';
import { NotesList } from '@/components/notes';
import { YouTubePlayer } from '@/components/video';
import { useVideo } from '@/hooks/use-videos';

export const VideoDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth0();
  const { video, loading, error } = useVideo(id || '');

  if (!isAuthenticated) {
    return <Navigate to='/' replace />;
  }

  if (loading) {
    return (
      <>
        <Navigation showBackButton />
        <PageLayout>
          <div className='text-center py-16'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4' />
            <p className='text-gray-600'>Loading video...</p>
          </div>
        </PageLayout>
      </>
    );
  }

  if (error || !video) {
    return (
      <>
        <Navigation showBackButton />
        <PageLayout>
          <div className='text-center py-16'>
            <h2 className='text-2xl font-bold text-gray-900 mb-2'>
              {error || 'Video not found'}
            </h2>
            <p className='text-gray-600 mb-8'>
              {error ||
                "The video you're looking for doesn't exist or may have been removed."}
            </p>
            <Button asChild>
              <a href='/videos'>Back to Videos</a>
            </Button>
          </div>
        </PageLayout>
      </>
    );
  }

  const handleTimestampClick = (timestampSeconds: number) => {
    // In a real implementation, this would control the YouTube player
    console.log(`Jumping to timestamp: ${timestampSeconds} seconds`);
    // You could implement YouTube IFrame API here to control playback
  };

  return (
    <>
      <Navigation showBackButton backTo='/videos' title={video.title} />
      <PageLayout>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Video Player Section */}
          <div className='lg:col-span-2 space-y-6'>
            <YouTubePlayer videoId={video.youtubeId} title={video.title} />

            {/* Video Info */}
            <div className='space-y-4'>
              <div>
                <h1 className='text-2xl font-bold text-gray-900 mb-2'>
                  {video.title}
                </h1>
                <p className='text-gray-600 leading-relaxed'>
                  {video.description}
                </p>
              </div>

              <div className='flex items-center justify-between border-t pt-4'>
                <div className='flex items-center space-x-6 text-sm text-gray-500'>
                  <div className='flex items-center space-x-1'>
                    <User className='w-4 h-4' />
                    <span>{video.channelName}</span>
                  </div>
                  <div className='flex items-center space-x-1'>
                    <Clock className='w-4 h-4' />
                    <span>{video.duration}</span>
                  </div>
                  <div className='flex items-center space-x-1'>
                    <Calendar className='w-4 h-4' />
                    <span>
                      {new Date(video.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  className='flex items-center space-x-2'
                >
                  <Share2 className='w-4 h-4' />
                  <span>Share</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className='lg:col-span-1'>
            <div className='bg-white rounded-lg border border-gray-200 p-6 sticky top-6'>
              <div className='flex items-center justify-between mb-6'>
                <h2 className='text-lg font-semibold text-gray-900'>
                  Notes ({video.notes.length})
                </h2>
                <Button size='sm' className='text-sm'>
                  Add Note
                </Button>
              </div>
              <div className='max-h-[600px] overflow-y-auto pr-2 custom-scrollbar'>
                <NotesList
                  notes={video.notes}
                  onTimestampClick={handleTimestampClick}
                />
              </div>
            </div>
          </div>
        </div>
      </PageLayout>
    </>
  );
};
