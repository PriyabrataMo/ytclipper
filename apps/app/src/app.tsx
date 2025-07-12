import { useEffect } from 'react';

import { useAuth0 } from '@auth0/auth0-react';
import { Route, Routes } from 'react-router';

import Loading from '@/components/loading';
import ProtectedRoute from '@/components/protected-route';
import {
  AuthBridge,
  DashboardPage,
  HomePage,
  LoginPage,
  ProfilePage,
  VideoDetailPage,
  VideosPage,
} from '@/pages';

const App = () => {
  const { isLoading, isAuthenticated, getAccessTokenSilently, user } =
    useAuth0();

  useEffect(() => {
    const syncTokenWithExtension = async () => {
      if (isAuthenticated) {
        try {
          const token = await getAccessTokenSilently();
          console.log(
            'Got token from Auth0:',
            token ? 'Token exists' : 'No token',
          );
          const message = {
            type: 'AUTH0_TOKEN_UPDATE',
            token,
            expiry: Date.now() + 60 * 60 * 1000, // 1 hour
            user,
          };

          console.log('Sending message to extension:', message);
          window.postMessage(message, 'http://localhost:5173');
        } catch (error) {
          console.error('Failed to get token:', error);
        }
      }
    };

    syncTokenWithExtension();
  }, [isAuthenticated, getAccessTokenSilently, user]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Routes>
      <Route path='/' element={<HomePage />} />
      <Route path='/auth-bridge' element={<AuthBridge />} />
      <Route path='/login' element={<LoginPage />} />
      <Route
        path='/videos'
        element={
          <ProtectedRoute>
            <VideosPage />
          </ProtectedRoute>
        }
      />
      <Route
        path='/video/:id'
        element={
          <ProtectedRoute>
            <VideoDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path='/dashboard'
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path='/profile'
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default App;
