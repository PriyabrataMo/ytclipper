import { useEffect, useState } from 'react';

import { type Video } from '@/types';

import { mockData } from '../data';

export const useVideos = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 100));
        setVideos(mockData.videos);
      } catch (err) {
        setError('Failed to load videos');
        console.error('Error fetching videos:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const getVideoById = (id: string): Video | undefined => {
    return videos.find((video) => video.id === id);
  };

  const searchVideos = (query: string): Video[] => {
    if (!query.trim()) {
      return videos;
    }

    const lowercaseQuery = query.toLowerCase();
    return videos.filter(
      (video) =>
        video.title.toLowerCase().includes(lowercaseQuery) ||
        video.description.toLowerCase().includes(lowercaseQuery) ||
        video.channelName.toLowerCase().includes(lowercaseQuery) ||
        video.notes.some((note) =>
          note.content.toLowerCase().includes(lowercaseQuery),
        ),
    );
  };

  return {
    videos,
    loading,
    error,
    getVideoById,
    searchVideos,
  };
};

export const useVideo = (videoId?: string) => {
  const { videos, loading, error } = useVideos();
  const video = videos.find((v) => v.id === videoId);

  return {
    video,
    loading,
    error,
  };
};
