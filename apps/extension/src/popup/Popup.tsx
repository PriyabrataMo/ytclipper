import React, { useCallback, useEffect, useState } from 'react';

interface UserInfo {
  name?: string;
  email?: string;
  picture?: string;
}

interface StorageResult {
  auth0_token?: string;
  user_info?: UserInfo;
  token_expiry?: number;
  clipper_enabled?: boolean;
}

interface Note {
  id: string;
  videoId: string;
  videoTitle: string;
  timestamp: string;
  title: string;
  content: string;
  createdAt: string;
}

const MY_DOMAIN = 'http://localhost:5173';
const EXTENSION_VERSION = chrome.runtime.getManifest().version;
const mockNotes: Note[] = [
  {
    id: '1',
    videoId: 'dQw4w9WgXcQ',
    videoTitle: 'How to Build Chrome Extensions',
    timestamp: '2:34',
    title: 'Key Insight',
    content: 'Always use content scripts for DOM manipulation in extensions',
    createdAt: '2023-10-15T14:30:00Z',
  },
  {
    id: '2',
    videoId: 'dQw4w9WgXcQ',
    videoTitle: 'How to Build Chrome Extensions',
    timestamp: '5:42',
    title: 'Important Moment',
    content: 'This is where the presenter explains the manifest structure',
    createdAt: '2023-10-14T09:15:00Z',
  },
  {
    id: '3',
    videoId: 'x7X9w_GIm1s',
    videoTitle: 'Advanced React Patterns',
    timestamp: '12:18',
    title: 'Question',
    content: 'How does this pattern scale with large applications?',
    createdAt: '2023-10-12T16:45:00Z',
  },
];

