import { clearAuthQueries, invalidateAuthQueries } from '@/lib/react-query';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  addPassword,
  clearError,
  forgotPassword,
  handleAuthCallback,
  initializeAuth,
  loginWithEmailPassword,
  loginWithGoogle,
  logout,
  registerWithEmailPassword,
  resetPassword,
  verifyEmail,
} from '@/store/slices/authSlice';
import { addNotification } from '@/store/slices/uiSlice';
import type { User } from '@/types';
import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';

export function useAuth() {
  const dispatch = useAppDispatch();

  const {
    user,
    isAuthenticated,
    isLoading: authLoading,
    error: authError,
    isInitialized,
  } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!isInitialized) {
      dispatch(initializeAuth());
    }
  }, [dispatch, isInitialized]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auth') === 'success') {
      dispatch(handleAuthCallback());
    }
  }, [dispatch]);

  const isLoading = authLoading;

  const googleLoginMutation = useMutation({
    mutationFn: () => dispatch(loginWithGoogle()).unwrap(),
    onSuccess: () => {
      dispatch(
        addNotification({
          type: 'info',
          title: 'Redirecting to Google',
          message: 'Please complete authentication with Google',
        }),
      );
    },
    onError: (error: Error) => {
      dispatch(
        addNotification({
          type: 'error',
          title: 'Login Failed',
          message: error.message,
        }),
      );
    },
  });

  const emailPasswordLoginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      dispatch(loginWithEmailPassword({ email, password })).unwrap(),
    onSuccess: (user: User) => {
      invalidateAuthQueries();
      dispatch(
        addNotification({
          type: 'success',
          title: 'Login Successful',
          message: `Welcome back, ${user.name}!`,
        }),
      );
    },
    onError: (error: Error) => {
      dispatch(
        addNotification({
          type: 'error',
          title: 'Login Failed',
          message: error.message,
        }),
      );
    },
  });

  const registerMutation = useMutation({
    mutationFn: ({
      name,
      email,
      password,
    }: {
      name: string;
      email: string;
      password: string;
    }) =>
      dispatch(registerWithEmailPassword({ name, email, password })).unwrap(),
    onSuccess: (user: User) => {
      invalidateAuthQueries();
      dispatch(
        addNotification({
          type: 'success',
          title: 'Registration Successful',
          message: `Welcome, ${user.name}! Please check your email to verify your account.`,
        }),
      );
    },
    onError: (error: Error) => {
      dispatch(
        addNotification({
          type: 'error',
          title: 'Registration Failed',
          message: error.message,
        }),
      );
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => dispatch(logout()).unwrap(),
    onSuccess: () => {
      clearAuthQueries();
      dispatch(
        addNotification({
          type: 'success',
          title: 'Logged Out',
          message: 'You have been successfully logged out',
        }),
      );
    },
    onError: (error: Error) => {
      dispatch(
        addNotification({
          type: 'error',
          title: 'Logout Failed',
          message: error.message,
        }),
      );
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: ({ email }: { email: string }) =>
      dispatch(forgotPassword({ email })).unwrap(),
    onSuccess: () => {
      dispatch(
        addNotification({
          type: 'success',
          title: 'Reset Email Sent',
          message: 'Please check your email for password reset instructions',
        }),
      );
    },
    onError: (error: Error) => {
      dispatch(
        addNotification({
          type: 'error',
          title: 'Reset Failed',
          message: error.message,
        }),
      );
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      dispatch(resetPassword({ token, password })).unwrap(),
    onSuccess: () => {
      dispatch(
        addNotification({
          type: 'success',
          title: 'Password Reset',
          message: 'Your password has been successfully reset',
        }),
      );
    },
    onError: (error: Error) => {
      dispatch(
        addNotification({
          type: 'error',
          title: 'Reset Failed',
          message: error.message,
        }),
      );
    },
  });

  const verifyEmailMutation = useMutation({
    mutationFn: ({ token }: { token: string }) =>
      dispatch(verifyEmail({ token })).unwrap(),
    onSuccess: () => {
      dispatch(
        addNotification({
          type: 'success',
          title: 'Email Verified',
          message: 'Your email has been successfully verified',
        }),
      );
    },
    onError: (error: Error) => {
      dispatch(
        addNotification({
          type: 'error',
          title: 'Verification Failed',
          message: error.message,
        }),
      );
    },
  });

  const addPasswordMutation = useMutation({
    mutationFn: ({ password }: { password: string }) =>
      dispatch(addPassword({ password })).unwrap(),
    onSuccess: () => {
      invalidateAuthQueries();
      dispatch(
        addNotification({
          type: 'success',
          title: 'Password Added',
          message: 'Password authentication has been added to your account',
        }),
      );
    },
    onError: (error: Error) => {
      dispatch(
        addNotification({
          type: 'error',
          title: 'Failed to Add Password',
          message: error.message,
        }),
      );
    },
  });

  return {
    user,
    isAuthenticated,
    isLoading,
    error: authError,
    isInitialized,

    loginWithGoogle: googleLoginMutation.mutate,
    loginWithEmailPassword: emailPasswordLoginMutation.mutate,
    register: registerMutation.mutate,
    addPassword: addPasswordMutation.mutate,
    logout: logoutMutation.mutate,
    forgotPassword: forgotPasswordMutation.mutate,
    resetPassword: resetPasswordMutation.mutate,
    verifyEmail: verifyEmailMutation.mutate,
    clearError: () => dispatch(clearError()),

    isLoggingIn:
      googleLoginMutation.isPending || emailPasswordLoginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isAddingPassword: addPasswordMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isForgettingPassword: forgotPasswordMutation.isPending,
    isResettingPassword: resetPasswordMutation.isPending,
    isVerifyingEmail: verifyEmailMutation.isPending,
  };
}
