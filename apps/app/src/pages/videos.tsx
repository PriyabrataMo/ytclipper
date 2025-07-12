import { useAuth0 } from '@auth0/auth0-react';
import { Button } from '@ytclipper/ui';
import { Plus, Video } from 'lucide-react';

import { Navigation, PageLayout } from '@/components/layout';
import LoginButton from '@/components/login-button';
import { VideoList } from '@/components/video';
import { useVideos } from '@/hooks/use-videos';

export const VideosPage = () => {
  const { isAuthenticated } = useAuth0();
  const { videos, loading, error } = useVideos();

  if (!isAuthenticated) {
    return (
      <>
        <Navigation />
        <PageLayout>
          <div className='text-center py-16'>
            <Video className='w-16 h-16 text-gray-400 mx-auto mb-4' />
            <h2 className='text-2xl font-bold text-gray-900 mb-2'>
              Welcome to YT Clipper
            </h2>
            <p className='text-gray-600 mb-8 max-w-md mx-auto'>
              Create and manage timestamped notes from your favorite YouTube
              videos. Sign in to access your video library.
            </p>
            <LoginButton />
          </div>
        </PageLayout>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Navigation />
        <PageLayout>
          <div className='text-center py-16'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4' />
            <p className='text-gray-600'>Loading your videos...</p>
          </div>
        </PageLayout>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navigation />
        <PageLayout>
          <div className='text-center py-16'>
            <p className='text-red-600 mb-4'>{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </PageLayout>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <PageLayout
        title='Your Video Library'
        description='Manage your clipped YouTube videos and timestamped notes all in one place.'
      >
        <div className='flex justify-between items-center mb-6'>
          <div className='flex items-center space-x-2 text-gray-600'>
            <Video className='w-5 h-5' />
            <span>{videos.length} videos</span>
          </div>
          <Button className='flex items-center space-x-2'>
            <Plus className='w-4 h-4' />
            <span>Add New Video</span>
          </Button>
        </div>
        <VideoList videos={videos} />
      </PageLayout>
    </>
  );
};
