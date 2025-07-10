import { StrictMode } from 'react';

import { Auth0Provider, type AppState } from '@auth0/auth0-react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';

import './index.css';
import config from '@/config.ts';

import App from './App.tsx';

const { auth0Domain, auth0ClientId, auth0Audience } = config;
console.log('Config:', config);

const onRedirectCallback = (appState: AppState | undefined) => {
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
