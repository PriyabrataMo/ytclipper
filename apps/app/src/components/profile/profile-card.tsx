import { useProfile } from '@/hooks/use-profile';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Progress,
} from '@ytclipper/ui';
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  CheckCircle,
  Crown,
  User,
  XCircle,
  Zap,
} from 'lucide-react';

export function ProfileCard() {
  const {
    profile,
    isLoading,
    isFreePlan,
    isPaidPlan,
    isExpired,
    isExceeded,
    getPlanName,
    getUsagePercentage,
    getUsageLimit,
    getCurrentUsage,
    getSubscriptionStatus,
  } = useProfile();

  if (isLoading) {
    return (
      <Card className='w-full max-w-2xl mx-auto'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <User className='h-5 w-5' />
            Loading Profile...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='animate-pulse space-y-4'>
            <div className='h-4 bg-gray-200 rounded w-3/4' />
            <div className='h-4 bg-gray-200 rounded w-1/2' />
            <div className='h-4 bg-gray-200 rounded w-2/3' />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card className='w-full max-w-2xl mx-auto'>
        <CardContent className='text-center py-8'>
          <AlertTriangle className='h-12 w-12 text-red-500 mx-auto mb-4' />
          <h3 className='text-lg font-semibold mb-2'>Profile Not Found</h3>
          <p className='text-gray-600'>
            Unable to load your profile information.
          </p>
        </CardContent>
      </Card>
    );
  }

  const subscriptionStatus = getSubscriptionStatus();

  return (
    <Card className='w-full max-w-2xl mx-auto'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <User className='h-5 w-5' />
          Profile
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='flex items-center gap-4'>
          {profile.user.picture ? (
            <img
              src={profile.user.picture}
              alt={profile.user.name}
              className='w-16 h-16 rounded-full'
            />
          ) : (
            <div className='w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center'>
              <User className='h-8 w-8 text-gray-500' />
            </div>
          )}
          <div>
            <h3 className='text-xl font-semibold'>{profile.user.name}</h3>
            <p className='text-gray-600'>{profile.user.email}</p>
          </div>
        </div>

        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <h4 className='font-medium flex items-center gap-2'>
              <Crown className='h-4 w-4' />
              Subscription Plan
            </h4>
            <div className='flex items-center gap-2'>
              <Badge variant={isPaidPlan ? 'default' : 'secondary'}>
                {getPlanName()}
              </Badge>
              {isExpired ? (
                <Badge variant='destructive'>
                  <AlertTriangle className='h-3 w-3 mr-1' />
                  Expired
                </Badge>
              ) : null}
              {isExceeded && isFreePlan ? (
                <Badge variant='destructive'>
                  <XCircle className='h-3 w-3 mr-1' />
                  Limit Exceeded
                </Badge>
              ) : null}
            </div>
          </div>

          {profile.subscription.current_period_end ? (
            <div className='flex items-center gap-2 text-sm text-gray-600'>
              <Calendar className='h-4 w-4' />
              <span>
                {subscriptionStatus === 'expired' ? 'Expired on' : 'Renews on'}:{' '}
                {new Date(
                  profile.subscription.current_period_end,
                ).toLocaleDateString()}
              </span>
            </div>
          ) : null}
        </div>

        <div className='space-y-4'>
          <h4 className='font-medium flex items-center gap-2'>
            <BarChart3 className='h-4 w-4' />
            Usage Limits
          </h4>

          <div className='space-y-3'>
            <UsageProgress
              label='Videos'
              current={getCurrentUsage('videos')}
              limit={getUsageLimit('videos')}
              percentage={getUsagePercentage('videos')}
              isUnlimited={!isFreePlan}
            />

            <UsageProgress
              label='Notes'
              current={getCurrentUsage('notes')}
              limit={getUsageLimit('notes')}
              percentage={getUsagePercentage('notes')}
              isUnlimited={!isFreePlan}
            />

            <UsageProgress
              label='AI Summaries'
              current={getCurrentUsage('ai_summaries')}
              limit={getUsageLimit('ai_summaries')}
              percentage={getUsagePercentage('ai_summaries')}
              isUnlimited={!isFreePlan}
            />

            <UsageProgress
              label='AI Questions'
              current={getCurrentUsage('ai_questions')}
              limit={getUsageLimit('ai_questions')}
              percentage={getUsagePercentage('ai_questions')}
              isUnlimited={!isFreePlan}
            />
          </div>
        </div>

        {isFreePlan ? (
          <div className='bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border'>
            <div className='flex items-center gap-3'>
              <Zap className='h-5 w-5 text-blue-600' />
              <div className='flex-1'>
                <h4 className='font-medium text-blue-900'>Upgrade to Pro</h4>
                <p className='text-sm text-blue-700'>
                  Get unlimited access to all features and remove usage limits.
                </p>
              </div>
              <Button size='sm' className='bg-blue-600 hover:bg-blue-700'>
                Upgrade Now
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

interface UsageProgressProps {
  label: string;
  current: number;
  limit: number;
  percentage: number;
  isUnlimited: boolean;
}

function UsageProgress({
  label,
  current,
  limit,
  percentage,
  isUnlimited,
}: UsageProgressProps) {
  const isExceeded = !isUnlimited && current >= limit;

  return (
    <div className='space-y-2'>
      <div className='flex items-center justify-between text-sm'>
        <span className='font-medium'>{label}</span>
        <div className='flex items-center gap-2'>
          <span className='text-gray-600'>
            {current}
            {!isUnlimited && ` / ${limit}`}
            {isUnlimited ? ' / ∞' : null}
          </span>
          {isExceeded ? (
            <XCircle className='h-4 w-4 text-red-500' />
          ) : (
            <CheckCircle className='h-4 w-4 text-green-500' />
          )}
        </div>
      </div>
      {!isUnlimited && (
        <Progress
          value={Math.min(percentage, 100)}
          className={isExceeded ? 'bg-red-100' : ''}
        />
      )}
      {isUnlimited ? (
        <div className='h-2 bg-gray-100 rounded-full'>
          <div className='h-2 bg-green-500 rounded-full w-full' />
        </div>
      ) : null}
    </div>
  );
}
