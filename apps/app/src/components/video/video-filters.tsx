import { useDebounce } from '@/hooks/use-debounce';
import {
  Badge,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ytclipper/ui';
import { ChevronDown, Filter, Search, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

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
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const debouncedSearch = useDebounce(searchInput, 500);

  const handleFilterChange = useCallback(
    (key: keyof VideoFilters, value: string) => {
      onFiltersChange({
        ...filters,
        [key]: value,
      });
    },
    [filters, onFiltersChange],
  );

  // Update search filter when debounced value changes
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      handleFilterChange('search', debouncedSearch);
    }
  }, [debouncedSearch, filters.search, handleFilterChange]);

  // Update local search input when filters change externally
  useEffect(() => {
    setSearchInput(filters.search || '');
  }, [filters.search]);

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
      <div className='bg-white rounded-lg border border-gray-200 p-4 space-y-4'>
        <div className='flex items-center gap-3 flex-wrap'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setIsExpanded(!isExpanded)}
            className='flex items-center gap-2 hover:bg-gray-50'
          >
            <Filter className='w-4 h-4' />
            {isExpanded ? 'Hide Filters' : 'More Filters'}
            {activeFilterCount > 0 && (
              <Badge
                variant='secondary'
                className='ml-1 bg-orange-100 text-orange-800 border-orange-200'
              >
                {activeFilterCount}
              </Badge>
            )}
            <ChevronDown
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
          </Button>

          <div className='flex-1 max-w-md relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
            <Input
              placeholder='Search videos by title or channel...'
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className='w-full pl-10'
            />
          </div>

          <Select
            value={filters.status || 'all'}
            onValueChange={(value) => handleFilterChange('status', value)}
          >
            <SelectTrigger className='w-40 bg-white'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All ({totalVideos})</SelectItem>
              <SelectItem value='active'>Active ({activeVideos})</SelectItem>
              <SelectItem value='deleted'>Deleted ({deletedVideos})</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.sortBy || 'created_at'}
            onValueChange={(value) => handleFilterChange('sortBy', value)}
          >
            <SelectTrigger className='w-44 bg-white'>
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

          <Button
            variant='outline'
            size='sm'
            onClick={() =>
              handleFilterChange(
                'sortOrder',
                filters.sortOrder === 'asc' ? 'desc' : 'asc',
              )
            }
            className='flex items-center gap-2'
          >
            {filters.sortOrder === 'asc' ? '↑' : '↓'}
            {filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          </Button>

          {hasActiveFilters ? (
            <Button
              variant='ghost'
              size='sm'
              onClick={clearAllFilters}
              className='text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            >
              <X className='w-4 h-4 mr-1' />
              Clear All
            </Button>
          ) : null}
        </div>

        {hasActiveFilters ? (
          <div className='flex flex-wrap gap-2 pt-2 border-t border-gray-100'>
            {filters.search ? (
              <Badge
                variant='secondary'
                className='bg-blue-50 text-blue-700 border-blue-200'
              >
                Search: &ldquo;{filters.search}&rdquo;
                <button
                  onClick={() => handleFilterChange('search', '')}
                  className='ml-1 hover:bg-blue-100 rounded-full p-0.5'
                >
                  <X className='w-3 h-3' />
                </button>
              </Badge>
            ) : null}
            {filters.status !== 'all' ? (
              <Badge
                variant='secondary'
                className='bg-green-50 text-green-700 border-green-200'
              >
                Status: {filters.status}
                <button
                  onClick={() => handleFilterChange('status', 'all')}
                  className='ml-1 hover:bg-green-100 rounded-full p-0.5'
                >
                  <X className='w-3 h-3' />
                </button>
              </Badge>
            ) : null}
            {filters.sortBy !== 'created_at' || filters.sortOrder !== 'desc' ? (
              <Badge
                variant='secondary'
                className='bg-purple-50 text-purple-700 border-purple-200'
              >
                Sort: {filters.sortBy} ({filters.sortOrder})
                <button
                  onClick={() => {
                    handleFilterChange('sortBy', 'created_at');
                    handleFilterChange('sortOrder', 'desc');
                  }}
                  className='ml-1 hover:bg-purple-100 rounded-full p-0.5'
                >
                  <X className='w-3 h-3' />
                </button>
              </Badge>
            ) : null}
            {filters.durationRange !== 'all' ? (
              <Badge
                variant='secondary'
                className='bg-yellow-50 text-yellow-700 border-yellow-200'
              >
                Duration: {filters.durationRange}
                <button
                  onClick={() => handleFilterChange('durationRange', 'all')}
                  className='ml-1 hover:bg-yellow-100 rounded-full p-0.5'
                >
                  <X className='w-3 h-3' />
                </button>
              </Badge>
            ) : null}
            {filters.progressRange !== 'all' ? (
              <Badge
                variant='secondary'
                className='bg-indigo-50 text-indigo-700 border-indigo-200'
              >
                Progress: {filters.progressRange}
                <button
                  onClick={() => handleFilterChange('progressRange', 'all')}
                  className='ml-1 hover:bg-indigo-100 rounded-full p-0.5'
                >
                  <X className='w-3 h-3' />
                </button>
              </Badge>
            ) : null}
          </div>
        ) : null}
      </div>

      {isExpanded ? (
        <div className='mt-4 bg-gray-50 rounded-lg border border-gray-200 p-4'>
          <div className='mb-3'>
            <h3 className='text-sm font-medium text-gray-900 mb-2'>
              Advanced Filters
            </h3>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            <div>
              <label
                htmlFor='duration-range'
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
                <SelectTrigger id='duration-range' className='bg-white'>
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
                htmlFor='progress-range'
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
                <SelectTrigger id='progress-range' className='bg-white'>
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

            <div>
              <label
                htmlFor='date-range'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Date Range
              </label>
              <Select disabled value='all'>
                <SelectTrigger id='date-range' className='bg-gray-100'>
                  <SelectValue placeholder='Coming soon...' />
                </SelectTrigger>
              </Select>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
