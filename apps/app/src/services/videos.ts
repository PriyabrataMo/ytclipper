import { store } from '@/store';
import {
  selectVideoHasMetadata,
  setVideos,
  updateVideoMetadata,
} from '@/store/slices/videoSlice';
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

export const needsMetadataUpdate = (videoId: string): boolean => {
  const state = store.getState();
  return !selectVideoHasMetadata(state, videoId);
};

export const injectedVideosApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getUserVideos: builder.query<
      UniversalResponse<GetUserVideosResponse>,
      void
    >({
      query: () => '/ytclipper/videos',
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
    updateVideoMetadata: builder.mutation<
      UniversalResponse<{ message: string }>,
      UpdateVideoMetadataRequest
    >({
      query: (body) => ({
        url: '/ytclipper/videos/metadata',
        method: 'PUT',
        body,
      }),
      async onQueryStarted(
        { video_id, title, youtube_url },
        { dispatch, queryFulfilled },
      ) {
        try {
          await queryFulfilled;
          dispatch(
            updateVideoMetadata({
              videoId: video_id,
              title,
              youtubeUrl: youtube_url,
            }),
          );
        } catch (error) {
          console.error('Failed to update video metadata:', error);
        }
      },
    }),
    updateWatchedDuration: builder.mutation<
      UniversalResponse<{ message: string; watched_duration: number }>,
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
} = injectedVideosApi;
