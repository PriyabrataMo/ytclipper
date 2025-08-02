import { useSendOTPMutation, useVerifyOTPMutation } from '@/services/auth';
import { setUser } from '@/store/slices/authSlice';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
  toast,
} from '@ytclipper/ui';
import { ArrowLeft, Mail } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';

export function EmailVerificationPage() {
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [sendOTP, { isLoading: isSending }] = useSendOTPMutation();
  const [verifyOTP, { isLoading: isVerifying }] = useVerifyOTPMutation();

  // Timer effect
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [resendTimer]);

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error('Please enter a 6-digit verification code');
      return;
    }

    try {
      const result = await verifyOTP({ otp }).unwrap();
      dispatch(setUser(result.data.user));
      toast.success('Email verified successfully!');
      navigate('/profile');
    } catch {
      toast.error('Invalid verification code. Please try again.');
    }
  };

  const handleResendOTP = async () => {
    try {
      await sendOTP({}).unwrap();
      toast.success('New verification code sent to your email');
      setResendTimer(60);
    } catch {
      toast.error('Failed to send verification code');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className='fixed inset-0 flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-100 overflow-hidden'>
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute -top-40 -right-40 w-80 h-80 bg-orange-400/10 rounded-full blur-3xl' />
        <div className='absolute -bottom-40 -left-40 w-80 h-80 bg-orange-400/10 rounded-full blur-3xl' />
        <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-400/5 rounded-full blur-3xl' />
      </div>

      <div className='relative z-10 w-full max-w-md mx-4'>
        <Card className='w-full shadow-2xl border-0 bg-white/80 backdrop-blur-sm'>
          <CardHeader className='space-y-2 pb-4'>
            <div className='flex justify-center mb-3'>
              <div className='w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center'>
                <Mail className='w-6 h-6 text-white' />
              </div>
            </div>
            <CardTitle className='text-center text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent'>
              Verify Your Email
            </CardTitle>
            <p className='text-center text-sm text-gray-600'>
              Enter the 6-digit code sent to your email
            </p>
          </CardHeader>

          <CardContent className='space-y-6'>
            <div className='flex justify-center'>
              <InputOTP
                value={otp}
                onChange={(value) => setOtp(value)}
                maxLength={6}
              >
                <InputOTPGroup>
                  <InputOTPSlot
                    index={0}
                    className='w-12 h-12 text-lg font-semibold border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:ring-orange-500'
                  />
                  <InputOTPSlot
                    index={1}
                    className='w-12 h-12 text-lg font-semibold border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:ring-orange-500'
                  />
                  <InputOTPSlot
                    index={2}
                    className='w-12 h-12 text-lg font-semibold border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:ring-orange-500'
                  />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot
                    index={3}
                    className='w-12 h-12 text-lg font-semibold border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:ring-orange-500'
                  />
                  <InputOTPSlot
                    index={4}
                    className='w-12 h-12 text-lg font-semibold border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:ring-orange-500'
                  />
                  <InputOTPSlot
                    index={5}
                    className='w-12 h-12 text-lg font-semibold border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:ring-orange-500'
                  />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button
              onClick={handleVerifyOTP}
              disabled={otp.length !== 6 || isVerifying}
              className='w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-2.5 rounded-lg font-semibold transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
            >
              {isVerifying ? (
                <div className='flex items-center gap-2'>
                  <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                  Verifying...
                </div>
              ) : (
                'Verify Email'
              )}
            </Button>

            <div className='text-center'>
              <Button
                variant='ghost'
                size='sm'
                onClick={handleResendOTP}
                disabled={isSending || resendTimer > 0}
                className='text-orange-600 hover:text-orange-800 font-medium transition-colors duration-200 hover:underline disabled:text-gray-400 disabled:cursor-not-allowed'
              >
                {isSending
                  ? 'Sending...'
                  : resendTimer > 0
                    ? `Resend in ${formatTime(resendTimer)}`
                    : "Didn't receive the code? Resend"}
              </Button>
            </div>

            <div className='text-center'>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => navigate('/profile')}
                className='text-orange-600 hover:text-orange-800 font-medium transition-colors duration-200 hover:underline'
              >
                <ArrowLeft className='w-4 h-4 mr-2' />
                Back to Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