const Popup: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clipperEnabled, setClipperEnabled] = useState<boolean>(true);
  const [currentTabUrl, setCurrentTabUrl] = useState<string>('');
  const [latestNotes, setLatestNotes] = useState<Note[]>([]);

  const checkAuthStatus = useCallback(async () => {
    try {
      const result = (await chrome.storage.sync.get([
        'auth0_token',
        'user_info',
        'token_expiry',
        'clipper_enabled',
      ])) as StorageResult;

      if (
        result.auth0_token &&
        result.user_info &&
        isTokenValid(result.token_expiry)
      ) {
        setUserInfo(result.user_info);
      } else if (result.auth0_token && !isTokenValid(result.token_expiry)) {
        await chrome.storage.sync.remove([
          'auth0_token',
          'token_expiry',
          'user_info',
        ]);
      }
      setClipperEnabled(result.clipper_enabled ?? true);
    } catch (err) {
      console.error('Error checking auth status:', err);
      setError('Failed to check authentication status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();

    chrome.tabs.query(
      {
        active: true,
        currentWindow: true,
      },
      (tabs) => {
        if (tabs[0]?.url) {
          setCurrentTabUrl(tabs[0].url);
        }
      },
    );

    setLatestNotes(mockNotes.slice(0, 3));
  }, [checkAuthStatus]);

  const isTokenValid = (tokenExpiry?: number): boolean => {
    return tokenExpiry ? Date.now() < tokenExpiry : false;
  };

  const toggleClipper = async () => {
    const newState = !clipperEnabled;
    setClipperEnabled(newState);

    try {
      await chrome.storage.sync.set({
        clipper_enabled: newState,
      });
      const [currentTab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (currentTab?.id && currentTab.url?.includes('youtube.com')) {
        try {
          await chrome.tabs.sendMessage(currentTab.id, {
            type: 'TOGGLE_CLIPPER',
            enabled: newState,
          });
        } catch (err) {
          console.error('Error sending message to content script:', err);
        }
      }
    } catch (err) {
      console.error('Error toggling clipper:', err);
      setError('Failed to toggle clipper');
    }
  };

  if (loading) {
    return (
      <div className='popup-container'>
        <div className='loading'>
          <div className='spinner' />
          <p>Loading your YT Clipper...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='popup-container'>
        <div className='error'>
          <h3>⚠️ Error</h3>
          <p>{error}</p>
          <button className='btn-primary' onClick={() => window.close()}>
            Close
          </button>
        </div>
      </div>
    );
  }

  const isOnYouTube = currentTabUrl.includes('youtube.com');
  const isOnVideoPage = currentTabUrl.includes('/watch');

  return (
    <div className='popup-container'>
      <div className='header'>
        <div className='logo'>
          <svg viewBox='0 0 24 24' fill='#FF6B35'>
            <path d='M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z' />
          </svg>
          <h2>YT Clipper</h2>
        </div>
        <div className='version'>v{EXTENSION_VERSION}</div>
      </div>

      {userInfo ? (
        <div className='authenticated'>
          <div className='user-info'>
            {userInfo.picture ? (
              <img
                src={userInfo.picture}
                alt='Profile'
                className='profile-pic'
              />
            ) : (
              <div className='profile-placeholder'>
                {userInfo.name?.charAt(0) || userInfo.email?.charAt(0) || 'U'}
              </div>
            )}
            <div className='user-details'>
              <h3>Welcome back, {userInfo.name?.split(' ')[0] || 'User'}!</h3>
              <p className='email'>{userInfo.email}</p>
            </div>
          </div>

          <div className='status-card'>
            {!isOnYouTube ? (
              <div className='status-content'>
                <div className='status-icon'>
                  <svg viewBox='0 0 24 24' fill='#FF6B35'>
                    <path d='M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z' />
                  </svg>
                </div>
                <div className='status-text'>
                  <h4>To use this extension</h4>
                  <p>Please visit YouTube.com</p>
                </div>
              </div>
            ) : !isOnVideoPage ? (
              <div className='status-content'>
                <div className='status-icon'>
                  <svg viewBox='0 0 24 24' fill='#FF6B35'>
                    <path d='M10 16.5l6-4.5-6-4.5v9zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z' />
                  </svg>
                </div>
                <div className='status-text'>
                  <h4>Ready to clip</h4>
                  <p>Open a video to start taking notes</p>
                </div>
              </div>
            ) : (
              <div className='status-content'>
                <div className='status-icon'>
                  <svg viewBox='0 0 24 24' fill='#4CAF50'>
                    <path d='M18 11c0-.959-.68-1.761-1.581-1.954C16.779 8.445 17 7.75 17 7c0-2.206-1.794-4-4-4-1.516 0-2.822.857-3.5 2.104C8.822 3.857 7.516 3 6 3 3.794 3 2 4.794 2 7c0 .902.312 1.727.817 2.396A1.994 1.994 0 0 0 2 11v8c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-2.638l4 2.4v-7.523l-4 2.4V11zm-5-6c1.103 0 2 .897 2 2s-.897 2-2 2-2-.897-2-2 .897-2 2-2zM6 5c1.103 0 2 .897 2 2s-.897 2-2 2-2-.897-2-2 .897-2 2-2z' />
                  </svg>
                </div>
                <div className='status-text'>
                  <h4>Clipper Active</h4>
                  <p>Click the Quick Note button on the video</p>
                </div>
              </div>
            )}
          </div>

          {latestNotes.length > 0 && (
            <div className='latest-notes'>
              <div className='section-header'>
                <h4>Your Latest Notes</h4>
              </div>
              <div className='notes-list'>
                {latestNotes.map((note) => (
                  <div key={note.id} className='note-item'>
                    <div className='note-header'>
                      <span className='video-title'>{note.videoTitle}</span>
                      <span className='timestamp'>{note.timestamp}</span>
                    </div>
                    <div className='note-content'>
                      <span className='note-title'>{note.title}: </span>
                      <span className='note-text'>{note.content}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className='clipper-toggle'>
            <label>
              <span className='toggle-label'>Enable YouTube Clipper</span>
              <div className='toggle-switch'>
                <input
                  type='checkbox'
                  checked={clipperEnabled}
                  onChange={toggleClipper}
                />
                <span className='slider' />
              </div>
              <span
                className={`status ${clipperEnabled ? 'enabled' : 'disabled'}`}
              >
                {clipperEnabled ? 'ON' : 'OFF'}
              </span>
            </label>
          </div>

          <div className='clipper-actions'>
            <button
              onClick={() => chrome.tabs.create({ url: MY_DOMAIN })}
              className='btn-primary'
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      ) : (
        <div className='unauthenticated'>
          <div className='prompt'>
            <svg viewBox='0 0 24 24' fill='#FF6B35'>
              <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z' />
            </svg>
            <h3>Login Required</h3>
            <p>Please sign in to use YT Clipper</p>
            <button
              onClick={() => chrome.tabs.create({ url: MY_DOMAIN })}
              className='btn-primary'
            >
              Sign In
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Popup;
