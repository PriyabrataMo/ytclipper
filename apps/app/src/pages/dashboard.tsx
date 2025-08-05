import {
  MostUsedTags,
  RecentNotes,
  RecentVideos,
  StatsCards,
} from '@/components/dashboard';
import {
  MostUsedTagsLoader,
  RecentNotesLoader,
  RecentVideosLoader,
} from '@/components/dashboard/loaders';
import {
  useGetMostUsedTagsQuery,
  useGetRecentNotesQuery,
  useGetRecentVideosQuery,
} from '@/services/dashboard';
import LogoutButton from '../components/logout-button';

export function DashboardPage() {
  const { data: tagsData, isLoading: tagsLoading } = useGetMostUsedTagsQuery();
  const { data: videosData, isLoading: videosLoading } =
    useGetRecentVideosQuery();
  const { data: notesData, isLoading: notesLoading } = useGetRecentNotesQuery();

  // Extract available tags from notes for the RecentNotes component

  return (
    <div className='min-h-screen bg-orange-50 p-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='flex items-center justify-between mb-8'>
          <div>
            <div className='flex items-center gap-3 mb-2'>
              <div className='w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center'>
                <div className='w-3 h-3 bg-white rounded-sm' />
              </div>
              <h1 className='text-2xl font-bold text-gray-900'>Dashboard</h1>
            </div>
            <p className='text-gray-600'>
              Welcome back! Here&apos;s your learning progress.
            </p>
          </div>
          <div className='flex items-center gap-4'>
            <LogoutButton />
          </div>
        </div>

        {/* Stats Cards */}
        <StatsCards />

        {/* Content Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          {/* Left Column */}
          <div className='space-y-8'>
            {tagsLoading ? (
              <MostUsedTagsLoader />
            ) : (
              <MostUsedTags tags={tagsData?.data?.tags || []} />
            )}
            {videosLoading ? (
              <RecentVideosLoader />
            ) : (
              <RecentVideos videos={videosData?.data?.videos || []} />
            )}
          </div>

          <div className='space-y-8'>
            {notesLoading ? (
              <RecentNotesLoader />
            ) : (
              <RecentNotes notes={notesData?.data?.notes || []} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
