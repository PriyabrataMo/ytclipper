import { Button } from '@ytclipper/ui';
import { BarChart3 } from 'lucide-react';
import { Link, Outlet } from 'react-router';
import LogoutButton from '../logout-button';

export const AppLayout = () => {
  return (
    <div className='min-h-screen flex flex-col bg-gray-50'>
      <header className='bg-white px-8 shadow-sm sticky top-0 z-50'>
        <div className='max-w-full mx-auto px-8 py-3 flex justify-between items-center'>
          <Link
            to='/dashboard'
            className='text-xl font-bold text-orange-500 hover:text-orange-600'
          >
            YTClipper
          </Link>
          <nav className='flex gap-4 items-center'>
            <Link to='/dashboard'>
              <Button variant='outline' size='sm' className='hidden sm:flex'>
                <BarChart3 className='h-4 w-4 mr-2' />
                Dashboard
              </Button>
            </Link>
            <Link to='/videos' className=''>
              My Videos
            </Link>
            <Link to='/pricing' className=''>
              Pricing
            </Link>
            <Link to='/profile' className=''>
              Profile
            </Link>
            <LogoutButton />
          </nav>
        </div>
      </header>

      <main className='flex-1 py-4 bg-background'>
        <Outlet />
      </main>
    </div>
  );
};
