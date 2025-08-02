import { useGetDashboardStatsQuery } from '@/services/dashboard';
import { Card, CardContent } from '@ytclipper/ui';
import { Clock, FileText, Play, TrendingUp } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  valueColor?: string;
}

const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  valueColor = 'text-gray-900',
}: StatCardProps) => (
  <Card className='bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200'>
    <CardContent className='p-4'>
      <div className='flex items-center justify-between'>
        <div className='flex-1'>
          <p className='text-xs font-medium text-gray-500 uppercase tracking-wide mb-1'>
            {title}
          </p>
          <p className={`text-2xl font-bold ${valueColor} mb-1`}>{value}</p>
          <p className='text-xs text-gray-400'>{subtitle}</p>
        </div>
        <div className='text-orange-500 opacity-80'>{icon}</div>
      </div>
    </CardContent>
  </Card>
);

const formatWatchTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

export const StatsCards = () => {
  const { data: statsData, isLoading, error } = useGetDashboardStatsQuery();

  if (isLoading) {
    return (
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
        {[
          'total-notes',
          'videos-watched',
          'total-watch-time',
          'weekly-activity',
        ].map((key) => (
          <Card
            key={`loading-${key}`}
            className='bg-white border border-gray-200 shadow-sm'
          >
            <CardContent className='p-4'>
              <div className='animate-pulse'>
                <div className='h-3 bg-gray-200 rounded w-16 mb-2' />
                <div className='h-6 bg-gray-200 rounded w-12 mb-2' />
                <div className='h-2 bg-gray-200 rounded w-20' />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !statsData) {
    return (
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
        {[
          'total-notes',
          'videos-watched',
          'total-watch-time',
          'weekly-activity',
        ].map((key) => (
          <Card
            key={`error-${key}`}
            className='bg-white border border-gray-200 shadow-sm'
          >
            <CardContent className='p-4'>
              <div className='text-center text-gray-400'>
                <p className='text-xs'>Failed to load</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = statsData.data.stats;

  return (
    <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
      <StatCard
        title='Total Notes'
        value={stats.total_notes}
        subtitle={`+${stats.weekly_activity} this week`}
        icon={<FileText size={20} />}
      />
      <StatCard
        title='Videos Watched'
        value={stats.videos_watched}
        subtitle='Across all sessions'
        icon={<Play size={20} />}
      />
      <StatCard
        title='Total Watch Time'
        value={formatWatchTime(stats.total_watch_time)}
        subtitle='Time spent learning'
        icon={<Clock size={20} />}
        valueColor='text-orange-600'
      />
      <StatCard
        title='Weekly Activity'
        value={stats.weekly_activity}
        subtitle='Notes this week'
        icon={<TrendingUp size={20} />}
      />
    </div>
  );
};
