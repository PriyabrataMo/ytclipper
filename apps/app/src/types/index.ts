export type UniversalResponse<T> = {
  success: boolean;
  data: T;
  timestamp: Date;
  status: number;
};
export interface User {
  status: string;
  id: string;
  email: string;
  name: string;
  picture: string;
  google_id?: string; // Optional field for Google ID
  email_verified: boolean;
  provider?: string; // Add provider field from the API response
  primary_id?: string; // Keep for backward compatibility
  created_at: string;
  updated_at: string;
}

export interface AuthMeResponse {
  user: User;
  auth_methods: Array<'google' | 'password'>;
  access_token?: string; // Optional field for access token
  refresh_token?: string; // Optional field for refresh token
  access_token_expiry?: number; // Optional field for access token expiry
  refresh_token_expiry?: number; // Optional field for refresh token expiry
}

export interface Note {
  id: string;
  timestamp: string; // Format: "MM:SS" or "HH:MM:SS"
  timestampSeconds: number; // Timestamp in seconds for sorting and YouTube API
  content: string;
  createdAt: string;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  youtubeId: string; // YouTube video ID for embedding
  thumbnailUrl: string;
  duration: string; // Format: "MM:SS" or "HH:MM:SS"
  channelName: string;
  createdAt: string;
  notes: Note[];
}

export interface ClipperData {
  videos: Video[];
}
