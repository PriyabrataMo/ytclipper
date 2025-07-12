import { Button } from '@ytclipper/ui';
import { ArrowLeft, Home } from 'lucide-react';
import { Link } from 'react-router';

interface NavigationProps {
  showBackButton?: boolean;
  backTo?: string;
  title?: string;
}

export const Navigation = ({
  showBackButton = false,
  backTo = '/',
  title,
}: NavigationProps) => {
  return (
    <div className='border-b border-gray-200 bg-white'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between h-16'>
          <div className='flex items-center space-x-4'>
            {showBackButton ? (
              <Button variant='ghost' size='sm' asChild>
                <Link to={backTo} className='flex items-center space-x-2'>
                  <ArrowLeft className='w-4 h-4' />
                  <span>Back</span>
                </Link>
              </Button>
            ) : null}
            <div className='flex items-center space-x-3'>
              <Link
                to='/'
                className='flex items-center space-x-2 hover:text-blue-600 transition-colors'
              >
                <Home className='w-5 h-5' />
                <span className='font-semibold text-lg'>YT Clipper</span>
              </Link>
              {title ? (
                <>
                  <span className='text-gray-300'>/</span>
                  <span className='text-gray-600'>{title}</span>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
