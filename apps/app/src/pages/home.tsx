import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@ytclipper/ui';
import {
  Bookmark,
  Clock,
  Play,
  Share2,
  Sparkles,
  Target,
  Users,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router';

export const HomePage = () => {
  return (
    <div className='min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 relative overflow-hidden'>
      {/* Background decorative elements */}
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute -top-40 -right-40 w-80 h-80 bg-orange-400/10 rounded-full blur-3xl' />
        <div className='absolute -bottom-40 -left-40 w-80 h-80 bg-orange-400/10 rounded-full blur-3xl' />
        <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-400/5 rounded-full blur-3xl' />
      </div>

      <div className='relative z-10 p-8 space-y-12 max-w-7xl mx-auto'>
        {/* Hero Section */}
        <div className='text-center space-y-6 pt-12'>
          <div className='flex justify-center mb-6'>
            <div className='w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg'>
              <svg
                className='w-8 h-8 text-white'
                fill='currentColor'
                viewBox='0 0 24 24'
              >
                <path d='M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z' />
              </svg>
            </div>
          </div>

          <h1 className='text-6xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4'>
            YT Clipper
          </h1>

          <p className='text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed'>
            Transform your YouTube learning experience with{' '}
            <span className='font-semibold text-orange-600'>
              timestamped notes
            </span>{' '}
            and organized video clips that make learning effortless.
          </p>

          <div className='flex items-center justify-center gap-2 text-orange-600 font-medium'>
            <Sparkles className='w-5 h-5' />
            <span>AI-powered insights</span>
            <Sparkles className='w-5 h-5' />
          </div>
        </div>

        {/* CTA Section */}
        <div className='text-center'>
          <Card className='max-w-lg mx-auto shadow-2xl border-0 bg-white/80 backdrop-blur-sm'>
            <CardHeader className='pb-4'>
              <CardTitle className='text-2xl font-bold text-gray-800'>
                Ready to Get Started?
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              <p className='text-gray-600 leading-relaxed'>
                Join thousands of learners who are already using YT Clipper to
                enhance their YouTube learning experience.
              </p>
              <Button
                asChild
                size='lg'
                className='w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-4 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg'
              >
                <Link to='/auth/login'>Start Learning Today</Link>
              </Button>
              <p className='text-sm text-gray-500'>
                Free to start • No credit card required
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16'>
          <Card className='text-center p-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1'>
            <div className='w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg'>
              <Play className='w-6 h-6 text-white' />
            </div>
            <h3 className='font-bold text-lg mb-3 text-gray-800'>
              Video Integration
            </h3>
            <p className='text-gray-600 leading-relaxed'>
              Seamlessly embed and control YouTube videos with our intuitive
              interface
            </p>
          </Card>

          <Card className='text-center p-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1'>
            <div className='w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg'>
              <Clock className='w-6 h-6 text-white' />
            </div>
            <h3 className='font-bold text-lg mb-3 text-gray-800'>
              Smart Timestamps
            </h3>
            <p className='text-gray-600 leading-relaxed'>
              Add notes at specific video timestamps with AI-powered insights
            </p>
          </Card>

          <Card className='text-center p-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1'>
            <div className='w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg'>
              <Bookmark className='w-6 h-6 text-white' />
            </div>
            <h3 className='font-bold text-lg mb-3 text-gray-800'>
              Organized Library
            </h3>
            <p className='text-gray-600 leading-relaxed'>
              Keep all your videos and notes organized in a beautiful,
              searchable library
            </p>
          </Card>

          <Card className='text-center p-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1'>
            <div className='w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg'>
              <Share2 className='w-6 h-6 text-white' />
            </div>
            <h3 className='font-bold text-lg mb-3 text-gray-800'>
              Easy Sharing
            </h3>
            <p className='text-gray-600 leading-relaxed'>
              Share your clips and notes with others through simple, secure
              links
            </p>
          </Card>
        </div>

        {/* Additional Features */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8 mt-16'>
          <div className='text-center space-y-4'>
            <div className='w-16 h-16 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg'>
              <Zap className='w-8 h-8 text-white' />
            </div>
            <h3 className='text-xl font-bold text-gray-800'>Lightning Fast</h3>
            <p className='text-gray-600'>
              Instant video loading and seamless navigation for the best
              learning experience
            </p>
          </div>

          <div className='text-center space-y-4'>
            <div className='w-16 h-16 bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg'>
              <Target className='w-8 h-8 text-white' />
            </div>
            <h3 className='text-xl font-bold text-gray-800'>
              Precision Control
            </h3>
            <p className='text-gray-600'>
              Exact timestamp control and precise note placement for detailed
              learning
            </p>
          </div>

          <div className='text-center space-y-4'>
            <div className='w-16 h-16 bg-gradient-to-r from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg'>
              <Users className='w-8 h-8 text-white' />
            </div>
            <h3 className='text-xl font-bold text-gray-800'>
              Collaborative Learning
            </h3>
            <p className='text-gray-600'>
              Share insights and collaborate with other learners in your
              community
            </p>
          </div>
        </div>

        {/* Final CTA */}
        <div className='text-center space-y-6 pt-8'>
          <h2 className='text-3xl font-bold text-gray-800'>
            Ready to Transform Your Learning?
          </h2>
          <p className='text-xl text-gray-600 max-w-2xl mx-auto'>
            Join thousands of learners who are already using YT Clipper to make
            their YouTube learning more effective and organized.
          </p>
          <Button
            asChild
            size='lg'
            className='bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-4 px-8 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg'
          >
            <Link to='/auth/login'>Get Started Now</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};
