import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  toast,
} from '@ytclipper/ui';
import {
  CheckCircle2,
  CreditCard,
  Crown,
  Shield,
  Star,
  XCircle,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { AddPasswordForm } from '../components/auth/AddPasswordForm';
import LogoutButton from '../components/logout-button';
import { ProfileLoader } from '../components/profile/loaders';
import { useGetCurrentUserQuery, useSendOTPMutation } from '../services/auth';

export const ProfilePage = () => {
  const { data, isLoading, isError } = useGetCurrentUserQuery();
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);
  const navigate = useNavigate();

  const [sendOTP, { isLoading: isSending }] = useSendOTPMutation();

  if (isLoading) {
    return <ProfileLoader />;
  }

  if (!data?.success || isError) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>
            Not Authenticated
          </h1>
          <Link
            to='/auth/login'
            className='text-orange-600 hover:text-orange-800 underline'
          >
            Please login to view your profile
          </Link>
        </div>
      </div>
    );
  }

  const user = data.data.user;

  // Mock subscription data - replace with actual API call
  const subscription = {
    plan: 'free', // 'free', 'monthly', 'quarterly', 'annual'
    status: 'active', // 'active', 'cancelled', 'expired'
    validUntil: '2024-12-31',
    features: {
      videos: 5,
      notesPerVideo: 8,
      aiSummaries: true,
      customTags: true,
      export: false,
      analytics: false,
      apiAccess: false,
    },
  };

  const planDetails = {
    free: {
      name: 'Starter (Free)',
      price: '$0',
      features: [
        'Up to 5 videos',
        '8 notes per video',
        'Basic AI summaries',
        'Standard support',
        'Basic tag management',
      ],
      icon: Shield,
      color: 'text-gray-600',
    },
    monthly: {
      name: 'Monthly Pro',
      price: '$9.99',
      features: [
        'Unlimited videos',
        'Unlimited notes per video',
        'Advanced AI summaries & insights',
        'Custom tags & categories',
        'Export to multiple formats',
        'Advanced analytics',
        'API access',
      ],
      icon: Zap,
      color: 'text-orange-600',
    },
    quarterly: {
      name: 'Quarterly Pro',
      price: '$24.99',
      features: [
        'Unlimited videos',
        'Unlimited notes per video',
        'Advanced AI summaries & insights',
        'Custom tags & categories',
        'Export to multiple formats',
        'Advanced analytics',
        'API access',
      ],
      icon: Star,
      color: 'text-orange-600',
    },
    annual: {
      name: 'Annual Pro',
      price: '$79.99',
      features: [
        'Unlimited videos',
        'Unlimited notes per video',
        'Advanced AI summaries & insights',
        'Custom tags & categories',
        'Export to multiple formats',
        'Advanced analytics',
        'API access',
      ],
      icon: Crown,
      color: 'text-orange-600',
    },
  };

  const currentPlan =
    planDetails[subscription.plan as keyof typeof planDetails];

  const handleAddPasswordSuccess = () => {
    setShowAddPassword(false);
    // User data will be automatically refreshed via React Query
  };

  const handleUnsubscribe = async () => {
    setIsUnsubscribing(true);
    try {
      // TODO: Implement unsubscribe API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      // Show success message
    } catch {
      // Show error message
    } finally {
      setIsUnsubscribing(false);
    }
  };

  const handleSendOTP = async () => {
    try {
      await sendOTP({}).unwrap();
      toast.success('Verification code sent to your email');
      navigate('/email-verification');
    } catch {
      toast.error('Failed to send verification code');
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 py-8'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>Profile</h1>
          <div className='flex space-x-4'>
            <Link
              to='/dashboard'
              className='bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all duration-200'
            >
              Back to Dashboard
            </Link>
            <LogoutButton />
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* User Information Card */}
          <div className='lg:col-span-2 space-y-6'>
            <Card className='shadow-lg border-0 bg-white/80 backdrop-blur-sm'>
              <CardHeader>
                <CardTitle className='text-xl font-bold text-gray-900 flex items-center gap-2'>
                  <Shield className='w-5 h-5 text-orange-600' />
                  User Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {user.picture ? (
                    <div className='flex justify-center lg:justify-start'>
                      <img
                        src={user.picture}
                        alt={user.name}
                        className='w-20 h-20 rounded-full border-2 border-orange-200'
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
                      <div className='mt-1 flex items-center gap-2'>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
                            user.email_verified
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {user.email_verified ? (
                            <>
                              <CheckCircle2 className='w-3 h-3' />
                              Verified
                            </>
                          ) : (
                            <>
                              <XCircle className='w-3 h-3' />
                              Not Verified
                            </>
                          )}
                        </span>
                        {!user.email_verified && !user.google_id && (
                          <Button
                            onClick={handleSendOTP}
                            disabled={isSending}
                            size='sm'
                            className='bg-orange-600 hover:bg-orange-700 text-white'
                          >
                            Verify Email
                          </Button>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className='block text-sm font-medium text-gray-700'>
                        Primary Provider
                      </span>
                      <p className='mt-1 text-sm text-gray-900 capitalize'>
                        {user.provider}
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
              </CardContent>
            </Card>

            {/* Subscription Plan Card */}
            <Card className='shadow-lg border-0 bg-white/80 backdrop-blur-sm'>
              <CardHeader>
                <CardTitle className='text-xl font-bold text-gray-900 flex items-center gap-2'>
                  <CreditCard className='w-5 h-5 text-orange-600' />
                  Subscription Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200'>
                    <div className='flex items-center gap-3'>
                      <currentPlan.icon
                        className={`w-6 h-6 ${currentPlan.color}`}
                      />
                      <div>
                        <h3 className='font-semibold text-gray-900'>
                          {currentPlan.name}
                        </h3>
                        <p className='text-sm text-gray-600'>
                          {currentPlan.price}/month
                        </p>
                      </div>
                    </div>
                    <div className='text-right'>
                      <p className='text-sm text-gray-600'>Valid until</p>
                      <p className='font-semibold text-gray-900'>
                        {new Date(subscription.validUntil).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <h4 className='font-medium text-gray-900'>
                      Plan Features:
                    </h4>
                    <ul className='space-y-1'>
                      {currentPlan.features.map((feature) => (
                        <li
                          key={feature}
                          className='flex items-center gap-2 text-sm text-gray-700'
                        >
                          <CheckCircle2 className='w-4 h-4 text-green-500' />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {subscription.plan === 'free' ? (
                    <div className='p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200'>
                      <div className='flex items-center gap-3 mb-3'>
                        <Crown className='w-5 h-5 text-orange-600' />
                        <h4 className='font-semibold text-gray-900'>
                          Upgrade to Pro
                        </h4>
                      </div>
                      <p className='text-sm text-gray-600 mb-3'>
                        Unlock unlimited videos, advanced AI features, and more
                        with our Pro plans.
                      </p>
                      <Link
                        to='/pricing'
                        className='inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200'
                      >
                        View Plans
                      </Link>
                    </div>
                  ) : (
                    <div className='space-y-3'>
                      <Button
                        onClick={handleUnsubscribe}
                        disabled={isUnsubscribing}
                        variant='outline'
                        className='w-full border-red-300 text-red-600 hover:bg-red-50'
                      >
                        {isUnsubscribing
                          ? 'Processing...'
                          : 'Cancel Subscription'}
                      </Button>
                      <p className='text-xs text-gray-500 text-center'>
                        Your subscription will remain active until the end of
                        the current billing period.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Authentication Methods Card */}
          <div className='lg:col-span-1'>
            <Card className='shadow-lg border-0 bg-white/80 backdrop-blur-sm'>
              <CardHeader>
                <CardTitle className='text-xl font-bold text-gray-900 flex items-center gap-2'>
                  <Shield className='w-5 h-5 text-orange-600' />
                  Authentication Methods
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
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
                      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
                        data.data.auth_methods.includes('google')
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {data.data.auth_methods.includes('google') ? (
                        <>
                          <CheckCircle2 className='w-3 h-3' />
                          Connected
                        </>
                      ) : (
                        <>
                          <XCircle className='w-3 h-3' />
                          Not Connected
                        </>
                      )}
                    </span>
                  </div>

                  <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
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
                      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
                        data.data.auth_methods.includes('password')
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {data.data.auth_methods.includes('password') ? (
                        <>
                          <CheckCircle2 className='w-3 h-3' />
                          Set
                        </>
                      ) : (
                        <>
                          <XCircle className='w-3 h-3' />
                          Not Set
                        </>
                      )}
                    </span>
                  </div>

                  {!data.data.auth_methods.includes('password') && (
                    <div className='pt-4 border-t border-gray-200'>
                      <Button
                        onClick={() => setShowAddPassword(true)}
                        className='w-full bg-orange-600 hover:bg-orange-700 text-white'
                      >
                        Add Password Authentication
                      </Button>
                      <p className='text-xs text-gray-500 mt-2 text-center'>
                        Add a password to login with email and password
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {showAddPassword ? (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
            <div className='bg-white rounded-lg max-w-md w-full shadow-2xl'>
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
