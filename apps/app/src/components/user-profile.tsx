import { useAuth0 } from '@auth0/auth0-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@ytclipper/ui';

const UserProfile = () => {
  const { user, isAuthenticated, isLoading, getAccessTokenSilently, logout } =
    useAuth0();

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

  const handleGetToken = async () => {
    try {
      const token = await getAccessTokenSilently();

      // You can use this token to call your backend API
      const response = await fetch('http://localhost:8080/api/v1/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Backend response:', data);
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
  };

  return (
    <Card className='max-w-md'>
      <CardHeader>
        <CardTitle>User Profile</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {user.picture && (
          <div className='flex justify-center'>
            <img
              src={user.picture}
              alt={user.name || 'User'}
              className='w-20 h-20 rounded-full border-2 border-gray-200'
            />
          </div>
        )}

        <div className='space-y-3'>
          <div className='border-b pb-2'>
            <label className='text-sm font-medium text-gray-500'>Name</label>
            <p className='text-base'>{user.name || 'Not provided'}</p>
          </div>

          <div className='border-b pb-2'>
            <label className='text-sm font-medium text-gray-500'>Email</label>
            <div className='flex items-center space-x-2'>
              <p className='text-base'>{user.email || 'Not provided'}</p>
              {user.email_verified && (
                <span className='px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full'>
                  ✓ Verified
                </span>
              )}
            </div>
          </div>

          <div className='border-b pb-2'>
            <label className='text-sm font-medium text-gray-500'>
              Username
            </label>
            <p className='text-base'>
              {user.nickname || user.preferred_username || 'Not provided'}
            </p>
          </div>

          <div className='border-b pb-2'>
            <label className='text-sm font-medium text-gray-500'>User ID</label>
            <p className='text-xs font-mono bg-gray-100 p-2 rounded break-all'>
              {user.sub}
            </p>
          </div>

          <div className='border-b pb-2'>
            <label className='text-sm font-medium text-gray-500'>
              Last Updated
            </label>
            <p className='text-sm'>
              {user.updated_at
                ? new Date(user.updated_at).toLocaleDateString()
                : 'Not available'}
            </p>
          </div>

          {/* Additional user metadata */}
          {Object.keys(user).length > 0 && (
            <details className='mt-4'>
              <summary className='text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-700'>
                View All User Data
              </summary>
              <pre className='mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40'>
                {JSON.stringify(user, null, 2)}
              </pre>
            </details>
          )}
        </div>

        <div className='pt-4 border-t'>
          <button
            onClick={handleGetToken}
            className='w-full text-sm text-blue-600 hover:text-blue-800 underline py-2'
          >
            Test Backend API Call (Check Console)
          </button>
        </div>
      </CardContent>
      <div className='p-4 border-t'>
        <Button
          onClick={() =>
            logout({
              logoutParams: {
                returnTo: window.location.origin,
              },
            })
          }
          variant='outline'
          className='border-red-500 text-red-500 hover:bg-red-50 w-full'
        >
          Log Out
        </Button>
      </div>
    </Card>
  );
};

export default UserProfile;
