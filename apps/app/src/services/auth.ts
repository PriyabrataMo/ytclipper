import config from '@/config';

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  provider: string;
  emailVerified: boolean;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

class AuthService {
  private apiUrl: string;
  private user: User | null = null;
  private isAuthenticated = false;
  private listeners: Array<(user: User | null) => void> = [];

  constructor() {
    this.apiUrl = config.apiUrl;
    this.checkAuthStatus();
  }

  // Check if user is authenticated on app load
  private async checkAuthStatus() {
    try {
      const response = await fetch(`${this.apiUrl}/auth/me`, {
        credentials: 'include',
      });

      if (response.ok) {
        const user = await response.json();
        this.setUser(user);
      } else {
        this.setUser(null);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      this.setUser(null);
    }
  }

  // Login with Google
  async loginWithGoogle() {
    try {
      const response = await fetch(`${this.apiUrl}/auth/google/login`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to Google OAuth
        window.location.href = data.auth_url;
      } else {
        throw new Error('Failed to initiate Google login');
      }
    } catch (error) {
      console.error('Error during Google login:', error);
      throw error;
    }
  }

  // Handle OAuth callback (called when user returns from Google)
  async handleAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const authSuccess = urlParams.get('auth');

    if (authSuccess === 'success') {
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);

      // Refresh auth status
      await this.checkAuthStatus();
      return true;
    }

    return false;
  }

  // Logout
  async logout() {
    try {
      await fetch(`${this.apiUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      this.setUser(null);
    }
  }

  // Refresh access token
  async refreshToken(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        return true;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
    }

    this.setUser(null);
    return false;
  }

  // Make authenticated API requests
  async apiRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.apiUrl}${endpoint}`;
    const defaultOptions: RequestInit = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const requestOptions = { ...defaultOptions, ...options };

    try {
      let response = await fetch(url, requestOptions);

      // If unauthorized, try to refresh token
      if (response.status === 401) {
        const refreshSuccess = await this.refreshToken();
        if (refreshSuccess) {
          // Retry the original request
          response = await fetch(url, requestOptions);
        } else {
          // Refresh failed, user needs to login again
          this.setUser(null);
          throw new Error('Authentication required');
        }
      }

      return response;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // Email/password authentication methods
  async login(email: string, password: string): Promise<User> {
    const response = await this.apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    const user = data.user;

    this.setUser(user);
    return user;
  }

  async register(name: string, email: string, password: string): Promise<User> {
    const response = await this.apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    const data = await response.json();
    const user = data.user;

    this.setUser(user);
    return user;
  }

  async forgotPassword(email: string): Promise<void> {
    const response = await this.apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send reset email');
    }
  }

  async resetPassword(token: string, password: string): Promise<void> {
    const response = await this.apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Password reset failed');
    }
  }

  async verifyEmail(token: string): Promise<void> {
    const response = await this.apiRequest('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Email verification failed');
    }
  }

  // Set user and notify listeners
  private setUser(user: User | null) {
    this.user = user;
    this.isAuthenticated = !!user;
    this.listeners.forEach(listener => listener(user));
  }

  // Get current user
  getUser(): User | null {
    return this.user;
  }

  // Check if user is authenticated
  isAuth(): boolean {
    return this.isAuthenticated;
  }

  // Subscribe to auth state changes
  onAuthStateChanged(callback: (user: User | null) => void) {
    this.listeners.push(callback);

    // Call immediately with current state
    callback(this.user);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Get access token from cookie (for manual API calls)
  async getAccessToken(): Promise<string | null> {
    try {
      const response = await fetch(`${this.apiUrl}/auth/token`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        return data.access_token;
      }
    } catch (error) {
      console.error('Error getting access token:', error);
    }

    return null;
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
