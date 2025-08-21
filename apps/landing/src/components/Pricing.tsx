import { Check, Star, Zap } from 'lucide-react';
import { useState } from 'react';

const Pricing = () => {
  const [selectedPlan, setSelectedPlan] = useState('3');

  const plans = [
    {
      id: 'Free',
      title: 'Free',
      name: 'Free',
      description: 'Perfect for getting started with video note-taking',
      price: 0,
      originalPrice: 0,
      // savings: '',
      popular: false,
      features: [
        'Up to 5 videos',
        '40 notes total',
        '3 AI summaries',
        '10 AI questions',
        'Standard support',
        'Basic tag management',
      ],
    },
    {
      id: '1',
      title: '1 Month',
      name: 'Monthly Pro',
      description: 'Flexible monthly billing',
      price: 9.99,
      originalPrice: 9.99,
      // savings: '',
      popular: false,
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
    },
    {
      id: '3',
      title: '3 Months',
      name: 'Quarterly Pro',
      description: 'Save 10% with 3-month billing',
      price: 26.97,
      originalPrice: 29.97,
      savings: '10%',
      popular: true,
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
    },
    {
      id: '12',
      title: '12 Months',
      name: 'Annual Pro',
      description: 'Save 30% with yearly billing',
      price: 83.88,
      originalPrice: 119.88,
      savings: '30%',
      popular: false,
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
    },
  ];

  const selectedPlanData = plans.find((plan) => plan.id === selectedPlan);

  return (
    <section
      id='pricing'
      className='py-20 bg-gradient-to-br from-gray-50 to-white'
    >
      <div className='max-w-7xl mx-auto px-6 lg:px-8'>
        {/* Header */}
        <div className='text-center mb-16'>
          <div className='inline-flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-full mb-6'>
            <Star className='w-4 h-4 text-orange-600' />
            <span className='text-sm font-medium text-orange-700'>
              Pricing Plans
            </span>
          </div>

          <h2 className='text-3xl lg:text-5xl font-bold text-gray-900 mb-4'>
            Choose Your
            <span className='bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent'>
              {' '}
              Plan
            </span>
          </h2>

          <p className='text-base lg:text-lg text-gray-600 max-w-2xl mx-auto leading-tight'>
            All plans include full access to every feature. Choose the duration
            that works best for you.
          </p>
        </div>

        {/* Plan Selector */}
        <div className='flex justify-center mb-12 '>
          <div className='bg-white rounded-2xl p-2 border border-gray-200 shadow-sm flex'>
            {plans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  selectedPlan === plan.id
                    ? 'bg-orange-500 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {plan.title}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Plan Details */}
        {selectedPlanData ? (
          <div className='max-w-5xl mx-auto'>
            <div className='h-fit md:h-[500px]   min-w-full flex flex-col md:flex-row bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden'>
              {/* Plan left */}
              <div className='flex-[0.4] bg-gradient-to-r from-orange-500 to-orange-600 p-8 text-white text-center relative'>
                {selectedPlanData.popular ? (
                  <div className='mb-4'>
                    <div className='bg-white text-orange-600 px-4 py-2 rounded-full text-sm font-medium shadow-lg'>
                      Most Popular
                    </div>
                  </div>
                ) : null}

                <h3 className='text-2xl font-bold mb-2'>
                  {selectedPlanData.name}
                </h3>
                <p className='text-orange-100 mb-6'>
                  {selectedPlanData.description}
                </p>

                <div className='flex items-center justify-center gap-4 mb-6'>
                  <div className='text-center'>
                    <div className='flex items-baseline gap-1'>
                      <span className='text-4xl font-bold'>
                        ${selectedPlanData.price}
                      </span>
                      <span className='text-orange-100'>/plan</span>
                    </div>
                    {selectedPlanData.savings && (
                      <div className='flex items-center gap-2 mt-2'>
                        <span className='text-orange-200 line-through'>
                          ${selectedPlanData.originalPrice}
                        </span>
                        <span className='bg-orange-400 text-white px-2 py-1 rounded-full text-xs font-medium'>
                          Save {selectedPlanData.savings}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <button className='w-full bg-white text-orange-600 font-semibold py-4 px-8 rounded-xl hover:bg-gray-50 transition-colors duration-200 shadow-lg'>
                  Get Started Now
                </button>
              </div>

              {/* Features */}
              <div className='flex-[0.6] p-8'>
                <h4 className='text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2'>
                  <Zap className='w-5 h-5 text-orange-500' />
                  Everything included in your plan
                </h4>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {selectedPlanData.features.map((feature) => (
                    <div key={feature} className='flex items-center gap-3'>
                      <div className='w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0'>
                        <Check className='w-3 h-3 text-green-600' />
                      </div>
                      <span className='text-gray-700'>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default Pricing;
