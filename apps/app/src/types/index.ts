export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  email_verified: boolean;
  primary_provider: string;
  auth_methods: string[];
  has_password: boolean;
  has_google_account: boolean;
  created_at: string;
  updated_at: string;
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
