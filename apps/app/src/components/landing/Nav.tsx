import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';

type NavItem = {
  label: string;
  href: string;
  isSection?: boolean;
};

const navItems: NavItem[] = [
  {
    label: 'Home',
    href: '#hero',
    isSection: true,
  },
  {
    label: 'Features',
    href: '#features',
    isSection: true,
  },
  {
    label: 'Pricing',
    href: '#pricing',
    isSection: true,
  },
  {
    label: 'About',
    href: '#maker',
    isSection: true,
  },
  {
    label: 'Contact',
    href: '#contact',
    isSection: true,
  },
];

const Nav = () => {
  const [isOpen, setIsOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.querySelector(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
    setIsOpen(false); // Close mobile menu after clicking
  };

  const handleNavClick = (item: NavItem) => {
    if (item.isSection) {
      scrollToSection(item.href);
    }
    // For non-section items, let the Link handle routing
  };

  return (
    <>
      {/* Mobile Navigation */}
      <nav
        className='fixed z-50 flex lg:hidden justify-between items-center px-6 w-full h-[80px] border-b border-gray-200 bg-white/95 backdrop-blur-sm shadow-sm'
        data-testid='main-navigation'
        aria-label='Main navigation'
      >
        <div data-testid='nav-logo'>
          <Link
            to='/'
            className='flex items-center gap-2'
            data-testid='nav-home-link'
          >
            <div className='w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center'>
              <span className='text-white font-bold text-sm'>YT</span>
            </div>
            <h1 className='text-xl font-bold tracking-tight'>
              <span className='text-gray-900'>YT</span>
              <span className='text-orange-600'>Clipper</span>
            </h1>
          </Link>
        </div>

        <div className='relative z-[100]' data-testid='nav-menu-toggle'>
          {isOpen ? (
            <X
              className='size-8 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer'
              onClick={() => setIsOpen(!isOpen)}
              data-testid='nav-close-button'
              aria-label='Close navigation menu'
            />
          ) : (
            <Menu
              className='size-8 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer'
              onClick={() => setIsOpen(!isOpen)}
              data-testid='nav-menu-button'
              aria-label='Open navigation menu'
            />
          )}
        </div>

        {/* Mobile Menu */}
        <div
          className={`absolute top-0 right-0 w-80 h-screen flex flex-col pt-[80px] px-6 bg-white/95 backdrop-blur-sm shadow-xl border-l border-gray-200 transition-all ease-in-out duration-300 ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          data-testid='nav-menu'
          aria-label='Navigation menu'
          role='navigation'
        >
          <div className='flex flex-col gap-1'>
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => handleNavClick(item)}
                className='text-2xl font-semibold text-gray-700 hover:text-orange-600 transition-colors py-3 border-b border-gray-100 text-left'
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className='flex flex-col gap-3 mt-auto mb-8'>
            <button className='btn-primary w-full'>
              <Link to='/auth/login'>Sign In</Link>
            </button>
            <button className='btn-outline w-full'>
              <Link to='/auth/register'>Get Started Free</Link>
            </button>
          </div>
        </div>
      </nav>

      {/* Desktop Navigation */}
      <nav
        className='fixed z-50 hidden lg:flex justify-between items-center px-8 w-full h-[80px] border-b border-gray-200 bg-white/95 backdrop-blur-sm shadow-sm'
        data-testid='main-navigation'
        aria-label='Main navigation'
      >
        <div data-testid='nav-logo'>
          <Link
            to='/'
            className='flex items-center gap-3'
            data-testid='nav-home-link'
          >
            <div className='w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg'>
              <span className='text-white font-bold text-lg'>YT</span>
            </div>
            <h1 className='text-2xl font-bold tracking-tight'>
              <span className='text-gray-900'>YT</span>
              <span className='text-orange-600'>Clipper</span>
            </h1>
          </Link>
        </div>

        <div className='flex justify-center items-center gap-12'>
          <div className='flex justify-center items-center gap-8'>
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => handleNavClick(item)}
                className='text-lg font-medium text-gray-600 hover:text-orange-600 transition-all duration-300 cursor-pointer relative group'
              >
                {item.label}
                <span className='absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-600 transition-all duration-300 group-hover:w-full' />
              </button>
            ))}
          </div>

          <div className='flex justify-center items-center gap-3'>
            <button className='text-lg font-medium text-gray-600 hover:text-orange-600 transition-colors px-4 py-2'>
              <Link to='/auth/login'>Sign In</Link>
            </button>
            <button className='btn-primary'>
              <Link to='/auth/register'>Get Started Free</Link>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Nav;
