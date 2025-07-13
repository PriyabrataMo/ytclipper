import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router';
import { PersistGate } from 'redux-persist/integration/react';

import App from './app.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MetaHead } from './components/MetaHead';
import './index.css';
import { pageMetadata } from './lib/metadata';
import { queryClient } from './lib/react-query';
import { persistor, store } from './store';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

// Loading component for PersistGate
const PersistGateLoading = () => (
  <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
    <div className='text-center'>
      <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
      <p className='mt-4 text-gray-600'>Loading...</p>
    </div>
  </div>
);

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <MetaHead {...pageMetadata.home} />
        <Provider store={store}>
          <PersistGate loading={<PersistGateLoading />} persistor={persistor}>
            <QueryClientProvider client={queryClient}>
              <BrowserRouter>
                <App />
              </BrowserRouter>
              {process.env.NODE_ENV === 'development' && (
                <ReactQueryDevtools initialIsOpen={false} />
              )}
            </QueryClientProvider>
          </PersistGate>
        </Provider>
      </HelmetProvider>
    </ErrorBoundary>
  </StrictMode>,
);
