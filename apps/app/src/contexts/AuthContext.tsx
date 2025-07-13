import type { User } from '@/services/auth';
import authService from '@/services/auth';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = authService.onAuthStateChanged(user => {
      setUser(user);
      setIsAuthenticated(!!user);
      setIsLoading(false);
    });

    // Handle OAuth callback on app load
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('auth') === 'success') {
        await authService.handleAuthCallback();
      }
    };

    handleCallback();

    return unsubscribe;
  }, []);

  const login = async () => {
    try {
      await authService.loginWithGoogle();
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  const refreshToken = async () => {
    try {
      return await authService.refreshToken();
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
