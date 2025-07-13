import { useState } from 'react';
import { Link } from 'react-router';
import { AddPasswordForm } from '../components/auth/AddPasswordForm';
import { useAuth } from '../hooks/useAuth';

export const ProfilePage = () => {
  const { user, logout } = useAuth();
  const [showAddPassword, setShowAddPassword] = useState(false);

  if (!user) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>
            Not Authenticated
          </h1>
          <Link
            to='/auth'
            className='text-blue-600 hover:text-blue-800 underline'
          >
            Please login to view your profile
          </Link>
        </div>
      </div>
    );
  }

  const handleAddPasswordSuccess = () => {
    setShowAddPassword(false);
    // User data will be automatically refreshed via React Query
  };

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>Profile</h1>
          <div className='flex space-x-4'>
            <Link
              to='/dashboard'
              className='bg-white text-gray-700 px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              Back to Dashboard
            </Link>
            <button
              onClick={() => logout()}
              className='bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500'
            >
              Logout
            </button>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* User Information Card */}
          <div className='lg:col-span-2'>
            <div className='bg-white rounded-lg shadow-md p-6'>
              <h2 className='text-xl font-bold text-gray-900 mb-6'>
                User Information
              </h2>

              <div className='space-y-4'>
                {user.picture ? (
                  <div className='flex justify-center lg:justify-start'>
                    <img
                      src={user.picture}
                      alt={user.name}
                      className='w-20 h-20 rounded-full border-2 border-gray-200'
                    />
                  </div>
                ) : null}

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <span className='block text-sm font-medium text-gray-700'>
                      Name
                    </span>
                    <p className='mt-1 text-sm text-gray-900'>{user.name}</p>
                  </div>

                  <div>
                    <span className='block text-sm font-medium text-gray-700'>
                      Email
                    </span>
                    <p className='mt-1 text-sm text-gray-900'>{user.email}</p>
                  </div>

                  <div>
                    <span className='block text-sm font-medium text-gray-700'>
                      Email Verified
                    </span>
                    <p className='mt-1 text-sm'>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.email_verified
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.email_verified ? 'Verified' : 'Not Verified'}
                      </span>
                    </p>
                  </div>

                  <div>
                    <span className='block text-sm font-medium text-gray-700'>
                      Primary Provider
                    </span>
                    <p className='mt-1 text-sm text-gray-900 capitalize'>
                      {user.primary_provider}
                    </p>
                  </div>

                  <div>
                    <span className='block text-sm font-medium text-gray-700'>
                      Member Since
                    </span>
                    <p className='mt-1 text-sm text-gray-900'>
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Authentication Methods Card */}
          <div className='lg:col-span-1'>
            <div className='bg-white rounded-lg shadow-md p-6'>
              <h2 className='text-xl font-bold text-gray-900 mb-6'>
                Authentication Methods
              </h2>

              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-2'>
                    <svg
                      className='w-5 h-5 text-blue-600'
                      fill='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z' />
                      <path d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z' />
                      <path d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z' />
                      <path d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z' />
                    </svg>
                    <span className='text-sm font-medium'>Google</span>
                  </div>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.has_google_account
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {user.has_google_account ? 'Connected' : 'Not Connected'}
                  </span>
                </div>

                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-2'>
                    <svg
                      className='w-5 h-5 text-gray-600'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                      />
                    </svg>
                    <span className='text-sm font-medium'>Password</span>
                  </div>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.has_password
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {user.has_password ? 'Set' : 'Not Set'}
                  </span>
                </div>

                {!user.has_password && (
                  <div className='pt-4 border-t border-gray-200'>
                    <button
                      onClick={() => setShowAddPassword(true)}
                      className='w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
                    >
                      Add Password Authentication
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {showAddPassword ? (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
            <div className='bg-white rounded-lg max-w-md w-full'>
              <AddPasswordForm
                onSuccess={handleAddPasswordSuccess}
                onCancel={() => setShowAddPassword(false)}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
