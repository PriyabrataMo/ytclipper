export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timeFormat: '12h' | '24h';
  defaultVideoQuality: string;
  autoSaveClips: boolean;
  showTimestamps: boolean;
  notificationsEnabled: boolean;
}

export interface Auth0User {
  sub: string;
  email: string;
  name?: string;
  nickname?: string;
  picture?: string;
  email_verified?: boolean;
  updated_at?: string;
  [key: string]: unknown;
}

export interface User {
  id: string;
  email: string;
  name: string;
  username?: string;
  avatarUrl?: string;
  auth0Id: string;
  auth0Sub: string;
  preferences: UserPreferences;
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  planExpiry?: string;
  isActive: boolean;
  totalVideos: number;
  totalClips: number;
  totalPlaylists: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlanLimits {
  maxVideos: number;
  maxClipsPerVideo: number;
  maxPlaylists: number;
  maxSharedPlaylists: number;
  storageGB: number;
  advancedFeatures: boolean;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  auth0Id: string;
  auth0Sub: string;
  username?: string;
  avatarUrl?: string;
  preferences?: Partial<UserPreferences>;
}

export interface UpdateUserRequest {
  name?: string;
  username?: string;
  avatarUrl?: string;
  preferences?: Partial<UserPreferences>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
}
