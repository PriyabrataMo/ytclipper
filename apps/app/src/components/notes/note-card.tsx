import { Card, CardContent } from '@ytclipper/ui';
import { Clock, MessageSquare } from 'lucide-react';

import { type Note } from '@/types';

interface NoteCardProps {
  note: Note;
  onTimestampClick?: (timestampSeconds: number) => void;
}

export const NoteCard = ({ note, onTimestampClick }: NoteCardProps) => {
  const handleTimestampClick = () => {
    if (onTimestampClick) {
      onTimestampClick(note.timestampSeconds);
    }
  };

  return (
    <Card className='hover:shadow-md transition-shadow duration-200'>
      <CardContent className='p-4'>
        <div className='flex items-start space-x-3'>
          <div className='flex-shrink-0'>
            <button
              onClick={handleTimestampClick}
              className='flex items-center space-x-1 bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded-full text-sm font-medium transition-colors'
            >
              <Clock className='w-3 h-3' />
              <span>{note.timestamp}</span>
            </button>
          </div>
          <div className='flex-1 min-w-0'>
            <div className='flex items-start space-x-2'>
              <MessageSquare className='w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0' />
              <p className='text-gray-700 text-sm leading-relaxed'>
                {note.content}
              </p>
            </div>
            <div className='mt-2 text-xs text-gray-400'>
              {new Date(note.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
