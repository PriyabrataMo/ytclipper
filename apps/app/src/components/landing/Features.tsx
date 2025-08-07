import {
  ArrowRight,
  Bookmark,
  CheckCircle,
  Clock,
  Play,
  Share2,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';

type FeatureType = {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  isWide: boolean;
};

type StatsType = {
  number: string;
  label: string;
};

const Features = () => {
  // Feature cards data - easy to modify
  const features: FeatureType[] = [
    {
      icon: Play,
      title: 'Smart Video Integration',
      description:
        'Seamlessly embed and control YouTube videos with our intuitive interface and real-time synchronization.',
      color: 'from-blue-500 to-blue-600',
      isWide: true, // Makes card span 2 columns on desktop
    },
    {
      icon: Clock,
      title: 'Precision Timestamps',
      description:
        'Add notes at specific video moments with AI-powered insights.',
      color: 'from-green-500 to-green-600',
      isWide: false,
    },
    {
      icon: Bookmark,
      title: 'Organized Library',
      description:
        'Keep all your videos and notes organized in a beautiful, searchable library.',
      color: 'from-purple-500 to-purple-600',
      isWide: false,
    },
    {
      icon: Share2,
      title: 'Effortless Sharing',
      description:
        'Share your clips and notes with others through simple, secure links.',
      color: 'from-orange-500 to-orange-600',
      isWide: false,
    },
    {
      icon: Zap,
      title: 'Lightning Fast Performance',
      description:
        'Instant video loading and seamless navigation for the best learning experience with optimized performance.',
      color: 'from-indigo-500 to-indigo-600',
      isWide: false,
    },
    {
      icon: Target,
      title: 'AI-Powered Insights',
      description:
        'Get intelligent suggestions and automatic content analysis to enhance your learning experience.',
      color: 'from-teal-500 to-teal-600',
      isWide: true,
    },
  ];

  // Statistics data
  const stats: StatsType[] = [
    { number: '10K+', label: 'Active Users' },
    { number: '50K+', label: 'Videos Processed' },
    { number: '99.9%', label: 'Uptime' },
    { number: '4.9/5', label: 'User Rating' },
  ];

  // Feature Card Component
  const FeatureCard = ({ feature }: { feature: FeatureType }) => {
    return (
      <div
        className={`
        group relative bg-white rounded-2xl border border-gray-100 
        hover:border-gray-200 transition-all duration-300 
        hover:shadow-xl hover:-translate-y-1 p-6 h-[280px]
        ${feature.isWide ? 'lg:col-span-2' : 'lg:col-span-1'}
        col-span-1
      `}
      >
        {/* Icon */}
        <div
          className={`
          rounded-xl bg-gradient-to-r ${feature.color} 
          flex items-center justify-center mb-6 
          group-hover:scale-110 transition-transform duration-300
          ${feature.isWide ? 'w-16 h-16' : 'w-14 h-14'}
        `}
        >
          <feature.icon
            className={`
            text-white 
            ${feature.isWide ? 'w-8 h-8' : 'w-7 h-7'}
          `}
          />
        </div>

        {/* Content */}
        <h3
          className={`
          font-bold text-gray-900 mb-4 
          group-hover:text-orange-600 transition-colors
          ${feature.isWide ? 'text-xl' : 'text-lg'}
        `}
        >
          {feature.title}
        </h3>

        <p
          className={`
          text-gray-600 leading-relaxed
          ${feature.isWide ? 'text-base' : 'text-sm'}
        `}
        >
          {feature.description}
        </p>

        {/* Hover effect overlay */}
        <div className='absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-500/5 to-orange-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
      </div>
    );
  };

  // Stats Card Component
  const StatsCard = ({ stat }: { stat: StatsType }) => {
    return (
      <div className='text-center'>
        <div className='text-3xl lg:text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent  mb-1 lg:mb-2 '>
          {stat.number}
        </div>
        <div className='text-gray-600 text-sm lg:text-base font-medium'>
          {stat.label}
        </div>
      </div>
    );
  };

  return (
    <section
      id='features'
      className='py-24 bg-gradient-to-b from-white to-gray-50/50'
    >
      <div className='max-w-7xl mx-auto px-6 lg:px-8'>
        {/* Section Header */}
        <div className='text-center mb-20'>
          {/* Badge */}
          <div className='inline-flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-full mb-6'>
            <Sparkles className='w-4 h-4 text-orange-600' />
            <span className='text-sm font-medium text-orange-700'>
              Powerful Features
            </span>
          </div>

          {/* Main Heading */}
          <h2 className='text-3xl lg:text-5xl font-bold text-gray-900 mb-6'>
            Everything you need to
            <span className='bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent'>
              {' '}
              transform{' '}
            </span>
            <br className='hidden lg:block' />
            your learning experience
          </h2>

          {/* Subtitle */}
          <p className='text-base lg:text-lg text-gray-600 max-w-3xl mx-auto leading-tight'>
            Discover the tools that make YT Clipper the preferred choice for
            creators, educators, and learners worldwide.
          </p>
        </div>

        {/* Features Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20'>
          {features.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>

        {/* Statistics Section */}
        <div className='bg-white rounded-3xl p-6 lg:p-12 border border-gray-100 shadow-lg'>
          <div className='grid grid-cols-2 lg:grid-cols-4 gap-8'>
            {stats.map((stat) => (
              <StatsCard key={stat.label} stat={stat} />
            ))}
          </div>
        </div>

        {/* Call to Action Section */}
        <div className='text-center mt-20'>
          <div className='bg-gradient-to-r from-orange-50 to-orange-100 rounded-3xl p-12 border border-orange-200'>
            <h3 className='text-3xl lg:text-4xl font-bold text-gray-900 mb-6'>
              Ready to get started?
            </h3>

            <p className='text-sm lg:text-lg text-gray-600 mb-8 max-w-2xl mx-auto'>
              Join thousands of creators who are already using YT Clipper to
              enhance their content and engage their audience.
            </p>

            <div className='flex flex-col sm:flex-row gap-4 justify-center items-center'>
              <button className='btn-primary group flex items-center gap-2'>
                <span>Start Free Trial</span>
                <ArrowRight className='w-4 h-4 group-hover:translate-x-1 transition-transform' />
              </button>

              <div className='flex items-center gap-2 text-gray-600'>
                <CheckCircle className='w-5 h-5 text-green-500' />
                <span className='text-sm'>No credit card required</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
