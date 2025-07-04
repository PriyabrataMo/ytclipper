import React, { useState, useEffect } from 'react';
import {
  Clock,
  Plus,
  Settings,
  RefreshCw,
  Download,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { LoginScreen } from '../components/LoginScreen';

interface Timestamp {
  id: string;
  timestamp: number;
  title: string;
  note: string;
  tags: string[];
  createdAt: string;
}

interface YouTubeTab {
  id: number;
  url: string;
  title: string;
  videoId?: string;
}

export const Popup: React.FC = () => {
  const auth = useAuth();
  const [currentTab, setCurrentTab] = useState<YouTubeTab | null>(null);
  const [timestamps, setTimestamps] = useState<Timestamp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTimestamp, setNewTimestamp] = useState({
    title: '',
    note: '',
    tags: '',
  });
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    initializePopup();
  }, []);

  const initializePopup = async () => {
    try {
      // Get current active tab
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      const tab = tabs[0];

      if (tab && tab.url?.includes('youtube.com/watch')) {
        const videoId = extractVideoId(tab.url);
        setCurrentTab({
          id: tab.id!,
          url: tab.url,
          title: tab.title || 'YouTube Video',
          videoId,
        });

        // Load timestamps for this video
        if (videoId) {
          await loadTimestamps(videoId);
        }
      }
    } catch (error) {
      console.error('Failed to initialize popup:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const extractVideoId = (url: string): string | undefined => {
    const match = url.match(/[?&]v=([^&]+)/);
    return match ? match[1] : undefined;
  };

  const loadTimestamps = async (videoId: string) => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_TIMESTAMPS',
        data: { videoId },
      });

      if (response.success) {
        setTimestamps(response.timestamps);
      }
    } catch (error) {
      console.error('Failed to load timestamps:', error);
    }
  };

  const getCurrentTime = async (): Promise<number> => {
    return new Promise(resolve => {
      if (currentTab?.id) {
        chrome.tabs.sendMessage(
          currentTab.id,
          { type: 'GET_CURRENT_TIME' },
          response => {
            resolve(response?.currentTime || 0);
          }
        );
      } else {
        resolve(0);
      }
    });
  };

  const handleAddTimestamp = async () => {
    if (!currentTab?.videoId) return;

    try {
      const currentTime = await getCurrentTime();

      const response = await chrome.runtime.sendMessage({
        type: 'SAVE_TIMESTAMP',
        data: {
          videoId: currentTab.videoId,
          timestamp: currentTime,
          title:
            newTimestamp.title || `Timestamp at ${formatTime(currentTime)}`,
          note: newTimestamp.note,
          tags: newTimestamp.tags
            .split(',')
            .map(tag => tag.trim())
            .filter(Boolean),
        },
      });

      if (response.success) {
        setTimestamps(prev => [...prev, response.timestamp]);
        setNewTimestamp({ title: '', note: '', tags: '' });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Failed to add timestamp:', error);
    }
  };

  const jumpToTimestamp = async (timestamp: number) => {
    if (currentTab?.id) {
      await chrome.tabs.sendMessage(currentTab.id, {
        type: 'JUMP_TO_TIME',
        data: { timestamp },
      });
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Show login screen if not authenticated
  if (!auth.isAuthenticated) {
    return (
      <LoginScreen
        onLogin={auth.login}
        onRegister={auth.register}
        isLoading={auth.isLoading}
        error={auth.error}
        onClearError={auth.clearError}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="popup-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!currentTab || !currentTab.videoId) {
    return (
      <div className="popup-container">
        <div className="header">
          <div className="logo">
            <Clock size={24} />
            <span>YTClipper</span>
          </div>
        </div>
        <div className="not-youtube">
          <p>Navigate to a YouTube video to start collecting timestamps.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="popup-container">
      <div className="header">
        <div className="logo">
          <Clock size={20} />
          <span>YTClipper</span>
        </div>
        <div className="header-actions">
          <button
            className="icon-button"
            onClick={() => setShowAddForm(!showAddForm)}
            title="Add timestamp"
          >
            <Plus size={16} />
          </button>
          <button className="icon-button" title="Sync with backend">
            <RefreshCw size={16} />
          </button>
          <button className="icon-button" title="Settings">
            <Settings size={16} />
          </button>
          <button
            className="icon-button"
            onClick={auth.logout}
            title={`Logout (${auth.user?.email})`}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      <div className="video-info">
        <h3>{currentTab.title}</h3>
        <p>{timestamps.length} timestamps collected</p>
      </div>

      {showAddForm && (
        <div className="add-form">
          <input
            type="text"
            placeholder="Timestamp title (optional)"
            value={newTimestamp.title}
            onChange={e =>
              setNewTimestamp(prev => ({ ...prev, title: e.target.value }))
            }
          />
          <textarea
            placeholder="Notes (optional)"
            value={newTimestamp.note}
            onChange={e =>
              setNewTimestamp(prev => ({ ...prev, note: e.target.value }))
            }
          />
          <input
            type="text"
            placeholder="Tags (comma-separated)"
            value={newTimestamp.tags}
            onChange={e =>
              setNewTimestamp(prev => ({ ...prev, tags: e.target.value }))
            }
          />
          <div className="form-actions">
            <button onClick={handleAddTimestamp} className="btn-primary">
              Add Timestamp
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="timestamps-list">
        {timestamps.length === 0 ? (
          <div className="empty-state">
            <p>No timestamps yet. Click + to add your first timestamp!</p>
          </div>
        ) : (
          timestamps.map(timestamp => (
            <div key={timestamp.id} className="timestamp-item">
              <div
                className="timestamp-time"
                onClick={() => jumpToTimestamp(timestamp.timestamp)}
              >
                {formatTime(timestamp.timestamp)}
              </div>
              <div className="timestamp-content">
                <div className="timestamp-title">{timestamp.title}</div>
                {timestamp.note && (
                  <div className="timestamp-note">{timestamp.note}</div>
                )}
                {timestamp.tags.length > 0 && (
                  <div className="timestamp-tags">
                    {timestamp.tags.map(tag => (
                      <span key={tag} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="footer">
        <button className="btn-secondary" title="Export timestamps">
          <Download size={14} />
          Export
        </button>
      </div>
    </div>
  );
};
