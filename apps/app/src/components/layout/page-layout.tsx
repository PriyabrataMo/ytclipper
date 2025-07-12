import { type ReactNode } from 'react';

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export const PageLayout = ({
  children,
  title,
  description,
}: PageLayoutProps) => {
  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {title || description ? (
          <div className='mb-8'>
            {title ? (
              <h1 className='text-3xl font-bold text-gray-900 mb-2'>{title}</h1>
            ) : null}
            {description ? (
              <p className='text-gray-600 max-w-2xl'>{description}</p>
            ) : null}
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
};
