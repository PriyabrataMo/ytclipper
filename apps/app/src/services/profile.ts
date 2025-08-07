import type { UniversalResponse } from '@/types';
import { api } from './api';

export interface UserProfile {
  user: {
    id: string;
    email: string;
    name: string;
    picture?: string;
  };
  subscription: {
    plan_type: 'free' | 'monthly' | 'quarterly' | 'annual';
    status: 'active' | 'cancelled' | 'expired' | 'past_due' | 'pending';
    is_expired: boolean;
    current_period_end?: string;
    cancel_at_period_end: boolean;
    payment_provider?: string;
  };
  usage: {
    current_usage: Record<
      string,
      {
        feature_name: string;
        current_usage: number;
        usage_limit: number;
        reset_date?: string;
      }
    >;
    plan_limits: Record<string, number>;
    usage_percentages: Record<string, number>;
    is_exceeded: boolean;
  };
  feature_access: {
    can_add_videos: boolean;
    can_add_notes: boolean;
    can_generate_summaries: boolean;
    can_use_ai_features: boolean;
  };
}

export interface ProfileResponse {
  data: UserProfile;
}

export const injectedProfileApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getUserProfile: builder.query<UniversalResponse<UserProfile>, void>({
      query: () => ({
        url: '/subscription/profile',
        method: 'GET',
      }),
    }),
  }),
});

export const { useGetUserProfileQuery } = injectedProfileApi;
