import { useFeatureUsage } from '@/hooks/use-profile';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@ytclipper/ui';
import { FeatureGate, UsageWarning } from './feature-gate';

// Example: Video upload component with feature gating
export function VideoUploadExample() {
  const videoUsage = useFeatureUsage('videos');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Video</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Show usage warning if approaching limit */}
        <UsageWarning
          feature='videos'
          currentUsage={videoUsage.currentUsage}
          limit={videoUsage.limit}
          threshold={80}
        />

        {/* Feature gate for video upload */}
        <FeatureGate feature='videos'>
          <div className='space-y-3'>
            <p className='text-sm text-gray-600'>
              Upload a YouTube video to start taking notes and generating
              summaries.
            </p>
            <Button className='w-full'>Upload Video</Button>
          </div>
        </FeatureGate>
      </CardContent>
    </Card>
  );
}

// Example: AI Summary generation with feature gating
export function AISummaryExample() {
  const summaryUsage = useFeatureUsage('ai_summaries');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate AI Summary</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Show usage warning if approaching limit */}
        <UsageWarning
          feature='AI summaries'
          currentUsage={summaryUsage.currentUsage}
          limit={summaryUsage.limit}
          threshold={75}
        />

        {/* Feature gate for AI summary generation */}
        <FeatureGate feature='summaries'>
          <div className='space-y-3'>
            <p className='text-sm text-gray-600'>
              Generate an AI-powered summary of your video content.
            </p>
            <Button className='w-full'>Generate Summary</Button>
          </div>
        </FeatureGate>
      </CardContent>
    </Card>
  );
}

// Example: Notes creation with feature gating
export function NotesExample() {
  const notesUsage = useFeatureUsage('notes');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Note</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Show usage warning if approaching limit */}
        <UsageWarning
          feature='notes per video'
          currentUsage={notesUsage.currentUsage}
          limit={notesUsage.limit}
          threshold={85}
        />

        {/* Feature gate for notes creation */}
        <FeatureGate feature='notes'>
          <div className='space-y-3'>
            <p className='text-sm text-gray-600'>
              Add a timestamped note to your video.
            </p>
            <Button className='w-full'>Add Note</Button>
          </div>
        </FeatureGate>
      </CardContent>
    </Card>
  );
}

// Example: AI Questions with feature gating
export function AIQuestionsExample() {
  const aiUsage = useFeatureUsage('ai_questions');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ask AI Question</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Show usage warning if approaching limit */}
        <UsageWarning
          feature='AI questions'
          currentUsage={aiUsage.currentUsage}
          limit={aiUsage.limit}
          threshold={70}
        />

        {/* Feature gate for AI questions */}
        <FeatureGate feature='ai'>
          <div className='space-y-3'>
            <p className='text-sm text-gray-600'>
              Ask questions about your video content and get AI-powered answers.
            </p>
            <Button className='w-full'>Ask Question</Button>
          </div>
        </FeatureGate>
      </CardContent>
    </Card>
  );
}
