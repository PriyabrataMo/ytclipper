import config from '@/config';
import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';

const API_URL = config.apiUrl;

const baseQuery = fetchBaseQuery({
  baseUrl: `${API_URL}/api/v1`,
  credentials: 'include',
  prepareHeaders: (headers, { getState: _getState }) => {
    // For now, we'll handle auth differently since we don't have a token field
    // The backend should handle session-based auth with credentials: 'include'
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, apiCall, extraOptions) => {
  const result = await baseQuery(args, apiCall, extraOptions);

  if (result.error && result.error.status === 401) {
    console.warn('🔄 Unauthorized request, redirecting to login');
    try {
      apiCall.dispatch({ type: 'auth/logout' });
      if (typeof window !== 'undefined') {
        window.location.href = '/auth';
      }
    } catch (error) {
      console.error('❌ Auth redirect failed:', error);
      return result;
    }
  }

  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  endpoints: () => ({}),
});
