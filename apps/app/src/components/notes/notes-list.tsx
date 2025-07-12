import { type Note } from '@/types';

import { NoteCard } from './note-card';

interface NotesListProps {
  notes: Note[];
  onTimestampClick?: (timestampSeconds: number) => void;
}

export const NotesList = ({ notes, onTimestampClick }: NotesListProps) => {
  // Sort notes by timestamp
  const sortedNotes = [...notes].sort(
    (a, b) => a.timestampSeconds - b.timestampSeconds,
  );

  if (sortedNotes.length === 0) {
    return (
      <div className='text-center py-8'>
        <p className='text-gray-500'>No notes yet.</p>
        <p className='text-gray-400 text-sm mt-1'>
          Start adding timestamped notes to remember important moments!
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {sortedNotes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          onTimestampClick={onTimestampClick}
        />
      ))}
    </div>
  );
};
