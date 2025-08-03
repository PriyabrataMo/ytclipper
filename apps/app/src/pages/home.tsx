import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@ytclipper/ui';
import { Bookmark, Clock, Play, Share2 } from 'lucide-react';
import { Link } from 'react-router';

export const HomePage = () => {
  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100'>
      <div className='p-8 space-y-8 max-w-6xl mx-auto'>
        <div className='text-center space-y-4'>
          <h1 className='text-5xl font-bold text-gray-900 mb-4'>YT Clipper</h1>
          <p className='text-xl text-gray-600 max-w-2xl mx-auto'>
            Transform your YouTube learning experience with timestamped notes
            and organized video clips.
          </p>
        </div>

        <div className='text-center space-y-6'>
          <Card className='max-w-md mx-auto'>
            <CardHeader>
              <CardTitle>Get Started</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <p className='text-gray-600'>
                Sign in to start creating timestamped notes for your favorite
                YouTube videos.
              </p>
              <Button
                asChild
                size='lg'
                className='w-full bg-blue-600 hover:bg-blue-700 text-white'
              >
                <Link to='/auth/login'>Sign In / Register</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12'>
          <Card className='text-center p-6'>
            <Play className='w-8 h-8 text-blue-600 mx-auto mb-3' />
            <h3 className='font-semibold mb-2'>Video Integration</h3>
            <p className='text-sm text-gray-600'>
              Seamlessly embed and control YouTube videos
            </p>
          </Card>
          <Card className='text-center p-6'>
            <Clock className='w-8 h-8 text-green-600 mx-auto mb-3' />
            <h3 className='font-semibold mb-2'>Timestamped Notes</h3>
            <p className='text-sm text-gray-600'>
              Add notes at specific video timestamps
            </p>
          </Card>
          <Card className='text-center p-6'>
            <Bookmark className='w-8 h-8 text-purple-600 mx-auto mb-3' />
            <h3 className='font-semibold mb-2'>Organized Library</h3>
            <p className='text-sm text-gray-600'>
              Keep all your videos and notes organized
            </p>
          </Card>
          <Card className='text-center p-6'>
            <Share2 className='w-8 h-8 text-orange-600 mx-auto mb-3' />
            <h3 className='font-semibold mb-2'>Easy Sharing</h3>
            <p className='text-sm text-gray-600'>
              Share your clips and notes with others
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};
