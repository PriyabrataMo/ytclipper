import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@ytclipper/ui';
import { useState } from 'react';
import { Navigate, useLocation } from 'react-router';

import { useAuth } from '../hooks/useAuth';

export const LoginPage = () => {
  const {
    isAuthenticated,
    loginWithEmailPassword,
    register,
    loginWithGoogle,
    isLoggingIn,
    isRegistering,
  } = useAuth();
  const location = useLocation();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const from = location.state?.from?.pathname || '/dashboard';

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLoginMode) {
      loginWithEmailPassword({
        email: formData.email,
        password: formData.password,
      });
    } else {
      if (formData.password !== formData.confirmPassword) {
        console.log('Passwords do not match');
        return;
      }
      register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleGoogleLogin = () => {
    loginWithGoogle();
  };

  const currentlyLoading = isLoggingIn || isRegistering;

  return (
    <div className='min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-100'>
      <Card className='max-w-md w-full'>
        <CardHeader>
          <CardTitle className='text-center'>
            {isLoginMode ? 'Sign In to YT Clipper' : 'Create Your Account'}
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <form onSubmit={handleSubmit} className='space-y-4'>
            {!isLoginMode && (
              <div>
                <label
                  htmlFor='name'
                  className='block text-sm font-medium text-gray-700 mb-1'
                >
                  Full Name
                </label>
                <input
                  type='text'
                  id='name'
                  name='name'
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
            )}

            <div>
              <label
                htmlFor='email'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Email Address
              </label>
              <input
                type='email'
                id='email'
                name='email'
                value={formData.email}
                onChange={handleInputChange}
                required
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>

            <div>
              <label
                htmlFor='password'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Password
              </label>
              <input
                type='password'
                id='password'
                name='password'
                value={formData.password}
                onChange={handleInputChange}
                required
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>

            {!isLoginMode && (
              <div>
                <label
                  htmlFor='confirmPassword'
                  className='block text-sm font-medium text-gray-700 mb-1'
                >
                  Confirm Password
                </label>
                <input
                  type='password'
                  id='confirmPassword'
                  name='confirmPassword'
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
            )}

            <Button
              type='submit'
              disabled={currentlyLoading}
              className='w-full bg-blue-600 hover:bg-blue-700 text-white'
            >
              {currentlyLoading
                ? 'Processing...'
                : isLoginMode
                  ? 'Sign In'
                  : 'Create Account'}
            </Button>
          </form>

          <div className='relative'>
            <div className='absolute inset-0 flex items-center'>
              <div className='w-full border-t border-gray-300' />
            </div>
            <div className='relative flex justify-center text-sm'>
              <span className='px-2 bg-white text-gray-500'>
                Or continue with
              </span>
            </div>
          </div>

          <Button
            onClick={handleGoogleLogin}
            disabled={currentlyLoading}
            variant='outline'
            className='w-full'
          >
            Sign in with Google
          </Button>

          <div className='text-center'>
            <button
              type='button'
              onClick={() => setIsLoginMode(!isLoginMode)}
              className='text-sm text-blue-600 hover:text-blue-800'
            >
              {isLoginMode
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
