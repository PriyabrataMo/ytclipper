import { StrictMode } from 'react';

import { Auth0Provider, type AppState } from '@auth0/auth0-react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';

import './index.css';
import App from './App.tsx';

const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
const audience = import.meta.env.VITE_AUTH0_AUDIENCE;

if (!domain || !clientId || !audience) {
  throw new Error('Auth0 environment variables are not set properly.');
}

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
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience,
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
