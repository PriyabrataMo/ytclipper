import React from 'react';

import { Button } from '@ytclipper/ui';

import type { LoginCredentials, RegisterCredentials } from '../types/auth';

interface LoginScreenProps {
  onLogin: (
    credentials: LoginCredentials,
  ) => Promise<{ success: boolean; error?: string }>;
  onRegister: (
    credentials: RegisterCredentials,
  ) => Promise<{ success: boolean; error?: string }>;
  isLoading: boolean;
  error: string | null;
  onClearError: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = () => {
  const handleLogin = () => {
    chrome.tabs.create({
      url: 'https://app.ytclipper.com',
    });
  };
  return (
    <div className='login-container'>
      <div className='login-header'>
        <div className='login-logo'>
          <span>clock</span>
          <h1>YTClipper</h1>
        </div>
      </div>
      <Button onClick={handleLogin}>Login</Button>
      <div className='login-footer'>
        <p>Connect to collect and sync your YouTube timestamps</p>
      </div>
    </div>
  );
};
