import React, { useEffect } from 'react';

import { useAuth0 } from '@auth0/auth0-react';
import { Navigate, useLocation } from 'react-router';

import {
  createUserFromAuth0,
  useCreateUser,
  useCurrentUser,
} from '@/services/user';
import type { Auth0User } from '@/types/user';

import Loading from './loading';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user: auth0User } = useAuth0();
  const location = useLocation();

  // React Query hooks for user management
  const {
    data: currentUserResponse,
    isLoading: isUserLoading,
    error: userError,
  } = useCurrentUser();
  const createUserMutation = useCreateUser();

  // Auto-create user in database when authenticated
  useEffect(() => {
    if (
      isAuthenticated &&
      auth0User &&
      !isUserLoading &&
      !currentUserResponse?.data &&
      !userError
    ) {
      // User is authenticated but doesn't exist in our database yet
      const userData = createUserFromAuth0(auth0User as Auth0User);

      createUserMutation.mutate(userData, {
        onSuccess: (response) => {
          console.log('User created successfully:', response.data);
        },
        onError: (error) => {
          console.error('Failed to create user:', error);
          // Continue anyway - user might already exist or be created by another request
        },
      });
    }
  }, [
    isAuthenticated,
    auth0User,
    isUserLoading,
    currentUserResponse,
    userError,
    createUserMutation,
  ]);

  if (isLoading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return <Navigate to='/login' state={{ from: location }} replace />;
  }

  // Show loading while we're creating or fetching user data
  if (isAuthenticated && (isUserLoading || createUserMutation.isPending)) {
    return <Loading />;
  }

  return children;
};

export default ProtectedRoute;
