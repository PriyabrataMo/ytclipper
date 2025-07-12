import { StrictMode } from 'react';

import { Auth0Provider, type AppState } from '@auth0/auth0-react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';

import QueryProvider from '@/components/query-provider';
import config from '@/config.ts';

import './index.css';

import App from './app.tsx';

const { auth0Domain, auth0ClientId, auth0Audience } = config;

const onRedirectCallback = (appState: AppState | undefined) => {
  const url = new URL(window.location.href);

  url.searchParams.delete('code');
  url.searchParams.delete('state');
  url.searchParams.delete('error');
  url.searchParams.delete('error_description');

  const returnTo = appState?.returnTo || '/dashboard';

  window.history.replaceState({}, document.title, returnTo);
};

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <Auth0Provider
      domain={auth0Domain}
      clientId={auth0ClientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: auth0Audience,
        scope: 'openid profile email',
      }}
      useRefreshTokens
      cacheLocation='localstorage'
      onRedirectCallback={onRedirectCallback}
    >
      <QueryProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryProvider>
    </Auth0Provider>
  </StrictMode>,
);
