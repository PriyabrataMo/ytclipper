import { ArrowRight, CheckCircle, Play, Star } from 'lucide-react';
import { Link } from 'react-router';

const Hero = () => {
  return (
    <div
      id='hero'
      className='min-h-screen lg:min-h-0 lg:h-screen flex flex-col lg:flex-row  items-start md:items-center justify-center gap-16 lg:gap-8 mt-[80px] pt-[120px] lg:pt-[0px] lg:overflow-hidden px-6 lg:px-12'
    >
      {/* Left Content */}
      <div className='lg:flex-[0.5] flex flex-col items-start md:items-center lg:items-start justify-center h-full space-y-8'>
        {/* Badge */}
        <div className='inline-flex items-center  gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-full'>
          <Star className='w-4 h-4 text-orange-600 fill-current' />
          <span className='text-sm font-medium text-orange-700'>
            Trusted by 10,000+ creators
          </span>
        </div>

        {/* Main Heading */}
        <div className='space-y-6'>
          <h1 className='text-[2.7rem] md:text-6xl xl:text-7xl md:text-center lg:text-left font-bold leading-[0.9]'>
            <span className='bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent '>
              Transform Your
            </span>
            <br />
            <span className='bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent '>
              YouTube Learning
            </span>
          </h1>

          <p className='text-sm lg:text-lg  text-left md:text-center lg:text-left text-gray-500 leading-[1.1] max-w-sm md:max-w-lg lg:max-w-xl'>
            Create professional video chapters, add smart timestamps, and
            organize your learning with AI-powered insights. Make your content
            more engaging and accessible.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className='flex flex-col sm:flex-row gap-4 w-full sm:w-auto'>
          <button className='btn-primary group flex items-center justify-center gap-2'>
            <Link to='/auth/register' className='flex items-center gap-2'>
              Get Started Free
              <ArrowRight className='w-4 h-4 group-hover:translate-x-1 transition-transform' />
            </Link>
          </button>
          <button className='btn-outline group flex items-center justify-center gap-2'>
            <Link to='/demo' className='flex items-center gap-2'>
              <Play className='w-4 h-4' />
              Watch Demo
            </Link>
          </button>
        </div>

        {/* Social Proof */}
        <div className='flex flex-col sm:flex-row items-start sm:items-center gap-6 pt-4'>
          <div className='flex items-center gap-2'>
            <div className='flex -space-x-2'>
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className='w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 border-2 border-white'
                />
              ))}
            </div>
            <div className='ml-3'>
              <p className='text-sm font-semibold text-gray-900'>
                1,000+ Happy Users
              </p>
              <div className='flex items-center gap-1'>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className='w-3 h-3 text-yellow-400 fill-current'
                  />
                ))}
                <span className='text-xs text-gray-500 ml-1'>4.9/5</span>
              </div>
            </div>
          </div>

          <div className='flex items-center gap-2 text-sm text-gray-600'>
            <CheckCircle className='w-4 h-4 text-green-500' />
            <span>No credit card required</span>
          </div>
        </div>
      </div>

      {/* Right Content - Image */}
      <div className='lg:flex-[0.5] w-full lg:w-auto'>
        <div className='relative'>
          {/* Background decoration */}
          <div className='absolute -inset-4 bg-gradient-to-r from-orange-100 to-orange-50 rounded-2xl blur-xl opacity-50' />

          {/* Main image container */}
          <div className='relative lg:top-9 lg:left-10 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden'>
            <img
              src='/dashboard.png'
              alt='YT Clipper Dashboard Preview'
              className='w-full h-auto object-cover lg:scale-125'
            />

            {/* Floating elements */}
            <div className='absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-gray-200'>
              <div className='flex items-center gap-2'>
                <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse' />
                <span className='text-xs font-medium text-gray-700'>
                  Live Preview
                </span>
              </div>
            </div>

            <div className='absolute bottom-4 right-4 bg-orange-500 text-white rounded-lg p-2 shadow-lg'>
              <Play className='w-4 h-4' />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
