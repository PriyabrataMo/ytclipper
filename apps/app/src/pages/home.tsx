import { useAuth0 } from '@auth0/auth0-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@ytclipper/ui';
import { Link } from 'react-router';

import LoginButton from '../components/login-button';

export default function HomePage() {
  const { isAuthenticated } = useAuth0();

  return (
    <div className='p-8 space-y-6 max-w-4xl mx-auto'>
      <div className='flex justify-between items-center'>
        <h1 className='text-3xl font-bold text-foreground'>YT Clipper</h1>
        {!isAuthenticated && <LoginButton />}
      </div>

      <Card className='max-w-2xl mx-auto'>
        <CardHeader>
          <CardTitle>Welcome to YT Clipper</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <p className='text-gray-600'>
            Create and manage video clips from YouTube videos with ease.
          </p>
          {isAuthenticated ? (
            <div className='space-y-3'>
              <p className='text-green-600 font-medium'>You are logged in!</p>
              <div className='flex space-x-3'>
                <Button asChild>
                  <Link to='/dashboard'>Go to Dashboard</Link>
                </Button>
                <Button variant='outline' asChild>
                  <Link to='/profile'>View Profile</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className='space-y-3'>
              <p className='text-gray-500'>
                Please log in to access all features.
              </p>
              <ul className='list-disc list-inside space-y-1 text-sm text-gray-600'>
                <li>Create and manage video clips</li>
                <li>Share clips with others</li>
                <li>Access your clip history</li>
                <li>Export clips in various formats</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
