import { StrictMode } from 'react';

import { Auth0Provider, type AppState } from '@auth0/auth0-react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';

import './index.css';
import App from './App.tsx';

const ENV = import.meta.env.VITE_ENVIRONMENT || 'development';

const config = {
  development: {
    apiUrl: 'http://localhost:8080',
    auth0Domain: import.meta.env.VITE_AUTH0_DOMAIN_DEV,
    auth0ClientId: import.meta.env.VITE_AUTH0_CLIENT_ID_DEV,
    auth0Audience: import.meta.env.VITE_AUTH0_AUDIENCE_DEV,
  },
  staging: {
    apiUrl: 'https://api.staging.ytclipper.com',
    auth0Domain: import.meta.env.VITE_AUTH0_DOMAIN_STAGING,
    auth0ClientId: import.meta.env.VITE_AUTH0_CLIENT_ID_STAGING,
    auth0Audience: import.meta.env.VITE_AUTH0_AUDIENCE_STAGING,
  },
  production: {
    apiUrl: 'https://api.ytclipper.com',
    auth0Domain: import.meta.env.VITE_AUTH0_DOMAIN_PROD,
    auth0ClientId: import.meta.env.VITE_AUTH0_CLIENT_ID_PROD,
    auth0Audience: import.meta.env.VITE_AUTH0_AUDIENCE_PROD,
  }
};

const currentConfig = config[ENV as keyof typeof config];

const { auth0Domain, auth0ClientId, auth0Audience } = currentConfig;

const onRedirectCallback = (appState: AppState | undefined) => {
  console.log('Auth0 redirect callback:', { appState });
  const url = new URL(window.location.href);
  url.searchParams.delete('code');
  url.searchParams.delete('state');
  url.searchParams.delete('error');
  url.searchParams.delete('error_description');

  const returnTo = appState?.returnTo || '/dashboard';
  window.history.replaceState({}, document.title, returnTo);
};

createRoot(document.getElementById('root')!).render(
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
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Auth0Provider>
  </StrictMode>,
);
