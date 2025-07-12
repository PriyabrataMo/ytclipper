import { useState } from 'react';

interface YouTubePlayerProps {
  videoId: string;
  title: string;
}

export const YouTubePlayer = ({ videoId, title }: YouTubePlayerProps) => {
  const [isLoading, setIsLoading] = useState(true);

  const handleLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className='youtube-container'>
      {isLoading ? (
        <div className='absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600' />
        </div>
      ) : null}
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}`}
        title={title}
        className='absolute top-0 left-0 w-full h-full rounded-lg'
        frameBorder='0'
        allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
        allowFullScreen
        onLoad={handleLoad}
      />
    </div>
  );
};
