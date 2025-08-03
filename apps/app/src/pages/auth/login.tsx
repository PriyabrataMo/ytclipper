import {
  useLazyGetGoogleLoginUrlQuery,
  useLoginMutation,
} from '@/services/auth';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@ytclipper/ui';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const from = location.state?.from?.pathname || '/videos';
  const [triggerGetGoogleUrl, { isLoading, error }] =
    useLazyGetGoogleLoginUrlQuery();
  const [login, { isLoading: isLoggingIn, error: loginError }] =
    useLoginMutation();

  const handleGoogleLogin = async () => {
    try {
      const result = await triggerGetGoogleUrl().unwrap();
      console.log('Google login result:', result);

      if (result?.data.auth_url) {
        console.log('Redirecting to Google login URL:', result.data.auth_url);
        window.location.href = result.data.auth_url;
      } else {
        console.error('No auth_url found in response:', result);
      }
    } catch (err) {
      console.error('Error getting Google login URL:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await login({
        email: formData.email,
        password: formData.password,
      });
      if (response?.data?.success) {
        navigate(from, { replace: true });
      }
    } catch (error) {
      console.error('Error logging in:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const currentlyLoading = isLoading || isLoggingIn;

  return (
    <Card className='w-full shadow-2xl border-0 bg-white/80 backdrop-blur-sm'>
      <CardHeader className='space-y-2 pb-4'>
        <div className='flex justify-center mb-3'>
          <div className='w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center'>
            <svg
              className='w-6 h-6 text-white'
              fill='currentColor'
              viewBox='0 0 24 24'
            >
              <path d='M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z' />
            </svg>
          </div>
        </div>
        <CardTitle className='text-center text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent'>
          Welcome to YT Clipper
        </CardTitle>
        <p className='text-center text-sm text-gray-600'>
          Sign in to your YT Clipper account
        </p>
      </CardHeader>

      <CardContent className='space-y-4'>
        {error || loginError ? (
          <div className='flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm'>
            <AlertCircle className='w-4 h-4 flex-shrink-0' />
            <span>Authentication failed. Please try again.</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <label
              htmlFor='email'
              className='block text-sm font-semibold text-gray-700'
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
              className='w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-white hover:bg-gray-50'
              placeholder='Enter your email'
            />
          </div>

          <div className='space-y-2'>
            <label
              htmlFor='password'
              className='block text-sm font-semibold text-gray-700'
            >
              Password
            </label>
            <div className='relative'>
              <input
                type={showPassword ? 'text' : 'password'}
                id='password'
                name='password'
                value={formData.password}
                onChange={handleInputChange}
                required
                className='w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-white hover:bg-gray-50'
                placeholder='Enter your password'
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors'
              >
                {showPassword ? (
                  <EyeOff className='w-4 h-4' />
                ) : (
                  <Eye className='w-4 h-4' />
                )}
              </button>
            </div>
          </div>

          <div className='text-right'>
            <button
              type='button'
              onClick={() => navigate('/auth/forgot-password')}
              className='text-sm text-orange-600 hover:text-orange-800 font-medium transition-colors duration-200 hover:underline'
            >
              Forgot your password?
            </button>
          </div>

          <Button
            type='submit'
            disabled={currentlyLoading || !formData.email || !formData.password}
            className='w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-2.5 rounded-lg font-semibold transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
          >
            {currentlyLoading ? (
              <div className='flex items-center gap-2'>
                <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                Processing...
              </div>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        <div className='relative'>
          <div className='absolute inset-0 flex items-center'>
            <div className='w-full border-t border-gray-200' />
          </div>
          <div className='relative flex justify-center text-sm'>
            <span className='px-4 bg-white text-gray-500 font-medium'>
              Or continue with
            </span>
          </div>
        </div>

        <Button
          onClick={handleGoogleLogin}
          disabled={currentlyLoading}
          variant='outline'
          className='w-full py-2.5 rounded-lg border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 transform hover:scale-[1.02] disabled:transform-none'
        >
          <div className='flex items-center gap-3'>
            <svg
              className='google-icon'
              viewBox='0 0 24 24'
              width='20'
              height='20'
            >
              <path
                fill='#4285F4'
                d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
              />
              <path
                fill='#34A853'
                d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
              />
              <path
                fill='#FBBC05'
                d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
              />
              <path
                fill='#EA4335'
                d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
              />
            </svg>
            <span className='font-medium'>Continue with Google</span>
          </div>
        </Button>

        <div className='text-center'>
          <Link
            to='/auth/register'
            className='text-sm text-orange-600 hover:text-orange-800 font-medium transition-colors duration-200 hover:underline'
          >
            Don&apos;t have an account? Sign up
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
