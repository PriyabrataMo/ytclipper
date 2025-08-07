import { useGetUserProfileQuery } from '@/services/profile';

export function useProfile() {
  const { data, isLoading, error, refetch } = useGetUserProfileQuery();

  const profile = data?.data;
  const isFreePlan = profile?.subscription.plan_type === 'free';
  const isPaidPlan = profile?.subscription.plan_type !== 'free';
  const isExpired = profile?.subscription.is_expired || false;
  const isExceeded = profile?.usage.is_exceeded || false;

  // Feature access helpers
  const canAddVideos = profile?.feature_access.can_add_videos ?? true;
  const canAddNotes = profile?.feature_access.can_add_notes ?? true;
  const canGenerateSummaries =
    profile?.feature_access.can_generate_summaries ?? true;
  const canUseAIFeatures = profile?.feature_access.can_use_ai_features ?? true;

  // Usage information
  const getUsagePercentage = (feature: string) => {
    return profile?.usage.usage_percentages[feature] || 0;
  };

  const getUsageLimit = (feature: string) => {
    return profile?.usage.plan_limits[feature] || 0;
  };

  const getCurrentUsage = (feature: string) => {
    return profile?.usage.current_usage[feature]?.current_usage || 0;
  };

  // Plan information
  const getPlanName = () => {
    if (!profile) {
      return 'Free';
    }

    switch (profile.subscription.plan_type) {
      case 'free':
        return 'Free';
      case 'monthly':
        return 'Monthly Pro';
      case 'quarterly':
        return 'Quarterly Pro';
      case 'annual':
        return 'Annual Pro';
      default:
        return 'Free';
    }
  };

  const getPlanLimits = () => {
    if (!profile) {
      return {};
    }
    return profile.usage.plan_limits;
  };

  // Subscription status
  const getSubscriptionStatus = () => {
    if (!profile) {
      return 'unknown';
    }

    if (isExpired) {
      return 'expired';
    }
    if (isExceeded && isFreePlan) {
      return 'limit_exceeded';
    }
    return profile.subscription.status;
  };

  return {
    // Data
    profile,
    isLoading,
    error,
    refetch,

    // Plan status
    isFreePlan,
    isPaidPlan,
    isExpired,
    isExceeded,
    getPlanName,
    getPlanLimits,
    getSubscriptionStatus,

    // Feature access
    canAddVideos,
    canAddNotes,
    canGenerateSummaries,
    canUseAIFeatures,

    // Usage helpers
    getUsagePercentage,
    getUsageLimit,
    getCurrentUsage,
  };
}

// Hook for checking if a specific feature is available
export function useFeatureAccess(
  feature: 'videos' | 'notes' | 'summaries' | 'ai',
) {
  const { canAddVideos, canAddNotes, canGenerateSummaries, canUseAIFeatures } =
    useProfile();

  switch (feature) {
    case 'videos':
      return canAddVideos;
    case 'notes':
      return canAddNotes;
    case 'summaries':
      return canGenerateSummaries;
    case 'ai':
      return canUseAIFeatures;
    default:
      return true;
  }
}

// Hook for getting usage information for a specific feature
export function useFeatureUsage(feature: string) {
  const { getUsagePercentage, getUsageLimit, getCurrentUsage, isFreePlan } =
    useProfile();

  return {
    currentUsage: getCurrentUsage(feature),
    limit: getUsageLimit(feature),
    percentage: getUsagePercentage(feature),
    isFreePlan,
    isUnlimited: !isFreePlan || getUsageLimit(feature) === -1,
  };
}
