import {
  ArrowUp,
  Github,
  Heart,
  Instagram,
  Linkedin,
  Mail,
  Twitter,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const Footer = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Social links array for easy mapping
  const socialLinks = [
    {
      name: 'GitHub',
      href: 'https://github.com',
      icon: Github,
      color: 'hover:bg-gray-700',
    },
    {
      name: 'Twitter',
      href: 'https://x.com',
      icon: Twitter,
      color: 'hover:bg-blue-600',
    },
    {
      name: 'LinkedIn',
      href: 'https://linkedin.com',
      icon: Linkedin,
      color: 'hover:bg-blue-700',
    },
    {
      name: 'Instagram',
      href: 'https://instagram.com',
      icon: Instagram,
      color: 'hover:bg-pink-600',
    },
    {
      name: 'Email',
      href: 'mailto:hello@ytclipper.com',
      icon: Mail,
      color: 'hover:bg-orange-600',
    },
  ];

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Show scroll to top button when user scrolls down
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <footer className='bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden'>
      <div className=' px-6 lg:px-10 py-8 lg:py-12 relative z-10'>
        {/* Main Content */}
        <div className='text-left mb-8 lg:mb-10'>
          {/* Big Connect Text */}
          <h2 className='text-5xl lg:text-6xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent mb-4 lg:mb-5'>
            <span className='text-orange-500'>Let&apos;s</span> connect
          </h2>

          {/* Subtitle */}
          <p className='text-xl lg:text-xl text-gray-300 mb-6 lg:mb-7 max-w-2xl'>
            Got an idea? Let&apos;s talk about how we can make learning better
            together.
          </p>

          {/* Social Links */}
          <div className='flex items-center gap-4 mb-8 lg:mb-10'>
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target='_blank'
                rel='noopener noreferrer'
                className='group relative'
              >
                <div
                  className={`w-14 h-14 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl flex items-center justify-center transition-all duration-300 ${social.color} group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-black/20 hover:border-gray-600`}
                >
                  <social.icon className='w-6 h-6 text-gray-300 group-hover:text-white transition-colors duration-300' />
                </div>
                {/* Tooltip */}
                <div className='absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none'>
                  <span className='text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded whitespace-nowrap'>
                    {social.name}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Brand Section */}
        <div className='flex flex-col lg:flex-row items-center justify-between gap-8 border-t border-gray-700/50 pt-8'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg'>
              <span className='text-white font-bold text-lg'>YT</span>
            </div>
            <div>
              <span className='text-xl font-bold'>YT Clipper</span>
              <p className='text-gray-400 text-sm'>
                AI-powered YouTube learning
              </p>
            </div>
          </div>

          {/* Copyright */}
          <div className='flex items-center gap-2 text-gray-400 text-sm'>
            <span>© 2025 YT Clipper. Made with</span>
            <Heart className='w-4 h-4 text-red-500 fill-current animate-pulse' />
            <span>for learners.</span>
          </div>
        </div>
      </div>

      {/* Animated Back to Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 z-50 group ${showScrollTop ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95 pointer-events-none'} hover:scale-110 hover:from-orange-600 hover:to-orange-700`}
        aria-label='Back to top'
      >
        <ArrowUp className='w-6 h-6 text-white group-hover:-translate-y-1 transition-transform duration-300' />
      </button>
    </footer>
  );
};

export default Footer;
