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

// Re-export user types
export * from './user';
