import { Card, CardContent, CardHeader, CardTitle } from '@ytclipper/ui';
import { useAuth } from '../hooks/useAuth';

const UserProfile = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Card className='max-w-md'>
        <CardContent className='p-6'>
          <div className='animate-pulse'>
            <div className='h-4 bg-gray-200 rounded w-3/4 mb-2' />
            <div className='h-4 bg-gray-200 rounded w-1/2' />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <Card className='max-w-md'>
      <CardHeader>
        <CardTitle className='flex items-center space-x-3'>
          {user.picture ? (
            <img
              src={user.picture}
              alt={user.name}
              className='w-10 h-10 rounded-full'
            />
          ) : null}
          <div>
            <h3 className='font-semibold'>{user.name}</h3>
            <p className='text-sm text-gray-600'>{user.email}</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-2 text-sm'>
          <p>
            <span className='font-medium'>Email Verified:</span>{' '}
            {user.email_verified ? 'Yes' : 'No'}
          </p>
          <p>
            <span className='font-medium'>Provider:</span>{' '}
            {user.primary_provider || 'Email'}
          </p>
          <p>
            <span className='font-medium'>Member since:</span>{' '}
            {new Date(user.created_at).toLocaleDateString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserProfile;
