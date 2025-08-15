import type { UniversalResponse } from '@/types';
import { api } from './api';

export interface Timestamp {
  id: string;
  video_id: string;
  user_id: string;
  timestamp: number;
  title: string;
  note: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTimestampRequest {
  video_id: string;
  timestamp: number;
  title?: string;
  note?: string;
  tags?: string[];
}

export interface UpdateTimestampRequest {
  title?: string;
  note?: string;
  tags?: string[];
}

export interface GetTimestampsResponse {
  timestamps: Timestamp[];
  video_id: string;
  count: number;
}

export interface DeleteTimestampResponse {
  message: string;
  timestamp_id: string;
  user_id: string;
}

export interface GetAllTagsResponse {
  tags: Tag[];
  count: number;
}

export interface SearchTagsRequest {
  query: string;
  limit?: number;
}

export interface SearchTagsResponse {
  tags: Tag[];
  count: number;
}

export interface SearchTimestampsRequest {
  query: string;
  video_id?: string;
  limit?: number;
}

export interface GetVideoSummary {
  video_id: string;
  summary: string;
  cached: boolean;
  generated_at: string;
}

export interface SearchTimestampsResponse {
  timestamps: Timestamp[];
  count: number;
}

export interface GenerateFullVideoSummaryRequest {
  video_id: string;
  refresh?: boolean;
}

export interface GenerateFullVideoSummaryResponse {
  summary: string;
  video_id: string;
  video_title: string;
  note_count: number;
  generated_at: string;
  cached: boolean;
}

export interface AnswerQuestionRequest {
  question: string;
  video_id?: string;
  context?: number;
}

export interface AnswerQuestionResponse {
  answer: string;
  question: string;
  video_id?: string;
  relevant_notes: Timestamp[];
  generated_at: string;
}

export const injectedTimestampsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createTimestamp: builder.mutation<Timestamp, CreateTimestampRequest>({
      query: (data) => ({
        url: '/timestamps',
        method: 'POST',
        body: JSON.stringify(data),
      }),
    }),
    getTimestamps: builder.query<
      UniversalResponse<GetTimestampsResponse>,
      string
    >({
      query: (videoId) => `/timestamps/${videoId}`,
    }),
    getAllTimestamps: builder.query<
      UniversalResponse<{ timestamps: Timestamp[]; count: number }>,
      void
    >({
      query: () => '/timestamps',
    }),
    updateTimestamp: builder.mutation<
      Timestamp,
      { id: string; data: UpdateTimestampRequest }
    >({
      query: ({ id, data }) => ({
        url: `/timestamps/${id}`,
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    }),
    deleteTimestamp: builder.mutation<DeleteTimestampResponse, string>({
      query: (timestampId) => ({
        url: `/timestamps/${timestampId}`,
        method: 'DELETE',
      }),
    }),
    deleteMultipleTimestamps: builder.mutation<{ message: string }, string[]>({
      query: (ids) => ({
        url: '/timestamps',
        method: 'DELETE',
        body: JSON.stringify({ ids }),
      }),
    }),

    // Tag Management
    getAllTags: builder.query<
      UniversalResponse<GetAllTagsResponse>,
      { limit?: number }
    >({
      query: ({ limit = 100 }) => `/timestamps/tags?limit=${limit}`,
    }),
    searchTags: builder.mutation<
      UniversalResponse<SearchTagsResponse>,
      SearchTagsRequest
    >({
      query: (data) => ({
        url: '/timestamps/tags/search',
        method: 'POST',
        body: JSON.stringify(data),
      }),
    }),

    // Search
    searchTimestamps: builder.mutation<
      UniversalResponse<SearchTimestampsResponse>,
      SearchTimestampsRequest
    >({
      query: (data) => ({
        url: '/timestamps/search',
        method: 'POST',
        body: JSON.stringify(data),
      }),
    }),

    // AI Features
    generateFullVideoSummary: builder.mutation<
      UniversalResponse<GenerateFullVideoSummaryResponse>,
      GenerateFullVideoSummaryRequest
    >({
      query: (data) => ({
        url: '/timestamps/full-summary',
        method: 'POST',
        body: JSON.stringify(data),
      }),
    }),
    getVideoSummary: builder.query<UniversalResponse<GetVideoSummary>, string>({
      query: (videoId) => `/timestamps/summary/${videoId}`,
    }),

    answerQuestion: builder.mutation<
      UniversalResponse<AnswerQuestionResponse>,
      AnswerQuestionRequest
    >({
      query: (data) => ({
        url: '/timestamps/question',
        method: 'POST',
        body: JSON.stringify(data),
      }),
    }),
  }),
});

export const {
  useCreateTimestampMutation,
  useGetTimestampsQuery,
  useGetAllTimestampsQuery,
  useUpdateTimestampMutation,
  useDeleteTimestampMutation,
  useDeleteMultipleTimestampsMutation,
  useGetAllTagsQuery,
  useSearchTagsMutation,
  useSearchTimestampsMutation,
  useGenerateFullVideoSummaryMutation,
  useAnswerQuestionMutation,
  useGetVideoSummaryQuery,
} = injectedTimestampsApi;
