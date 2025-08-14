import { cn } from '@/lib/utils';
import { Button } from '@ytclipper/ui';
import { BarChart3 } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router';
import LogoutButton from '../logout-button';

export const AppLayout = () => {
  return (
    <div className='min-h-screen flex flex-col bg-gray-50'>
      <header className='bg-white px-8 shadow-sm sticky top-0 z-50'>
        <div className='max-w-full mx-auto py-3 flex justify-between items-center'>
          <Link
            to='/videos'
            className='text-xl font-bold text-orange-500 hover:text-orange-600'
          >
            YTClipper
          </Link>
          <nav className='flex gap-4 items-center'>
            <NavLink
              to='/videos'
              className={({ isActive }) =>
                cn(
                  'px-3 py-1 rounded font-medium transition-colors',
                  isActive
                    ? 'bg-orange-100 text-orange-700'
                    : 'text-gray-700 hover:bg-orange-100 hover:text-orange-700',
                  'active:bg-orange-200',
                )
              }
            >
              Videos
            </NavLink>
            <NavLink
              to='/pricing'
              className={({ isActive }) =>
                cn(
                  'px-3 py-1 rounded font-medium transition-colors',
                  isActive
                    ? 'bg-orange-100 text-orange-700'
                    : 'text-gray-700 hover:bg-orange-100 hover:text-orange-700',
                  'active:bg-orange-200',
                )
              }
            >
              Pricing
            </NavLink>
            <NavLink
              to='/profile'
              className={({ isActive }) =>
                cn(
                  'px-3 py-1 rounded font-medium transition-colors',
                  isActive
                    ? 'bg-orange-100 text-orange-700'
                    : 'text-gray-700 hover:bg-orange-100 hover:text-orange-700',
                  'active:bg-orange-200',
                )
              }
            >
              Profile
            </NavLink>
            <Link to='/dashboard'>
              <Button variant='outline' size='sm' className='hidden sm:flex'>
                <BarChart3 className='h-4 w-4 mr-2' />
                Dashboard
              </Button>
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
