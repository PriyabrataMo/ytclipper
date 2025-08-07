import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  toast,
} from '@ytclipper/ui';
import { Check, Crown, Sparkles, Star, Zap } from 'lucide-react';
import { Link } from 'react-router';

import { usePurchaseSubscriptionMutation } from '@/services/subscription';

interface PricingPlan {
  name: string;
  description: string;
  price: string;
  originalPrice?: string;
  billingCycle: string;
  savings?: string;
  features: string[];
  popular?: boolean;
  icon: React.ReactNode;
  buttonText: string;
  buttonVariant: 'default' | 'outline';
}

const plans: PricingPlan[] = [
  {
    name: 'Free',
    description: 'Perfect for getting started with video note-taking',
    price: 'Free',
    billingCycle: 'Forever',
    features: [
      'Up to 5 videos',
      '40 notes total',
      '3 AI summaries',
      '10 AI questions',
      'Standard support',
      'Basic tag management',
    ],
    icon: <Star className='h-6 w-6' />,
    buttonText: 'Get Started Free',
    buttonVariant: 'outline',
  },
  {
    name: 'Monthly Pro',
    description: 'Flexible monthly billing',
    price: '$9.99',
    billingCycle: 'per month',
    features: [
      '50 videos',
      '200 notes total',
      '50 AI summaries',
      '200 AI questions',
      'Custom tags & categories',
      'Export to multiple formats',
      'Advanced analytics',
      'API access',
    ],
    icon: <Zap className='h-6 w-6' />,
    buttonText: 'Start Monthly Plan',
    buttonVariant: 'outline',
  },
  {
    name: 'Quarterly Pro',
    description: 'Save 10% with 3-month billing',
    price: '$26.97',
    originalPrice: '$29.97',
    billingCycle: 'every 3 months',
    savings: 'Save 10%',
    features: [
      '150 videos',
      '600 notes total',
      '150 AI summaries',
      '600 AI questions',
      'Custom tags & categories',
      'Export to multiple formats',
      'Advanced analytics',
      'API access',
    ],
    popular: true,
    icon: <Crown className='h-6 w-6' />,
    buttonText: 'Start Quarterly Plan',
    buttonVariant: 'default',
  },
  {
    name: 'Annual Pro',
    description: 'Save 30% with yearly billing',
    price: '$83.88',
    originalPrice: '$119.88',
    billingCycle: 'per year',
    savings: 'Save 30%',
    features: [
      '500 videos',
      '2000 notes total',
      '500 AI summaries',
      '2000 AI questions',
      'Custom tags & categories',
      'Export to multiple formats',
      'Advanced analytics',
      'API access',
    ],
    icon: <Sparkles className='h-6 w-6' />,
    buttonText: 'Start Annual Plan',
    buttonVariant: 'outline',
  },
];

