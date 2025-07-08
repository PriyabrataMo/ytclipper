import { useAuth0 } from '@auth0/auth0-react';
import { Card, CardHeader, CardTitle, CardContent } from '@ytclipper/ui';
import { Navigate, useLocation } from 'react-router';

import LoginButton from '../components/login-button';

export default function LoginPage() {
  const { isAuthenticated } = useAuth0();
  const location = useLocation();

  // Get the page the user was trying to access
  const from = location.state?.from?.pathname || '/dashboard';

  // If already authenticated, redirect to intended page
  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center">Sign In to YT Clipper</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-gray-600">
            Please sign in to access your dashboard and manage your clips.
          </p>
          <div className="flex justify-center">
            <LoginButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
