import { type UniversalResponse } from '@/types';
import { api } from './api';

export interface DashboardStats {
  total_notes: number;
  videos_watched: number;
  total_watch_time: number; // in seconds
  weekly_activity: number;
}

export interface MostUsedTag {
  name: string;
  count: number;
}

export interface RecentVideo {
  video_id: string;
  title: string;
  thumbnail_url: string;
  duration: number;
  note_count: number;
  latest_timestamp: string;
  watch_progress: number;
}

export interface RecentActivity {
  title: string;
  timestamp: string;
  duration: number;
}

export interface RecentNote {
  id: string;
  title: string;
  video_title: string;
  created_at: string;
  tags: string[];
}

export const injectedDashboardApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query<
      UniversalResponse<{ stats: DashboardStats }>,
      void
    >({
      query: () => '/dashboard/stats',
    }),
    getMostUsedTags: builder.query<{ tags: MostUsedTag[] }, void>({
      query: () => '/dashboard/most-used-tags',
    }),
    getRecentVideos: builder.query<{ videos: RecentVideo[] }, void>({
      query: () => '/dashboard/recent-videos',
    }),
    getRecentActivity: builder.query<{ activities: RecentActivity[] }, void>({
      query: () => '/dashboard/recent-activity',
    }),
    getRecentNotes: builder.query<{ notes: RecentNote[] }, void>({
      query: () => '/dashboard/recent-notes',
    }),
  }),
});

export const {
  useGetDashboardStatsQuery,
  useGetMostUsedTagsQuery,
  useGetRecentVideosQuery,
  useGetRecentActivityQuery,
  useGetRecentNotesQuery,
} = injectedDashboardApi;
