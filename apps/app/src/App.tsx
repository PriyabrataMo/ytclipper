import { useAuth0 } from '@auth0/auth0-react';
import { Card, CardHeader, CardTitle, CardContent } from '@ytclipper/ui';
import { Routes, Route } from 'react-router';

import Loading from './components/loading';
import ProtectedRoute from './components/protected-route';
import DashboardPage from './pages/dashboard';
import HomePage from './pages/home';
import LoginPage from './pages/login';
import ProfilePage from './pages/profile';

function App() {
  const { isLoading, error } = useAuth0();

  if (error) {
    console.error('Auth0 Error:', error);
    return (
      <div className="p-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-600">Authentication Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Catch all route - redirect to home */}
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
}

export default App;
