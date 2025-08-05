import type { RecentNote } from '@/services/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@ytclipper/ui';
import { Search, StickyNote } from 'lucide-react';
import { useState } from 'react';

interface RecentNotesProps {
  notes: RecentNote[];
}

export const RecentNotes = ({ notes }: RecentNotesProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.video_title.toLowerCase().includes(searchQuery.toLowerCase());
    const noteTags = note.tags || [];
    const matchesTag = selectedTag === 'All' || noteTags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  return (
    <Card className='shadow-sm border-0 bg-white'>
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center gap-2 text-lg font-semibold text-gray-900'>
          <StickyNote className='w-5 h-5 text-orange-600' />
          Recent Notes
        </CardTitle>
      </CardHeader>
      <CardContent className='pt-0'>
        <div className='space-y-4'>
          {/* Search Bar */}
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
            <input
              type='text'
              placeholder='Search notes...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm'
            />
          </div>

          {/* Tag Filters */}
          <div className='flex flex-wrap gap-2'>
            <button
              onClick={() => setSelectedTag('All')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedTag === 'All'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              All
            </button>
          </div>

          {/* Notes List */}
          <div className='space-y-3'>
            {filteredNotes.map((note) => (
              <div key={note.id} className='p-3 bg-gray-50 rounded-lg'>
                <h3 className='text-sm font-medium text-gray-900 mb-1'>
                  {note.title}
                </h3>
                <p className='text-xs text-gray-500 mb-2'>
                  From: {note.video_title}
                </p>
                <div className='flex items-center justify-between'>
                  <div className='flex flex-wrap gap-1'>
                    {(note.tags || []).slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className='px-2 py-1 bg-white text-xs text-gray-600 rounded border'
                      >
                        {tag}
                      </span>
                    ))}
                    {(note.tags || []).length > 3 && (
                      <span className='px-2 py-1 bg-white text-xs text-gray-400 rounded border'>
                        +{(note.tags || []).length - 3}
                      </span>
                    )}
                  </div>
                  <span className='text-xs text-gray-400'>
                    {new Date(note.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
            {filteredNotes.length === 0 && (
              <p className='text-gray-500 text-sm text-center py-4'>
                {searchQuery || selectedTag !== 'All'
                  ? 'No notes match your search criteria'
                  : 'No notes created yet'}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
