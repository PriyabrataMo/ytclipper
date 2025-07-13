import { useParams } from 'react-router';

import { Navigation } from '../components/layout/navigation';
import { PageLayout } from '../components/layout/page-layout';
import { NotesList } from '../components/notes/notes-list';
import { YouTubePlayer } from '../components/video/youtube-player';
import { useVideo } from '../hooks/use-videos';
import { useAuth } from '../hooks/useAuth';

export const VideoDetailPage = () => {
  const { id } = useParams<{ id?: string }>();
  const { isAuthenticated } = useAuth();

  const { video, loading, error } = useVideo(id);

  if (!id) {
    return <div>Video id is missing</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <Navigation title='Video Details' showBackButton />
        <PageLayout
          title='Access Denied'
          description='Please log in to view video details.'
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
        <Navigation title='Loading...' showBackButton />
        <PageLayout
          title='Loading Video'
          description='Please wait while we load the video details.'
        >
          <div className='flex items-center justify-center py-12'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600' />
          </div>
        </PageLayout>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <Navigation title='Error' showBackButton />
        <PageLayout
          title='Video Not Found'
          description='The requested video could not be found.'
        >
          <div className='text-center'>
            <p className='text-gray-600'>
              Sorry, we couldn&apos;t find the video you&apos;re looking for.
            </p>
          </div>
        </PageLayout>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <Navigation title={video.title} showBackButton />
      <PageLayout title={video.title} description={`By ${video.channelName}`}>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          <div className='lg:col-span-2'>
            <YouTubePlayer videoId={video.youtubeId} title={video.title} />
            <div className='mt-6'>
              <h2 className='text-xl font-semibold text-gray-900 mb-2'>
                {video.title}
              </h2>
              <p className='text-gray-600 mb-4'>By {video.channelName}</p>
              {video.description ? (
                <p className='text-gray-700 leading-relaxed'>
                  {video.description}
                </p>
              ) : null}
            </div>
          </div>
          <div className='lg:col-span-1'>
            <NotesList notes={video.notes} />
          </div>
        </div>
      </PageLayout>
    </div>
  );
};
