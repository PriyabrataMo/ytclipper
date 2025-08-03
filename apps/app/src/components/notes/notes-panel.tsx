import {
  useCreateTimestampMutation,
  useDeleteTimestampMutation,
  useGetTimestampsQuery,
  useSearchTagsMutation,
  useUpdateTimestampMutation,
} from '@/services/timestamps';
import { useAppSelector } from '@/store/hooks';
import MarkdownPreview from '@uiw/react-markdown-preview';
import MDEditor from '@uiw/react-md-editor';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  cn,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  ScrollArea,
} from '@ytclipper/ui';
import {
  Clock,
  Download,
  Edit,
  Eye,
  EyeOff,
  FileText,
  Hash,
  Loader2,
  Plus,
  Save,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useDebounce } from '../../hooks/use-debounce';

interface Timestamp {
  id: string;
  timestamp: number;
  title: string;
  note: string;
  tags: string[];
  created_at: string;
}

interface NotesPanelProps {
  videoId: string;
  onPauseVideo?: () => void;
  onResumeVideo?: () => void;
}

export const NotesPanel = ({
  videoId,
  onPauseVideo,
  onResumeVideo,
}: NotesPanelProps) => {
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState<string | null>(null);
  const [expandedNoteIds, setExpandedNoteIds] = useState<string[]>([]);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [newNote, setNewNote] = useState({
    timestamp: 0,
    title: '',
    note: '',
    tags: [] as string[],
  });
  const [editingNote, setEditingNote] = useState({
    title: '',
    note: '',
    tags: [] as string[],
  });
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const timeStampsSliceData = useAppSelector((state) => state.timestamps);
  const currentTime = timeStampsSliceData.currentTimestamp;
  const videoTitle = timeStampsSliceData.videoTitle;
  const [tagInput, setTagInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  const {
    data: timestampsData,
    isLoading: timestampsLoading,
    refetch,
  } = useGetTimestampsQuery(videoId || '');

  const [createTimestamp, { isLoading: isCreating }] =
    useCreateTimestampMutation();
  const [updateTimestamp, { isLoading: isUpdating }] =
    useUpdateTimestampMutation();
  const [deleteTimestamp, { isLoading: isDeleting }] =
    useDeleteTimestampMutation();

  const [searchTags, { data: searchedTags }] = useSearchTagsMutation();
  const debouncedTagInput = useDebounce(tagInput, 300);

  useEffect(() => {
    if (debouncedTagInput.trim().length > 0) {
      searchTags({ query: debouncedTagInput });
    }
  }, [debouncedTagInput, searchTags]);

  const notes = useMemo(
    () => timestampsData?.data.timestamps || [],
    [timestampsData?.data.timestamps],
  );

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAddNote = async () => {
    if (newNote.title.trim()) {
      try {
        await createTimestamp({
          video_id: videoId,
          timestamp: currentTime,
          title: newNote.title,
          note: newNote.note,
          tags: newNote.tags,
        }).unwrap();

        setNewNote({ timestamp: 0, title: '', note: '', tags: [] });
        setIsAddingNote(false);
        onResumeVideo?.();
        refetch();
      } catch (error) {
        console.error('Failed to create note:', error);
      }
    }
  };

  const handleUpdateNote = async (id: string) => {
    try {
      console.log('Updating note:', id, editingNote);
      const result = await updateTimestamp({
        id,
        data: {
          title: editingNote.title,
          note: editingNote.note,
          tags: editingNote.tags,
        },
      }).unwrap();
      console.log('Update successful:', result);
      setIsEditingNote(null);
      setEditingNote({ title: '', note: '', tags: [] });
      setIsPreviewMode(false);
      refetch();
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await deleteTimestamp(id).unwrap();
      setNoteToDelete(null);
      refetch();
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const startEditing = (note: Timestamp) => {
    setIsEditingNote(note.id);
    setEditingNote({
      title: note.title,
      note: note.note,
      tags: note.tags,
    });
    setIsPreviewMode(false);
  };

  const addTag = (tags: string[], setTags: (tags: string[]) => void) => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
    }
    setTagInput('');
    setShowTagSuggestions(false);
  };

  const removeTag = (
    tagToRemove: string,
    tags: string[],
    setTags: (tags: string[]) => void,
  ) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const getCurrentNote = () => {
    return notes.find((note) => Math.abs(note.timestamp - currentTime) < 5);
  };

  const filteredTags = searchedTags?.data?.tags || [];

  const exportToMarkdown = () => {
    const formatMarkdownTime = (seconds: number) => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const generateMarkdown = () => {
      let markdown = '';

      markdown += `# 📝 YouTube Video Notes\n\n`;

      if (videoTitle) {
        markdown += `**Video:** ${videoTitle}\n`;
      }

      if (videoId) {
        markdown += `**URL:** https://www.youtube.com/watch?v=${videoId}\n`;
      }

      markdown += `**Date:** ${new Date().toLocaleDateString()}\n`;
      markdown += `**Total Notes:** ${notes.length}\n\n`;

      if (notes.length === 0) {
        markdown += `*No notes available*\n`;
        return markdown;
      }

      markdown += `---\n\n`;

      markdown += `## 📋 Table of Contents\n\n`;
      notes.forEach((note, index) => {
        markdown += `${index + 1}. [${note.title}](#note-${index + 1}---${note.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}) - ${formatMarkdownTime(note.timestamp)}\n`;
      });
      markdown += `\n---\n\n`;

      markdown += `## 📄 Notes\n\n`;
      notes.forEach((note, index) => {
        markdown += `### Note ${index + 1} - ${note.title}\n\n`;
        markdown += `**⏰ Timestamp:** [${formatMarkdownTime(note.timestamp)}](https://www.youtube.com/watch?v=${videoId}&t=${note.timestamp}s)\n\n`;

        if (note.note) {
          markdown += `**Description:**\n${note.note}\n\n`;
        }

        if (note.tags.length > 0) {
          markdown += `**Tags:** ${note.tags.map((tag) => `\`${tag}\``).join(', ')}\n\n`;
        }

        markdown += `**Created:** ${note.created_at}\n\n`;
        markdown += `---\n\n`;
      });

      markdown += `\n*Generated by YTClipper on ${new Date().toLocaleString()}*\n`;

      return markdown;
    };

    const markdown = generateMarkdown();
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    const fileName = videoTitle
      ? `${videoTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_notes.md`
      : `youtube_notes_${new Date().toISOString().split('T')[0]}.md`;

    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const currentNote = getCurrentNote();

  const handleOpenAddNote = () => {
    setIsAddingNote(true);
    onPauseVideo?.();
  };

  const handleCloseAddNote = () => {
    setIsAddingNote(false);
    onResumeVideo?.();
  };

  const toggleNoteExpansion = (noteId: string) => {
    setExpandedNoteIds((prev) =>
      prev.includes(noteId)
        ? prev.filter((id) => id !== noteId)
        : [...prev, noteId],
    );
  };

  return (
    <div className='h-full bg-white border-l border-gray-200 flex flex-col min-w-0'>
      {/* Header */}
      <div className='p-4 border-b border-gray-200 bg-white flex-shrink-0'>
        <div className='flex items-center justify-between'>
          <div className='min-w-0 flex-1'>
            <h2 className='text-lg font-semibold text-gray-900 flex items-center gap-2'>
              <FileText className='h-5 w-5 text-gray-600 flex-shrink-0' />
              <span className='truncate'>Video Notes</span>
            </h2>
            <p className='text-sm text-gray-600 mt-1 truncate'>
              {notes.length} notes • Current:{' '}
              {formatTime(timeStampsSliceData.currentTimestamp)}
            </p>
          </div>
          <div className='flex gap-2 flex-shrink-0 ml-2'>
            {notes.length > 0 && (
              <Button
                variant='outline'
                size='sm'
                onClick={exportToMarkdown}
                className='px-2'
              >
                <Download className='h-4 w-4' />
                Export Notes
              </Button>
            )}
            <Button
              variant='default'
              size='sm'
              onClick={handleOpenAddNote}
              className='px-2'
            >
              <Plus className='h-4 w-4' />
              Add Note
            </Button>
            <Dialog open={isAddingNote} onOpenChange={handleCloseAddNote}>
              <DialogContent className='w-full !max-w-4xl md:!w-[64rem] max-h-[90vh] overflow-y-auto'>
                <DialogHeader>
                  <DialogTitle>Add New Note</DialogTitle>
                </DialogHeader>
                <div className='flex flex-col md:flex-row md:space-x-8 space-y-4 md:space-y-0 w-full'>
                  <div className='flex-1 min-w-0 space-y-2'>
                    <div>
                      <label
                        htmlFor='title'
                        className='text-sm font-medium text-gray-700 mb-2 block'
                      >
                        Title
                      </label>
                      <Input
                        id='title'
                        placeholder='Enter a descriptive title for your note...'
                        value={newNote.title}
                        onChange={(e) =>
                          setNewNote((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className='flex-1 space-y-2'>
                      <label
                        htmlFor='note'
                        className='text-sm font-medium text-gray-700 mb-2 block'
                      >
                        Note Content (Markdown Editor)
                      </label>
                      <p className='text-xs text-gray-500 mt-2'>
                        💡 Supports markdown: **bold**, *italic*, `code`,
                        [links](url), headers, lists, and more
                      </p>
                      <div className='border border-gray-300 rounded-lg overflow-hidden'>
                        <MDEditor
                          value={newNote.note}
                          onChange={(value) =>
                            setNewNote((prev) => ({
                              ...prev,
                              note: value || '',
                            }))
                          }
                          height={300}
                          preview='live'
                          className='w-full'
                        />
                      </div>
                    </div>
                  </div>
                  <div className='flex flex-col justify-between md:w-1/3 w-full'>
                    <div className='flex flex-col gap-2 h-full overflow-scroll px-2'>
                      <div>
                        <label
                          htmlFor='timestamp'
                          className='text-sm font-medium text-gray-700 mb-2 block'
                        >
                          Timestamp (Current Video Time)
                        </label>
                        <Input
                          id='timestamp'
                          type='text'
                          value={formatTime(currentTime)}
                          disabled
                          className='bg-gray-50 border-gray-300 text-gray-700 font-mono'
                        />
                      </div>
                      <div className='relative'>
                        <label
                          htmlFor='tags'
                          className='text-sm font-medium text-gray-700 mb-2 block'
                        >
                          Tags
                        </label>
                        <div className='flex gap-2'>
                          <Input
                            id='tags'
                            placeholder='Search existing tags or create new ones...'
                            value={tagInput}
                            onChange={(e) => {
                              setTagInput(e.target.value);
                              setShowTagSuggestions(e.target.value.length > 0);
                            }}
                            onKeyPress={(e) =>
                              e.key === 'Enter' &&
                              addTag(newNote.tags, (tags) =>
                                setNewNote((prev) => ({ ...prev, tags })),
                              )
                            }
                          />
                          <Button
                            type='button'
                            variant='outline'
                            onClick={() =>
                              addTag(newNote.tags, (tags) =>
                                setNewNote((prev) => ({ ...prev, tags })),
                              )
                            }
                          >
                            <Hash className='h-4 w-4' />
                          </Button>
                        </div>

                        {showTagSuggestions ? (
                          <div className='absolute z-10 w-full mt-1 bg-background border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto'>
                            {filteredTags.map((tag) => (
                              <button
                                key={tag.id}
                                type='button'
                                onClick={() => {
                                  if (!newNote.tags.includes(tag.name)) {
                                    setNewNote((prev) => ({
                                      ...prev,
                                      tags: [...prev.tags, tag.name],
                                    }));
                                  }
                                  setTagInput('');
                                  setShowTagSuggestions(false);
                                }}
                                className='w-full text-left px-4 p-2 hover:bg-secondary flex items-center gap-3 border-b border-gray-100 last:border-b-0 text-sm'
                              >
                                <Tag className='h-3 w-3 text-gray-400' />
                                <span className='text-gray-700'>
                                  {tag.name}
                                </span>
                              </button>
                            ))}
                            {tagInput &&
                            !filteredTags.some(
                              (tag) =>
                                tag.name.toLowerCase() ===
                                tagInput.toLowerCase(),
                            ) ? (
                              <button
                                type='button'
                                onClick={() =>
                                  addTag(newNote.tags, (tags) =>
                                    setNewNote((prev) => ({ ...prev, tags })),
                                  )
                                }
                                className='w-full text-left px-4 py-2 hover:bg-secondary flex items-center text-orange-600 border-b border-gray-100 last:border-b-0 text-sm'
                              >
                                <Plus className='h-3 w-3' />
                                <span className='px-3'>
                                  Create &ldquo;{tagInput}&rdquo;
                                </span>
                              </button>
                            ) : null}
                          </div>
                        ) : null}

                        <div className='flex flex-wrap gap-2 mt-3'>
                          {newNote.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant='secondary'
                              className='text-xs'
                            >
                              {tag}
                              <Button
                                variant='ghost'
                                size='sm'
                                className='h-auto p-0 ml-1'
                                onClick={() =>
                                  removeTag(tag, newNote.tags, (tags) =>
                                    setNewNote((prev) => ({ ...prev, tags })),
                                  )
                                }
                              >
                                <X className='h-3 w-3' />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className='flex justify-between gap-2 mt-4'>
                      <Button
                        onClick={handleAddNote}
                        className='flex-1'
                        disabled={isCreating}
                      >
                        {isCreating ? (
                          <>
                            <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                            Creating Note...
                          </>
                        ) : (
                          'Create Note'
                        )}
                      </Button>
                      <Button variant='outline' onClick={handleCloseAddNote}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {currentNote ? (
        <div className='mx-4 mt-4 flex-shrink-0'>
          <Card className='bg-orange-50 border-orange-200'>
            <CardHeader className='pb-3'>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-sm font-semibold text-orange-900'>
                  🎯 Current Note
                </CardTitle>
                <Badge
                  variant='outline'
                  className='text-orange-700 border-orange-300 bg-orange-100'
                >
                  <Clock className='h-3 w-3 mr-1' />
                  {formatTime(currentNote.timestamp)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <h3 className='font-semibold text-gray-900 mb-2 truncate'>
                {currentNote.title}
              </h3>
              <div className='text-sm text-gray-700 mb-3'>
                <MarkdownPreview
                  wrapperElement={{
                    'data-color-mode': 'light',
                  }}
                  source={currentNote.note}
                />
              </div>
              <div className='flex flex-wrap gap-1'>
                {currentNote.tags.map((tag) => (
                  <Badge key={tag} variant='secondary' className='text-xs'>
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className='flex-1 min-h-0'>
        <div className='flex-1 h-[calc(100vh-150px)] relative p-4 justify-center w-full overflow-y-auto'>
          {timestampsLoading ? (
            <div className='text-center py-8'>
              <div className='inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4'>
                <Clock className='h-6 w-6 text-gray-600 animate-pulse' />
              </div>
              <p className='text-gray-600 font-medium'>Loading your notes...</p>
              <p className='text-sm text-gray-500 mt-1'>
                This won&apos;t take long
              </p>
            </div>
          ) : null}

          {notes.length === 0 && !timestampsLoading ? (
            <div className='text-center py-8'>
              <div className='inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4'>
                <FileText className='h-6 w-6 text-gray-400' />
              </div>
              <p className='text-gray-600 font-medium'>No notes yet</p>
              <p className='text-sm text-gray-500 mt-1'>
                Start taking notes to see them here
              </p>
            </div>
          ) : null}

          {notes.length > 0 &&
            notes.map((note) => {
              const isExpanded = expandedNoteIds.includes(note.id);
              const isCurrent = note.id === currentNote?.id;

              return (
                <Card
                  key={note.id}
                  className={cn(
                    `transition-all p-0 duration-300 hover:shadow-md border`,
                    isCurrent
                      ? 'ring-2 ring-orange-500 border-orange-200 bg-orange-50'
                      : 'border-gray-200 bg-white hover:border-gray-300',
                    'mt-4 max-w-full',
                  )}
                >
                  <CardContent className='p-0'>
                    <div
                      className='p-4 cursor-pointer hover:bg-gray-50 transition-colors rounded-2xl'
                      onClick={() => toggleNoteExpansion(note.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleNoteExpansion(note.id);
                        }
                      }}
                      role='button'
                      tabIndex={0}
                    >
                      <div className='flex-1 md:flex items-start justify-between space-y-2'>
                        <div className='flex-1 pr-2'>
                          <div className='flex items-center gap-3 mb-2'>
                            <h3 className='font-semibold text-gray-900 truncate flex-1 min-w-0'>
                              {note.title.length > 40
                                ? `${note.title.substring(0, 40)}...`
                                : note.title}
                            </h3>
                            {isCurrent ? (
                              <Badge
                                variant='secondary'
                                className='text-xs bg-orange-100 text-orange-800 border-orange-200 flex-shrink-0'
                              >
                                Current
                              </Badge>
                            ) : null}
                          </div>
                          <div className='flex items-center gap-2 text-sm text-gray-500 flex-wrap'>
                            <Clock className='h-4 w-4 flex-shrink-0' />
                            <span className='font-mono'>
                              {formatTime(note.timestamp)}
                            </span>
                            {note.tags.length > 0 && (
                              <>
                                <span>•</span>
                                <span>{note.tags.length} tags</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className='flex items-center gap-1 flex-shrink-0 justify-center'>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='h-8 min-w-8 w-full p-0 hover:bg-gray-200'
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditing(note);
                            }}
                            disabled={isUpdating}
                          >
                            {isUpdating ? (
                              <Loader2 className='h-4 w-4 animate-spin' />
                            ) : (
                              <>
                                <Edit className='h-4 w-4' />
                                <div className='md:hidden'>Edit</div>
                              </>
                            )}
                          </Button>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='h-8 min-w-8 w-full p-0 hover:bg-red-100 text-red-600'
                            onClick={(e) => {
                              e.stopPropagation();
                              setNoteToDelete(note.id);
                            }}
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <Loader2 className='h-4 w-4 animate-spin' />
                            ) : (
                              <>
                                <Trash2 className='h-4 w-4' />
                                <div className='md:hidden'>Delete</div>
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      {note.tags.length > 0 && (
                        <div className='flex flex-wrap gap-1 mt-3 overflow-hidden'>
                          {note.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant='secondary'
                              className='text-xs truncate max-w-[120px]'
                              title={tag}
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isExpanded
                          ? 'max-h-[1000px] opacity-100'
                          : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className='border-t border-gray-100 p-4 bg-gray-50 overflow-hidden'>
                        {note.note ? (
                          <div className='prose prose-sm max-w-none overflow-hidden break-words'>
                            <MarkdownPreview
                              source={note.note}
                              wrapperElement={{
                                'data-color-mode': 'light',
                              }}
                            />
                          </div>
                        ) : (
                          <p className='text-gray-500 italic'>
                            No content added to this note yet.
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      </div>

      <Dialog
        open={!!isEditingNote}
        onOpenChange={() => {
          setIsEditingNote(null);
          setEditingNote({ title: '', note: '', tags: [] });
          setIsPreviewMode(false);
        }}
      >
        <DialogContent className='w-full !max-w-4xl md:!w-[64rem] max-h-[90vh] h-fit overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Edit className='h-5 w-5' />
              Edit Note
            </DialogTitle>
          </DialogHeader>
          <div className='flex flex-col md:flex-row md:space-x-8 space-y-4 md:space-y-0 w-full'>
            <div className='flex-1 min-w-0 space-y-2'>
              <div className='flex flex-col h-full space-y-4'>
                <div>
                  <label
                    htmlFor='edit-title'
                    className='text-sm font-medium text-gray-700 mb-2 block'
                  >
                    Note Title
                  </label>
                  <Input
                    id='edit-title'
                    placeholder='Enter note title...'
                    value={editingNote.title}
                    onChange={(e) =>
                      setEditingNote((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className='text-lg font-semibold'
                  />
                </div>

                <div className='flex items-center justify-between'>
                  <h3 className='text-lg font-semibold text-gray-900'>
                    Note Content
                  </h3>
                  <div className='flex items-center gap-2'>
                    <Button
                      variant={!isPreviewMode ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => setIsPreviewMode(false)}
                    >
                      <Edit className='h-4 w-4 mr-2' />
                      Edit
                    </Button>
                    <Button
                      variant={isPreviewMode ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => setIsPreviewMode(true)}
                    >
                      {isPreviewMode ? (
                        <>
                          <Eye className='h-4 w-4 mr-2' />
                          Preview
                        </>
                      ) : (
                        <>
                          <EyeOff className='h-4 w-4 mr-2' />
                          Preview
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className='flex-1 min-h-0 border border-gray-300 rounded-lg overflow-hidden'>
                  {isPreviewMode ? (
                    <ScrollArea className='h-full'>
                      <div className='p-6 bg-white'>
                        <MarkdownPreview
                          source={editingNote.note}
                          wrapperElement={{
                            'data-color-mode': 'light',
                          }}
                          className='w-full'
                        />
                      </div>
                    </ScrollArea>
                  ) : (
                    <MDEditor
                      value={editingNote.note}
                      onChange={(value) =>
                        setEditingNote((prev) => ({
                          ...prev,
                          note: value || '',
                        }))
                      }
                      height='100%'
                      preview='live'
                      className='w-full h-full min-h-[40vh] opacity-100'
                    />
                  )}
                </div>
              </div>
            </div>
            <div className='flex flex-col justify-between md:w-1/3 w-full'>
              <div>
                <div className='relative'>
                  <label
                    htmlFor='edit-tags'
                    className='text-sm font-medium text-gray-700 mb-2 block'
                  >
                    Tags
                  </label>
                  <div className='flex gap-2'>
                    <Input
                      id='edit-tags'
                      placeholder='Search existing tags or create new ones...'
                      value={tagInput}
                      onChange={(e) => {
                        setTagInput(e.target.value);
                        setShowTagSuggestions(e.target.value.length > 0);
                      }}
                      onKeyPress={(e) =>
                        e.key === 'Enter' &&
                        addTag(editingNote.tags, (tags) =>
                          setEditingNote((prev) => ({ ...prev, tags })),
                        )
                      }
                    />
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() =>
                        addTag(editingNote.tags, (tags) =>
                          setEditingNote((prev) => ({ ...prev, tags })),
                        )
                      }
                    >
                      <Hash className='h-4 w-4' />
                    </Button>
                  </div>

                  {showTagSuggestions ? (
                    <div className='absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto'>
                      {filteredTags.map((tag) => (
                        <button
                          key={tag.id}
                          type='button'
                          onClick={() => {
                            if (!editingNote.tags.includes(tag.name)) {
                              setEditingNote((prev) => ({
                                ...prev,
                                tags: [...prev.tags, tag.name],
                              }));
                            }
                            setTagInput('');
                            setShowTagSuggestions(false);
                          }}
                          className='w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0'
                        >
                          <Tag className='h-4 w-4 text-gray-400' />
                          <span className='text-gray-700'>{tag.name}</span>
                        </button>
                      ))}
                      {tagInput &&
                      !filteredTags.some(
                        (tag) =>
                          tag.name.toLowerCase() === tagInput.toLowerCase(),
                      ) ? (
                        <button
                          type='button'
                          onClick={() =>
                            addTag(editingNote.tags, (tags) =>
                              setEditingNote((prev) => ({ ...prev, tags })),
                            )
                          }
                          className='w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-orange-600 border-b border-gray-100 last:border-b-0'
                        >
                          <Plus className='h-4 w-4' />
                          <span>Create &ldquo;{tagInput}&rdquo;</span>
                        </button>
                      ) : null}
                    </div>
                  ) : null}

                  <div className='flex flex-wrap gap-2 mt-3'>
                    {editingNote.tags.map((tag) => (
                      <Badge key={tag} variant='secondary' className='text-sm'>
                        {tag}
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-auto p-0 ml-1'
                          onClick={() =>
                            removeTag(tag, editingNote.tags, (tags) =>
                              setEditingNote((prev) => ({ ...prev, tags })),
                            )
                          }
                        >
                          <X className='h-3 w-3' />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className='flex gap-3 pt-4 border-t border-gray-200'>
                <Button
                  onClick={() => {
                    if (isEditingNote) {
                      handleUpdateNote(isEditingNote);
                    }
                  }}
                  className='flex-1'
                  disabled={isUpdating || !isEditingNote}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className='h-4 w-4 mr-2' />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button
                  variant='outline'
                  onClick={() => {
                    setIsEditingNote(null);
                    setEditingNote({ title: '', note: '', tags: [] });
                    setIsPreviewMode(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!noteToDelete}
        onOpenChange={() => setNoteToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => noteToDelete && handleDeleteNote(noteToDelete)}
              className='bg-red-600 hover:bg-red-700'
            >
              Delete Note
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
