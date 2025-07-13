import { Navigation } from '../components/layout/navigation';
import { PageLayout } from '../components/layout/page-layout';
import { VideoList } from '../components/video/video-list';
import { useVideos } from '../hooks/use-videos';
import { useAuth } from '../hooks/useAuth';

export const VideosPage = () => {
  const { isAuthenticated } = useAuth();
  const { videos, loading } = useVideos();

  if (!isAuthenticated) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <Navigation title='Videos' showBackButton />
        <PageLayout
          title='Access Denied'
          description='Please log in to view your videos.'
        >
          <div className='text-center'>
            <p className='text-gray-600'>
              You need to be logged in to access this page.
            </p>
          </div>
        </PageLayout>
      </div>
    );
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <Navigation title='Videos' showBackButton />
        <PageLayout
          title='Your Videos'
          description='Manage and view your saved videos'
        >
          <div className='flex items-center justify-center py-12'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600' />
          </div>
        </PageLayout>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <Navigation title='Videos' showBackButton />
      <PageLayout
        title='Your Videos'
        description='Manage and view your saved videos'
      >
        <VideoList videos={videos} />
      </PageLayout>
    </div>
  );
};
