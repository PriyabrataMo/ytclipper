import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router';
import { PersistGate } from 'redux-persist/integration/react';

import App from './app.tsx';
import { MetaHead } from './components/MetaHead';
import './index.css';
import { pageMetadata } from './lib/metadata';
import { queryClient } from './lib/react-query';
import { persistor, store } from './store';

import { ENV } from '@/config.ts';
import { PersistGateLoading } from '@/components/persistent-data-loading.tsx';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <HelmetProvider>
      <MetaHead {...pageMetadata.home} />
      <Provider store={store}>
        <PersistGate loading={<PersistGateLoading />} persistor={persistor}>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <App />
            </BrowserRouter>
            {ENV === 'development' && (
              <ReactQueryDevtools initialIsOpen={false} />
            )}
          </QueryClientProvider>
        </PersistGate>
      </Provider>
    </HelmetProvider>
  </StrictMode>,
);
