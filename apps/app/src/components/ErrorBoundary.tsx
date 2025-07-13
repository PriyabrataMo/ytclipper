import type { ErrorInfo, ReactNode } from 'react';
import React, { Component } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you might want to send this to an error reporting service
    // Example: Sentry, LogRocket, etc.
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
    });
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className='min-h-screen bg-gray-50 flex items-center justify-center px-4'>
          <div className='max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center'>
            <div className='mb-4'>
              <svg
                className='w-16 h-16 text-red-500 mx-auto'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
            </div>

            <h2 className='text-xl font-semibold text-gray-900 mb-2'>
              Something went wrong
            </h2>

            <p className='text-gray-600 mb-6'>
              We're sorry, but something unexpected happened. Please try again.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded text-left'>
                <h3 className='font-medium text-red-800 mb-2'>
                  Error Details:
                </h3>
                <pre className='text-xs text-red-700 overflow-auto'>
                  {this.state.error.toString()}
                </pre>
                {this.state.errorInfo && (
                  <pre className='text-xs text-red-700 overflow-auto mt-2'>
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className='flex space-x-4'>
              <button
                onClick={this.handleRetry}
                className='flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                Try Again
              </button>

              <button
                onClick={() => window.location.reload()}
                className='flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500'
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export function withErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void,
) {
  return function WrappedComponent(props: T) {
    return (
      <ErrorBoundary fallback={fallback} onError={onError}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// Hook for error boundaries in functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    // This would typically integrate with your error reporting service
    console.error('Error caught by error handler:', error, errorInfo);

    // You can also dispatch to Redux store if needed
    // dispatch(addNotification({ type: 'error', title: 'Error', message: error.message }));
  };
}
