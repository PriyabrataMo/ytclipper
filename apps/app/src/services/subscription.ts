import type { UniversalResponse } from '@/types';
import { api } from './api';

export interface SubscriptionPurchaseRequest {
  plan_type: 'free' | 'monthly' | 'quarterly' | 'annual';
  payment_method?: string;
  coupon_code?: string;
}

export interface SubscriptionPurchaseResponse {
  subscription_id: string;
  status: 'active' | 'pending' | 'failed';
  plan_type: string;
  current_period_end: string;
  payment_url?: string; // For payment gateway redirect
}

export const injectedSubscriptionApi = api.injectEndpoints({
  endpoints: (builder) => ({
    purchaseSubscription: builder.mutation<
      UniversalResponse<SubscriptionPurchaseResponse>,
      SubscriptionPurchaseRequest
    >({
      query: (body) => ({
        url: '/subscription/purchase',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const { usePurchaseSubscriptionMutation } = injectedSubscriptionApi;
