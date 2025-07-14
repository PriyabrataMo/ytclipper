import { useAuth } from '@/hooks/useAuth';
import { useAppDispatch } from '@/store/hooks';
import {
  handleAuthCallback,
  resetCallbackHandled,
} from '@/store/slices/authSlice';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import Loading from './loading';

export const AuthCallback = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, callbackHandled } = useAuth();
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isCallbackRoute = window.location.pathname === '/auth/callback';
    const hasAuthSuccess = urlParams.get('auth') === 'success';

    console.log('🔍 isCallbackRoute:', isCallbackRoute);
    console.log('🔍 hasAuthSuccess:', hasAuthSuccess);

    if (isCallbackRoute || hasAuthSuccess) {
      dispatch(handleAuthCallback());
      if (hasAuthSuccess) {
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
      }
    } else {
      navigate('/auth', { replace: true });
    }
  }, [dispatch, navigate]);

  useEffect(() => {
    if (callbackHandled) {
      if (isAuthenticated) {
        navigate('/', { replace: true });
      } else {
        navigate('/auth', { replace: true });
      }
      dispatch(resetCallbackHandled());
    }
  }, [callbackHandled, isAuthenticated, dispatch, navigate]);

  return (
    <div className='flex items-center justify-center min-h-screen'>
      <div className='text-center'>
        <Loading />
        <p className='mt-4 text-gray-600'>Completing authentication...</p>
      </div>
    </div>
  );
};
