import {
  loginFailure,
  loginStart,
  loginSuccess,
  logout as logoutAction,
} from '@/store/slices/authSlice';
import { api } from './api';

import type { AuthMeResponse, UniversalResponse, User } from '@/types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface AddPasswordRequest {
  password: string;
}

export type SendOTPRequest = Record<string, never>;

export interface VerifyOTPRequest {
  otp: string;
}

export type GoogleLoginResponse = UniversalResponse<{
  auth_url: string;
}>;

export const injectedAuthApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<UniversalResponse<User>, LoginRequest>({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        dispatch(loginStart());
        try {
          const { data } = await queryFulfilled;
          dispatch(loginSuccess({ user: data.data }));
        } catch (error) {
          const errorMessage =
            (error as { error?: { data?: { message?: string } } })?.error?.data
              ?.message || 'Login failed';
          dispatch(loginFailure(errorMessage));
        }
      },
    }),

    register: builder.mutation<User, RegisterRequest>({
      query: (body) => ({
        url: '/auth/register',
        method: 'POST',
        body,
      }),
    }),

    getCurrentUser: builder.query<UniversalResponse<AuthMeResponse>, void>({
      query: () => '/auth/me',
    }),

    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(logoutAction());
        } catch {
          // Even if logout fails, we should still clear local state
          dispatch(logoutAction());
        }
      },
    }),

    forgotPassword: builder.mutation<void, ForgotPasswordRequest>({
      query: (body) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body,
      }),
    }),

    resetPassword: builder.mutation<void, ResetPasswordRequest>({
      query: (body) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body,
      }),
    }),

    addPassword: builder.mutation<void, AddPasswordRequest>({
      query: (body) => ({
        url: '/auth/add-password',
        method: 'POST',
        body,
      }),
    }),

    sendOTP: builder.mutation<
      UniversalResponse<{ message: string }>,
      SendOTPRequest
    >({
      query: () => ({
        url: '/auth/send-otp',
        method: 'POST',
      }),
    }),

    verifyOTP: builder.mutation<
      UniversalResponse<{ user: User; message: string }>,
      VerifyOTPRequest
    >({
      query: (body) => ({
        url: '/auth/verify-otp',
        method: 'POST',
        body,
      }),
    }),

    checkLoginStatus: builder.query<boolean, void>({
      query: () => '/auth/status',
    }),

    refreshToken: builder.mutation<User, void>({
      query: () => ({
        url: '/auth/refresh',
        method: 'POST',
      }),
    }),

    getGoogleLoginUrl: builder.query<GoogleLoginResponse, void>({
      query: () => ({
        url: '/auth/google/login',
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Origin: window.location.origin,
        },
      }),
    }),
  }),

  overrideExisting: false,
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetCurrentUserQuery,
  useLazyGetCurrentUserQuery,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useAddPasswordMutation,
  useSendOTPMutation,
  useVerifyOTPMutation,
  useGetGoogleLoginUrlQuery,
  useLazyGetGoogleLoginUrlQuery,
  useCheckLoginStatusQuery,
  useRefreshTokenMutation,
} = injectedAuthApi;
