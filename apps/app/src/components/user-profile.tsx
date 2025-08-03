import { Card, CardContent, CardHeader, CardTitle } from '@ytclipper/ui';
import { useState } from 'react';
import { useGetCurrentUserQuery } from '../services/auth';

const UserProfile = () => {
  const { data, isLoading, isError } = useGetCurrentUserQuery();
  // TODO: Remove this once we have a proper extension statuso
  const [extensionStatus] = useState<{
    available: boolean;
    extensionId: string;
  } | null>(null);
  const [lastSyncTime] = useState<Date | null>(null);
  const [syncResult] = useState<'success' | 'error' | null>(null);
  const [isSyncing] = useState(false);

  // Check extension status and sync auth state
  // useEffect(() => {
  //   const status = getExtensionStatus();
  //   setExtensionStatus(status);

  //   // If user is authenticated and extension is available, ensure sync
  //   if (user && status.available) {
  //     setIsSyncing(true);
  //     syncAuthenticatedUser(user)
  //       .then((result) => {
  //         console.log('🔄 Extension auth sync result:', result);
  //         setSyncResult(result.success ? 'success' : 'error');
  //         if (result.success) {
  //           setLastSyncTime(result.timestamp);
  //         }
  //       })
  //       .catch((error) => {
  //         console.warn('❌ Extension auth sync failed:', error);
  //         setSyncResult('error');
  //       })
  //       .finally(() => {
  //         setIsSyncing(false);
  //       });
  //   }
  // }, [isAuthenticated, user]);

  const handleManualSync = async () => {};

  // const handleManualSync = async () => {
  //   if (!user || !extensionStatus?.available || isSyncing) {
  //     return;
  //   }

  //   setIsSyncing(true);
  //   setSyncResult(null);

  //   try {
  //     const result = await syncAuthenticatedUser(user);
  //     setSyncResult(result.success ? 'success' : 'error');
  //     if (result.success) {
  //       setLastSyncTime(result.timestamp);
  //     }
  //   } catch (error) {
  //     console.warn('❌ Manual extension sync failed:', error);
  //     setSyncResult('error');
  //   } finally {
  //     setIsSyncing(false);
  //   }
  // };
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

  if (!data?.success || isError) {
    return null;
  }

  const user = data.data.user;

  return (
    <Card className='max-w-md'>
      <CardHeader>
        <CardTitle className='flex items-center space-x-3'>
          {user?.picture ? (
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
            {user.provider || user.primary_id || 'Email'}
          </p>
          <p>
            <span className='font-medium'>Member since:</span>{' '}
            {new Date(user.created_at).toLocaleDateString()}
          </p>
          <div className='mt-4 pt-4 border-t border-gray-200'>
            <div className='flex items-center justify-between mb-2'>
              <p className='text-xs text-gray-500'>
                <span className='font-medium'>Extension Status:</span>{' '}
                {extensionStatus?.available ? (
                  <span className='text-green-600'>Connected</span>
                ) : (
                  <span className='text-orange-600'>Not Connected</span>
                )}
              </p>
              {extensionStatus?.available ? (
                <button
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className='text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {isSyncing ? 'Syncing...' : 'Sync'}
                </button>
              ) : null}
            </div>

            {extensionStatus?.available ? (
              <div className='space-y-1'>
                <p className='text-xs text-gray-500'>
                  Extension ID: {extensionStatus.extensionId}
                </p>
                {syncResult ? (
                  <p className='text-xs'>
                    <span className='font-medium'>Last Sync:</span>{' '}
                    <span
                      className={
                        syncResult === 'success'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }
                    >
                      {syncResult === 'success' ? 'Success' : 'Failed'}
                    </span>
                    {lastSyncTime ? (
                      <span className='text-gray-500 ml-1'>
                        ({lastSyncTime.toLocaleTimeString()})
                      </span>
                    ) : null}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserProfile;