export const PricingPage = () => {
  const [purchaseSubscription, { isLoading: isPurchasing }] =
    usePurchaseSubscriptionMutation();

  const handlePurchase = async (
    planType: 'free' | 'monthly' | 'quarterly' | 'annual',
  ) => {
    try {
      const response = await purchaseSubscription({
        plan_type: planType,
      }).unwrap();

      if (response.success) {
        toast.success(`Successfully started ${planType} plan!`);

        // If there's a payment URL, redirect to payment gateway
        if (response.data.payment_url) {
          window.location.href = response.data.payment_url;
        } else {
          // For free plans or immediate activation, redirect to dashboard
          window.location.href = '/dashboard';
        }
      } else {
        toast.error('Failed to purchase subscription');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Failed to purchase subscription. Please try again.');
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16'>
        {/* Header */}
        <div className='text-center mb-16'>
          <h1 className='text-4xl font-bold text-gray-900 mb-4'>
            Choose Your Perfect Plan
          </h1>
          <p className='text-xl text-gray-600 max-w-3xl mx-auto'>
            Start free and upgrade as you grow. All paid plans include the same
            features with different billing cycles to suit your needs.
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-16'>
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col h-full ${
                plan.popular
                  ? 'ring-2 ring-orange-500 shadow-xl border-orange-500'
                  : 'hover:shadow-lg transition-shadow'
              }`}
            >
              {plan.popular ? (
                <div className='absolute -top-3 left-1/2 transform -translate-x-1/2 z-10'>
                  <span className='bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium'>
                    Most Popular
                  </span>
                </div>
              ) : null}

              <CardHeader className='text-center pb-4 flex-shrink-0'>
                <div className='flex justify-center mb-4'>
                  <div className='p-3 rounded-full bg-orange-100 text-orange-600'>
                    {plan.icon}
                  </div>
                </div>
                <CardTitle className='text-xl font-bold text-gray-900'>
                  {plan.name}
                </CardTitle>
                <p className='text-gray-600 text-sm'>{plan.description}</p>
              </CardHeader>

              <CardContent className='pt-0 flex-1 flex flex-col'>
                <div className='text-center mb-6 flex-shrink-0'>
                  <div className='flex items-center justify-center gap-2 mb-1'>
                    <div className='text-3xl font-bold text-gray-900'>
                      {plan.price}
                    </div>
                    {plan.originalPrice ? (
                      <div className='text-lg text-gray-400 line-through'>
                        {plan.originalPrice}
                      </div>
                    ) : null}
                  </div>
                  <div className='text-gray-600 text-sm mb-2'>
                    {plan.billingCycle}
                  </div>
                  {plan.savings ? (
                    <div className='text-green-600 text-sm font-medium'>
                      {plan.savings}
                    </div>
                  ) : null}
                </div>

                <ul className='space-y-3 mb-8 flex-1'>
                  {plan.features.map((feature) => (
                    <li key={feature} className='flex items-start'>
                      <Check className='h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0' />
                      <span className='text-gray-700 text-xs'>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.buttonVariant}
                  className='w-full flex-shrink-0'
                  size='sm'
                  onClick={() => {
                    const planType =
                      plan.name === 'Free'
                        ? 'free'
                        : plan.name === 'Monthly Pro'
                          ? 'monthly'
                          : plan.name === 'Quarterly Pro'
                            ? 'quarterly'
                            : 'annual';
                    handlePurchase(planType);
                  }}
                  disabled={isPurchasing}
                >
                  {isPurchasing ? 'Processing...' : plan.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className='max-w-4xl mx-auto'>
          <h2 className='text-3xl font-bold text-center text-gray-900 mb-12'>
            Frequently Asked Questions
          </h2>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
            <div className='space-y-6'>
              <div>
                <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                  Can I change plans anytime?
                </h3>
                <p className='text-gray-600'>
                  Yes! You can upgrade or downgrade your plan at any time.
                  Changes take effect immediately.
                </p>
              </div>

              <div>
                <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                  Is there a free trial?
                </h3>
                <p className='text-gray-600'>
                  All paid plans come with a 14-day free trial. No credit card
                  required to start.
                </p>
              </div>

              <div>
                <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                  What payment methods do you accept?
                </h3>
                <p className='text-gray-600'>
                  We accept all major credit cards, PayPal, and Apple Pay.
                </p>
              </div>
            </div>

            <div className='space-y-6'>
              <div>
                <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                  Do you offer refunds?
                </h3>
                <p className='text-gray-600'>
                  We offer a 30-day money-back guarantee. If you&apos;re not
                  satisfied, we&apos;ll refund your payment.
                </p>
              </div>

              <div>
                <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                  Can I cancel anytime?
                </h3>
                <p className='text-gray-600'>
                  Absolutely. You can cancel your subscription at any time and
                  continue using the service until the end of your billing
                  period.
                </p>
              </div>

              <div>
                <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                  Is my data secure?
                </h3>
                <p className='text-gray-600'>
                  Yes! We use enterprise-grade security and encryption. Your
                  data is backed up daily and never shared with third parties.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className='text-center mt-16'>
          <div className='bg-white rounded-2xl p-8 shadow-lg'>
            <h2 className='text-2xl font-bold text-gray-900 mb-4'>
              Ready to get started?
            </h2>
            <p className='text-gray-600 mb-6'>
              Join thousands of users who are already taking better notes from
              their videos.
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Button size='lg' asChild>
                <Link to='/auth'>Start Free Trial</Link>
              </Button>
              <Button variant='outline' size='lg' asChild>
                <Link to='/contact'>Contact Sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
