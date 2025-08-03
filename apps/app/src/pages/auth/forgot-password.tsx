import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@ytclipper/ui';
import { AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // TODO: Implement forgot password API call
      // const response = await forgotPassword({ email }).unwrap();

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setIsSubmitted(true);
    } catch {
      setError('Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className='h-screen w-full flex items-center justify-center'>
        <Card className='max-w-md w-full shadow-2xl border-0 bg-white/80 backdrop-blur-sm'>
          <CardHeader className='space-y-2 pb-4'>
            <div className='flex justify-center mb-3'>
              <div className='w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center'>
                <CheckCircle2 className='w-6 h-6 text-white' />
              </div>
            </div>
            <CardTitle className='text-center text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent'>
              Check Your Email
            </CardTitle>
            <p className='text-center text-sm text-gray-600'>
              We&apos;ve sent a password reset link to <strong>{email}</strong>
            </p>
          </CardHeader>

          <CardContent className='space-y-4'>
            <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
              <div className='flex items-start gap-3'>
                <CheckCircle2 className='w-5 h-5 text-green-600 mt-0.5 flex-shrink-0' />
                <div className='text-sm text-green-800'>
                  <p className='font-medium mb-1'>
                    Reset link sent successfully!
                  </p>
                  <p>
                    Click the link in your email to reset your password. The
                    link will expire in 1 hour.
                  </p>
                </div>
              </div>
            </div>

            <div className='space-y-4'>
              <Button
                onClick={() => setIsSubmitted(false)}
                className='w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-2.5 rounded-lg font-semibold transition-all duration-200 transform hover:scale-[1.02]'
              >
                Send Another Email
              </Button>

              <div className='text-center'>
                <Link
                  to='/auth/login'
                  className='text-sm text-orange-600 hover:text-orange-800 font-medium transition-colors duration-200 hover:underline flex items-center justify-center gap-2'
                >
                  <ArrowLeft className='w-4 h-4' />
                  Back to Sign In
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='h-screen w-full flex items-center justify-center'>
      <Card className='max-w-md w-full shadow-2xl border-0 bg-white/80 backdrop-blur-sm'>
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
            Forgot Password?
          </CardTitle>
          <p className='text-center text-sm text-gray-600'>
            Enter your email address and we&apos;ll send you a link to reset
            your password.
          </p>
        </CardHeader>

        <CardContent className='space-y-4'>
          {error ? (
            <div className='flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm'>
              <AlertCircle className='w-4 h-4 flex-shrink-0' />
              <span>{error}</span>
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className='w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-white hover:bg-gray-50'
                placeholder='Enter your email address'
              />
            </div>

            <Button
              type='submit'
              disabled={isLoading || !email}
              className='w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-2.5 rounded-lg font-semibold transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
            >
              {isLoading ? (
                <div className='flex items-center gap-2'>
                  <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                  Sending Reset Link...
                </div>
              ) : (
                'Send Reset Link'
              )}
            </Button>
          </form>

          <div className='text-center'>
            <Link
              to='/auth/login'
              className='text-sm text-orange-600 hover:text-orange-800 font-medium transition-colors duration-200 hover:underline flex items-center justify-center gap-2'
            >
              <ArrowLeft className='w-4 h-4' />
              Back to Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
