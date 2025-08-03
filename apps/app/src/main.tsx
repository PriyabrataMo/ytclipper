import { HelmetProvider } from '@dr.pogodin/react-helmet';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router';
import { PersistGate } from 'redux-persist/integration/react';

import App from './app.tsx';
import './index.css';
import { persistor, store } from './store';

import { PersistGateLoading } from '@/components/persistent-data-loading.tsx';
import { Toaster } from '@ytclipper/ui';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={<PersistGateLoading />} persistor={persistor}>
        <HelmetProvider>
          <BrowserRouter>
            <App />
            <Toaster
              position='bottom-left'
              toastOptions={{
                classNames: {
                  toast: 'bg-orange-500 text-black',
                },
              }}
              richColors
            />
          </BrowserRouter>
        </HelmetProvider>
      </PersistGate>
    </Provider>
  </StrictMode>,
);
