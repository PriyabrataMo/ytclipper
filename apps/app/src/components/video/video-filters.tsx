import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ytclipper/ui';
import { ChevronDown, Filter, X } from 'lucide-react';
import { useState } from 'react';

export interface VideoFilters {
  search?: string;
  status?: 'all' | 'active' | 'deleted';
  sortBy?: 'created_at' | 'title' | 'duration' | 'count' | 'watched_duration';
  sortOrder?: 'asc' | 'desc';
  durationRange?: 'all' | 'short' | 'medium' | 'long';
  progressRange?: 'all' | 'not_started' | 'in_progress' | 'completed';
}

interface VideoFiltersProps {
  filters: VideoFilters;
  onFiltersChange: (filters: VideoFilters) => void;
  onClearFilters: () => void;
  totalVideos: number;
  activeVideos: number;
  deletedVideos: number;
}

export const VideoFiltersComponent = ({
  filters,
  onFiltersChange,
  onClearFilters,
  totalVideos,
  activeVideos,
  deletedVideos,
}: VideoFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: keyof VideoFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'search') {
      return value !== '';
    }
    if (key === 'sortBy') {
      return value !== 'created_at';
    }
    if (key === 'sortOrder') {
      return value !== 'desc';
    }
    return value !== 'all';
  });

  const clearAllFilters = () => {
    onClearFilters();
    setIsExpanded(false);
  };

  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== 'all' && v !== '' && v !== 'created_at' && v !== 'desc',
  ).length;

  return (
    <div className='relative'>
      {/* Compact Filter Button */}
      <div className='flex items-center gap-3'>
        <Button
          variant='outline'
          size='sm'
          onClick={() => setIsExpanded(!isExpanded)}
          className='flex items-center gap-2'
        >
          <Filter className='w-4 h-4' />
          Filters
          {activeFilterCount > 0 && (
            <span className='bg-orange-100 text-orange-800 text-xs font-medium px-2 py-0.5 rounded-full'>
              {activeFilterCount}
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </Button>

        {/* Quick Search */}
        <div className='flex-1 max-w-md'>
          <Input
            placeholder='Search videos...'
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className='w-full'
          />
        </div>

        {/* Quick Status Filter */}
        <Select
          value={filters.status || 'all'}
          onValueChange={(value) => handleFilterChange('status', value)}
        >
          <SelectTrigger className='w-32'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All ({totalVideos})</SelectItem>
            <SelectItem value='active'>Active ({activeVideos})</SelectItem>
            <SelectItem value='deleted'>Deleted ({deletedVideos})</SelectItem>
          </SelectContent>
        </Select>

        {/* Quick Sort */}
        <Select
          value={filters.sortBy || 'created_at'}
          onValueChange={(value) => handleFilterChange('sortBy', value)}
        >
          <SelectTrigger className='w-40'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='created_at'>Date Created</SelectItem>
            <SelectItem value='title'>Title</SelectItem>
            <SelectItem value='duration'>Duration</SelectItem>
            <SelectItem value='count'>Note Count</SelectItem>
            <SelectItem value='watched_duration'>Watch Progress</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters ? (
          <Button
            variant='ghost'
            size='sm'
            onClick={clearAllFilters}
            className='text-gray-600 hover:text-gray-800'
          >
            <X className='w-4 h-4 mr-1' />
            Clear
          </Button>
        ) : null}
      </div>

      {/* Expandable Filter Panel */}
      {isExpanded ? (
        <div className='absolute top-full left-0 right-0 mt-2 bg-white rounded-lg border border-gray-200 p-4 shadow-lg z-50'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <label
                htmlFor='sortOrder'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Sort Order
              </label>
              <Select
                value={filters.sortOrder || 'desc'}
                onValueChange={(value) =>
                  handleFilterChange('sortOrder', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='desc'>Descending</SelectItem>
                  <SelectItem value='asc'>Ascending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label
                htmlFor='durationRange'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Duration Range
              </label>
              <Select
                value={filters.durationRange || 'all'}
                onValueChange={(value) =>
                  handleFilterChange('durationRange', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Durations</SelectItem>
                  <SelectItem value='short'>Short (&lt; 5 min)</SelectItem>
                  <SelectItem value='medium'>Medium (5-20 min)</SelectItem>
                  <SelectItem value='long'>Long (&gt; 20 min)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label
                htmlFor='watchProgress'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Watch Progress
              </label>
              <Select
                value={filters.progressRange || 'all'}
                onValueChange={(value) =>
                  handleFilterChange('progressRange', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Progress</SelectItem>
                  <SelectItem value='not_started'>Not Started (0%)</SelectItem>
                  <SelectItem value='in_progress'>
                    In Progress (1-99%)
                  </SelectItem>
                  <SelectItem value='completed'>Completed (100%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters ? (
            <div className='border-t border-gray-200 pt-4 mt-4'>
              <div className='flex flex-wrap gap-2'>
                {filters.search ? (
                  <span className='bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1'>
                    Search: {filters.search}
                    <button
                      onClick={() => handleFilterChange('search', '')}
                      className='hover:bg-blue-200 rounded-full p-0.5'
                    >
                      <X className='w-3 h-3' />
                    </button>
                  </span>
                ) : null}
                {filters.status !== 'all' && (
                  <span className='bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1'>
                    Status: {filters.status}
                    <button
                      onClick={() => handleFilterChange('status', 'all')}
                      className='hover:bg-green-200 rounded-full p-0.5'
                    >
                      <X className='w-3 h-3' />
                    </button>
                  </span>
                )}
                {filters.sortBy !== 'created_at' && (
                  <span className='bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1'>
                    Sort: {filters.sortBy}
                    <button
                      onClick={() => handleFilterChange('sortBy', 'created_at')}
                      className='hover:bg-purple-200 rounded-full p-0.5'
                    >
                      <X className='w-3 h-3' />
                    </button>
                  </span>
                )}
                {filters.durationRange !== 'all' && (
                  <span className='bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1'>
                    Duration: {filters.durationRange}
                    <button
                      onClick={() => handleFilterChange('durationRange', 'all')}
                      className='hover:bg-yellow-200 rounded-full p-0.5'
                    >
                      <X className='w-3 h-3' />
                    </button>
                  </span>
                )}
                {filters.progressRange !== 'all' && (
                  <span className='bg-indigo-100 text-indigo-800 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1'>
                    Progress: {filters.progressRange}
                    <button
                      onClick={() => handleFilterChange('progressRange', 'all')}
                      className='hover:bg-indigo-200 rounded-full p-0.5'
                    >
                      <X className='w-3 h-3' />
                    </button>
                  </span>
                )}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
