import config from '@/config';
import type { User } from '@/types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface AddPasswordRequest {
  password: string;
}

export interface GoogleLoginResponse {
  auth_url: string;
}

class AuthApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = config.apiUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies for authentication
    };

    console.log('🔍 Making request to:', url);
    console.log('🔍 Request config:', config);

    const response = await fetch(url, config);
    const responseData = await response.json();

    console.log('🔍 Response status:', response.status);
    console.log('🔍 Response data:', responseData);

    if (!response.ok) {
      const errorMessage =
        responseData.error?.message ||
        responseData.message ||
        `HTTP error! status: ${response.status}`;
      console.log('❌ Request failed:', errorMessage);
      throw new Error(errorMessage);
    }

    // Handle structured response format
    if (responseData.success && responseData.data !== undefined) {
      return responseData.data;
    }

    // Handle direct response format
    return responseData;
  }

  async getCurrentUser(): Promise<User | null> {
    console.log('🔍 Fetching current user...');
    if (!config.apiUrl) {
      throw new Error('API URL is not configured');
    }
    console.log('🔍 API URL:', config.apiUrl);
    console.log('🔍 Requesting user data from:', `${this.baseURL}/auth/me`);
    // Attempt to fetch the current user
    console.log('🔍 Making request to /auth/me');
    try {
      const response = await this.request<User>('/auth/me');
      console.log('✅ getCurrentUser success:', response);
      return response;
    } catch (error) {
      console.log('❌ getCurrentUser error:', error);
      if (
        error instanceof Error &&
        (error.message.includes('401') || error.message.includes('NO_TOKEN'))
      ) {
        console.log('🔍 Auth error detected, returning null');
        return null;
      }
      throw error;
    }
  }

  async login(credentials: LoginRequest): Promise<User> {
    const response = await this.request<{ user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    return response.user;
  }

  async register(userData: RegisterRequest): Promise<User> {
    const response = await this.request<{ user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return response.user;
  }

  async loginWithGoogle(): Promise<GoogleLoginResponse> {
    // Get the auth URL from the backend first
    const response = await this.request<GoogleLoginResponse>(
      '/auth/google/login',
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Origin: window.location.origin, // Explicitly set the origin
        },
      },
    );

    // Now redirect to the Google OAuth URL
    window.location.href = response.auth_url;
    return response;
  }

  async logout(): Promise<void> {
    await this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    await this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    await this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verifyEmail(data: VerifyEmailRequest): Promise<void> {
    await this.request('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async addPassword(data: AddPasswordRequest): Promise<void> {
    await this.request('/auth/add-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async handleAuthCallback(): Promise<boolean> {
    try {
      console.log('🔍 Starting auth callback handling...');
      // After OAuth callback, check if user is authenticated
      const user = await this.getCurrentUser();
      console.log('🔍 Auth callback - user data:', user);
      const isAuthenticated = !!user;
      console.log('🔍 Auth callback result:', isAuthenticated);
      return isAuthenticated;
    } catch (error) {
      console.error('❌ Auth callback error:', error);
      return false;
    }
  }
}

export const authApi = new AuthApiService();
