import { useFeatureAccess } from '@/hooks/use-profile';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@ytclipper/ui';
import { AlertTriangle, Crown, Lock } from 'lucide-react';
import React from 'react';

interface FeatureGateProps {
  feature: 'videos' | 'notes' | 'summaries' | 'ai';
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
}

export function FeatureGate({
  feature,
  children,
  fallback,
  showUpgradePrompt = true,
}: FeatureGateProps) {
  const hasAccess = useFeatureAccess(feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgradePrompt) {
    return null;
  }

  return (
    <Card className='border-orange-200 bg-orange-50'>
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center gap-2 text-orange-800'>
          <Lock className='h-5 w-5' />
          Feature Locked
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-3'>
        <div className='flex items-center gap-2'>
          <AlertTriangle className='h-4 w-4 text-orange-600' />
          <span className='text-sm text-orange-700'>
            This feature is not available on your current plan.
          </span>
        </div>

        <div className='flex items-center gap-2'>
          <Crown className='h-4 w-4 text-orange-600' />
          <span className='text-sm text-orange-700'>
            Upgrade to Pro to unlock this feature.
          </span>
        </div>

        <div className='flex gap-2 pt-2'>
          <Button size='sm' className='bg-orange-600 hover:bg-orange-700'>
            <Crown className='h-4 w-4 mr-2' />
            Upgrade Now
          </Button>
          <Button
            size='sm'
            variant='outline'
            className='border-orange-300 text-orange-700'
          >
            Learn More
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Hook for programmatic feature access checking
export function useFeatureGate(
  feature: 'videos' | 'notes' | 'summaries' | 'ai',
) {
  const hasAccess = useFeatureAccess(feature);

  return {
    hasAccess,
    isBlocked: !hasAccess,
  };
}

// Component for showing usage warnings
interface UsageWarningProps {
  feature: string;
  currentUsage: number;
  limit: number;
  threshold?: number; // Percentage at which to show warning (default: 80)
}

export function UsageWarning({
  feature,
  currentUsage,
  limit,
  threshold = 80,
}: UsageWarningProps) {
  const percentage = (currentUsage / limit) * 100;
  const isWarning = percentage >= threshold;
  const isExceeded = currentUsage >= limit;

  if (!isWarning && !isExceeded) {
    return null;
  }

  return (
    <div
      className={`p-3 rounded-lg border ${
        isExceeded
          ? 'bg-red-50 border-red-200'
          : 'bg-yellow-50 border-yellow-200'
      }`}
    >
      <div className='flex items-center gap-2'>
        <AlertTriangle
          className={`h-4 w-4 ${
            isExceeded ? 'text-red-600' : 'text-yellow-600'
          }`}
        />
        <span
          className={`text-sm font-medium ${
            isExceeded ? 'text-red-800' : 'text-yellow-800'
          }`}
        >
          {isExceeded
            ? `${feature} limit exceeded`
            : `${feature} usage warning`}
        </span>
      </div>
      <p
        className={`text-sm mt-1 ${
          isExceeded ? 'text-red-700' : 'text-yellow-700'
        }`}
      >
        {isExceeded
          ? `You've reached your ${feature} limit (${currentUsage}/${limit}). Upgrade to continue.`
          : `You've used ${currentUsage} of ${limit} ${feature} (${Math.round(percentage)}%).`}
      </p>
      {isExceeded ? (
        <Button size='sm' className='mt-2 bg-red-600 hover:bg-red-700'>
          <Crown className='h-4 w-4 mr-2' />
          Upgrade Now
        </Button>
      ) : null}
    </div>
  );
}
