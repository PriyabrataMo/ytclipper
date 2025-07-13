import { authApi } from '@/services';
import { QueryClient } from '@tanstack/react-query';

// Create query client with optimized settings
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: (failureCount, error) => {
        // Don't retry on 401 errors (authentication issues)
        if (error instanceof Error && error.message.includes('401')) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false,
    },
  },
});

// Query keys factory
export const queryKeys = {
  auth: {
    user: ['auth', 'user'] as const,
    profile: ['auth', 'profile'] as const,
  },
  videos: {
    all: ['videos'] as const,
    list: (filters?: Record<string, unknown>) =>
      ['videos', 'list', filters] as const,
    detail: (id: string) => ['videos', 'detail', id] as const,
  },
  timestamps: {
    all: ['timestamps'] as const,
    byVideo: (videoId: string) => ['timestamps', 'video', videoId] as const,
  },
} as const;

export const authQueries = {
  user: () => ({
    queryKey: queryKeys.auth.user,
    queryFn: () => authApi.getCurrentUser(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  }),
  profile: () => ({
    queryKey: queryKeys.auth.profile,
    queryFn: () => authApi.getCurrentUser(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  }),
};

queryClient.setMutationDefaults(['auth'], {
  onError: error => {
    console.error('Auth mutation error:', error);
  },
});

export const invalidateAuthQueries = () => {
  queryClient.invalidateQueries({ queryKey: queryKeys.auth.user });
  queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile });
};

export const clearAuthQueries = () => {
  queryClient.removeQueries({ queryKey: queryKeys.auth.user });
  queryClient.removeQueries({ queryKey: queryKeys.auth.profile });
};
