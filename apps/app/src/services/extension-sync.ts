/**
 * Extension Sync Utility
 *
 * Provides centralized functions for syncing authentication state
 * between the web app and Chrome extension.
 */

import type { User } from '@/types';
import { extensionMessaging } from './extension-messaging';

export interface ExtensionSyncResult {
  success: boolean;
  error?: string;
  timestamp: Date;
}

/**
 * Sync authenticated user state to extension
 */
export const syncAuthenticatedUser = async (
  user: User,
): Promise<ExtensionSyncResult> => {
  const timestamp = new Date();

  // Check if extension is available
  if (!extensionMessaging.isAvailable()) {
    return {
      success: true, // Consider it successful when extension is not available
      timestamp,
      error: undefined,
    };
  }

  try {
    const success = await extensionMessaging.notifyAuthUpdate(
      {
        id: user.id,
        email: user.email,
        name: user.name || '',
        createdAt: user.created_at,
      },
      undefined,
      undefined,
    );

    return {
      success,
      timestamp,
      error: success ? undefined : 'Extension sync failed',
    };
  } catch (error) {
    return {
      success: false,
      timestamp,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Sync logout state to extension
 */
export const syncLogout = async (): Promise<ExtensionSyncResult> => {
  const timestamp = new Date();

  if (!extensionMessaging.isAvailable()) {
    return {
      success: true, // Consider it successful when extension is not available
      timestamp,
      error: undefined,
    };
  }

  try {
    const success = await extensionMessaging.notifyAuthLogout();

    return {
      success,
      timestamp,
      error: success ? undefined : 'Extension logout sync failed',
    };
  } catch (error) {
    return {
      success: false,
      timestamp,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Check if extension is available
 */
export const getExtensionStatus = () => {
  return extensionMessaging.getStatus();
};

/**
 * Sync authentication state based on current user status
 */
export const syncAuthState = async (
  isAuthenticated: boolean,
  user: User | null,
): Promise<ExtensionSyncResult> => {
  if (isAuthenticated && user) {
    return syncAuthenticatedUser(user);
  }

  return syncLogout();
};
