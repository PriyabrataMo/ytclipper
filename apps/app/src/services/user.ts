import { useAuth0 } from '@auth0/auth0-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import config from '@/config';
import type {
  ApiResponse,
  Auth0User,
  CreateUserRequest,
  UpdateUserRequest,
  User,
} from '@/types/user';

// Type for the getAccessTokenSilently function
type GetAccessTokenSilently = (options?: {
  authorizationParams?: {
    audience?: string;
    scope?: string;
  };
}) => Promise<string>;

// API functions that take the auth function as parameter
const createUserApi = async (
  userData: CreateUserRequest,
  getAccessTokenSilently: GetAccessTokenSilently,
): Promise<ApiResponse<User>> => {
  try {
    const token = await getAccessTokenSilently({
      authorizationParams: {
        audience: config.auth0Audience,
        scope: 'openid profile email',
      },
    });

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(`${config.apiUrl}/api/v1/users`, {
      method: 'POST',
      headers,
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create user');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

const getCurrentUserApi = async (
  getAccessTokenSilently: GetAccessTokenSilently,
): Promise<ApiResponse<User>> => {
  try {
    const token = await getAccessTokenSilently({
      authorizationParams: {
        audience: config.auth0Audience,
        scope: 'openid profile email',
      },
    });

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(`${config.apiUrl}/api/v1/profile`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get user profile');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting current user:', error);
    throw error;
  }
};

const updateUserApi = async (
  userData: UpdateUserRequest,
  getAccessTokenSilently: GetAccessTokenSilently,
): Promise<ApiResponse<User>> => {
  try {
    const token = await getAccessTokenSilently({
      authorizationParams: {
        audience: config.auth0Audience,
        scope: 'openid profile email',
      },
    });

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(`${config.apiUrl}/api/v1/users/me`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update user');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

const deleteUserApi = async (
  getAccessTokenSilently: GetAccessTokenSilently,
): Promise<ApiResponse<void>> => {
  try {
    const token = await getAccessTokenSilently({
      authorizationParams: {
        audience: config.auth0Audience,
        scope: 'openid profile email',
      },
    });

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(`${config.apiUrl}/api/v1/users/me`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete user');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// React Query hooks
export const useCreateUser = () => {
  const queryClient = useQueryClient();
  const { getAccessTokenSilently } = useAuth0();

  return useMutation({
    mutationFn: (userData: CreateUserRequest) =>
      createUserApi(userData, getAccessTokenSilently),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
};

export const useCurrentUser = () => {
  const {
    isAuthenticated,
    user: auth0User,
    getAccessTokenSilently,
  } = useAuth0();

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUserApi(getAccessTokenSilently),
    enabled: isAuthenticated && !!auth0User,
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const { getAccessTokenSilently } = useAuth0();

  return useMutation({
    mutationFn: (userData: UpdateUserRequest) =>
      updateUserApi(userData, getAccessTokenSilently),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  const { getAccessTokenSilently } = useAuth0();

  return useMutation({
    mutationFn: () => deleteUserApi(getAccessTokenSilently),
    onSuccess: () => {
      queryClient.clear();
    },
  });
};

// Helper function to create user from Auth0 data
export const createUserFromAuth0 = (
  auth0User: Auth0User,
): CreateUserRequest => {
  return {
    email: auth0User.email,
    name: auth0User.name || auth0User.nickname || '',
    auth0Id: auth0User.sub,
    auth0Sub: auth0User.sub,
    username: auth0User.nickname,
    avatarUrl: auth0User.picture,
    preferences: {
      theme: 'light',
      language: 'en',
      timeFormat: '12h',
      defaultVideoQuality: '720p',
      autoSaveClips: true,
      showTimestamps: true,
      notificationsEnabled: true,
    },
  };
};
