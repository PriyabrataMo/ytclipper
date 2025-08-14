import { store } from '@/store';
import { selectVideoHasMetadata, setVideos } from '@/store/slices/videoSlice';
import type { UniversalResponse } from '@/types';
import { api } from './api';

export interface VideoSummary {
  video_id: string;
  youtube_url: string;
  title: string;
  thumbnail_url?: string;
  channel_id?: string;
  channel_title?: string;
  duration?: number;
  published_at?: string;
  view_count?: number;
  like_count?: number;
  comment_count?: number;
  ai_summary?: string;
  watched_duration?: number;
  count: number;
  latest_timestamp?: string;
  created_at: string;
  deleted_at?: string;
}

export interface GetUserVideosResponse {
  videos: VideoSummary[];
}

export interface UpdateVideoMetadataRequest {
  video_id: string;
  youtube_url: string;
  title: string;
  duration?: number;
  thumbnail_url?: string;
  channel_title?: string;
}

export interface UpdateWatchedDurationRequest {
  watched_duration: number;
}

export interface VideoFilters {
  search?: string;
  status?: 'all' | 'active' | 'deleted';
  sortBy?: 'created_at' | 'title' | 'duration' | 'count' | 'watched_duration';
  sortOrder?: 'asc' | 'desc';
  durationRange?: 'all' | 'short' | 'medium' | 'long';
  progressRange?: 'all' | 'not_started' | 'in_progress' | 'completed';
}

export const needsMetadataUpdate = (videoId: string): boolean => {
  const state = store.getState();
  return !selectVideoHasMetadata(state, videoId);
};

export const injectedVideosApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getUserVideos: builder.query<
      UniversalResponse<GetUserVideosResponse>,
      VideoFilters | void
    >({
      query: (filters) => {
        if (!filters) {
          return '/ytclipper/videos';
        }

        const params = new URLSearchParams();
        if (filters.search) {
          params.append('search', filters.search);
        }
        if (filters.status && filters.status !== 'all') {
          params.append('status', filters.status);
        }
        if (filters.sortBy && filters.sortBy !== 'created_at') {
          params.append('sortBy', filters.sortBy);
        }
        if (filters.sortOrder && filters.sortOrder !== 'desc') {
          params.append('sortOrder', filters.sortOrder);
        }
        if (filters.durationRange && filters.durationRange !== 'all') {
          params.append('durationRange', filters.durationRange);
        }
        if (filters.progressRange && filters.progressRange !== 'all') {
          params.append('progressRange', filters.progressRange);
        }

        const queryString = params.toString();
        return queryString
          ? `/ytclipper/videos?${queryString}`
          : '/ytclipper/videos';
      },
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.success && data.data?.videos) {
            dispatch(setVideos(data.data.videos));
          }
        } catch (error) {
          console.error('Failed to fetch videos:', error);
        }
      },
    }),
    softDeleteVideo: builder.mutation<
      UniversalResponse<{ message: string }>,
      { videoId: string }
    >({
      query: ({ videoId }) => ({
        url: `/ytclipper/videos/${videoId}`,
        method: 'DELETE',
      }),
    }),
    hardDeleteVideo: builder.mutation<
      UniversalResponse<{ message: string }>,
      { videoId: string }
    >({
      query: ({ videoId }) => ({
        url: `/ytclipper/videos/${videoId}/hard`,
        method: 'DELETE',
      }),
    }),
    restoreVideo: builder.mutation<
      UniversalResponse<{ message: string }>,
      { videoId: string }
    >({
      query: ({ videoId }) => ({
        url: `/ytclipper/videos/${videoId}/restore`,
        method: 'PUT',
      }),
    }),
    updateVideoMetadata: builder.mutation<
      UniversalResponse<{ message: string }>,
      UpdateVideoMetadataRequest
    >({
      query: (data) => ({
        url: '/ytclipper/videos/metadata',
        method: 'PUT',
        body: data,
      }),
    }),
    updateWatchedDuration: builder.mutation<
      UniversalResponse<{ message: string }>,
      { videoId: string; data: UpdateWatchedDurationRequest }
    >({
      query: ({ videoId, data }) => ({
        url: `/ytclipper/videos/${videoId}/watched-duration`,
        method: 'PUT',
        body: data,
      }),
    }),
  }),
});

export const {
  useGetUserVideosQuery,
  useUpdateVideoMetadataMutation,
  useUpdateWatchedDurationMutation,
  useSoftDeleteVideoMutation,
  useHardDeleteVideoMutation,
  useRestoreVideoMutation,
} = injectedVideosApi;
