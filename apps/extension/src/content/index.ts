import { logger } from '@ytclipper/extension-dev-utils';
import './content.css';
import './style.css';

// TypeScript interfaces
interface Timestamp {
  id: string;
  timestamp: number;
  title: string;
  note: string;
  tags: string[];
  createdAt: string;
}

interface YouTubePageData {
  videoId: string;
  title: string;
  currentTime: number;
}

// Content script for YouTube pages
logger.info('YTClipper content script loaded');

class YouTubeHandler {
  private player: HTMLVideoElement | null = null;
  private currentVideoId: string | null = null;
  private observers: MutationObserver[] = [];
  private floatingButton: HTMLDivElement | null = null;
  private floatingButtonTimeout: number | null = null;
  private isAuthenticated: boolean = false;

  constructor() {
    this.init();
  }

  private init() {
    this.checkAuthentication();
    this.waitForPlayer();
    this.observeUrlChanges();
    this.setupAuthListener();
    this.injectUI();
  }

  private setupAuthListener() {
    // Listen for authentication changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local' && (changes.authToken || changes.currentUser)) {
        this.checkAuthentication().then(() => {
          if (!this.isAuthenticated) {
            this.hideFloatingButton();
          }
        });
      }
    });
  }

  private async checkAuthentication() {
    try {
      const result = await chrome.storage.local.get([
        'authToken',
        'currentUser',
      ]);
      this.isAuthenticated = !!(result.authToken && result.currentUser);
      logger.info('Authentication status:', this.isAuthenticated);
    } catch (error) {
      logger.error('Failed to check authentication:', error);
      this.isAuthenticated = false;
    }
  }

  private waitForPlayer() {
    const checkPlayer = () => {
      this.player = document.querySelector('video') as HTMLVideoElement;
      if (this.player) {
        logger.info('YouTube player found');
        this.setupPlayerEvents();
        this.detectVideoChange();
      } else {
        setTimeout(checkPlayer, 1000);
      }
    };
    checkPlayer();
  }

  private setupPlayerEvents() {
    if (!this.player) return;

    // Add keyboard shortcut for quick timestamp saving (Ctrl+Shift+T)
    document.addEventListener('keydown', e => {
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        this.saveQuickTimestamp();
      }
    });

    // Show floating button after 10 seconds of video play
    this.player.addEventListener('play', () => {
      this.scheduleFloatingButton();
    });

    this.player.addEventListener('pause', () => {
      this.clearFloatingButtonSchedule();
    });
  }

  private scheduleFloatingButton() {
    if (!this.isAuthenticated) return;

    this.clearFloatingButtonSchedule();
    this.floatingButtonTimeout = window.setTimeout(() => {
      this.showFloatingButton();
    }, 10000); // Show after 10 seconds
  }

  private clearFloatingButtonSchedule() {
    if (this.floatingButtonTimeout) {
      clearTimeout(this.floatingButtonTimeout);
      this.floatingButtonTimeout = null;
    }
  }

  private showFloatingButton() {
    if (this.floatingButton || !this.isAuthenticated) return;

    this.floatingButton = document.createElement('div');
    this.floatingButton.className = 'ytclipper-floating-container';
    this.floatingButton.innerHTML = this.createFloatingButtonHTML();

    document.body.appendChild(this.floatingButton);

    // Add event listeners
    this.setupFloatingButtonEvents();
  }

  private createFloatingButtonHTML(): string {
    const currentTime = this.player?.currentTime || 0;
    const formattedTime = this.formatTime(currentTime);

    return `
      <div class="ytclipper-floating-button">
        <button class="ytclipper-quick-add" data-action="quick-add" title="Add timestamp at ${formattedTime}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12,6 12,12 16,14"/>
          </svg>
          <span>${formattedTime}</span>
        </button>
        
        <button class="ytclipper-detailed-add" data-action="detailed-add" title="Add timestamp with details">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
        
        <button class="ytclipper-close" data-action="close" title="Close timestamp tool">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    `;
  }

  private setupFloatingButtonEvents() {
    if (!this.floatingButton) return;

    this.floatingButton.addEventListener('click', e => {
      const target = e.target as HTMLElement;
      const button = target.closest('button') as HTMLButtonElement;
      const action = button?.dataset.action;

      switch (action) {
        case 'quick-add':
          this.handleQuickAddFromFloat();
          break;
        case 'detailed-add':
          this.handleDetailedAddFromFloat();
          break;
        case 'close':
          this.hideFloatingButton();
          break;
      }
    });
  }

  private async handleQuickAddFromFloat() {
    await this.saveQuickTimestamp();
    this.hideFloatingButton();
  }

  private handleDetailedAddFromFloat() {
    // For now, just do quick add. Could expand to show form later
    this.handleQuickAddFromFloat();
  }

  private hideFloatingButton() {
    if (this.floatingButton) {
      this.floatingButton.remove();
      this.floatingButton = null;
    }
    this.clearFloatingButtonSchedule();
  }

  private observeUrlChanges() {
    // Watch for URL changes in YouTube SPA
    let lastUrl = location.href;
    const observer = new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        this.detectVideoChange();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    this.observers.push(observer);
  }

  private detectVideoChange() {
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('v');

    if (videoId && videoId !== this.currentVideoId) {
      this.currentVideoId = videoId;
      logger.info('Video changed:', videoId);
      this.hideFloatingButton(); // Hide floating button when video changes
      this.loadTimestamps();
    }
  }

  private async loadTimestamps() {
    if (!this.currentVideoId) return;

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_TIMESTAMPS',
        data: { videoId: this.currentVideoId },
      });

      if (response.success) {
        this.displayTimestamps(response.timestamps);
      }
    } catch (error) {
      logger.error('Failed to load timestamps:', error);
    }
  }

  private displayTimestamps(timestamps: Timestamp[]) {
    // Remove existing timestamp markers
    document
      .querySelectorAll('.ytclipper-timestamp')
      .forEach(el => el.remove());

    // Add timestamp markers to the video progress bar
    const progressBar = document.querySelector('.ytp-progress-bar-container');
    if (progressBar && timestamps.length > 0) {
      timestamps.forEach(timestamp => {
        this.addTimestampMarker(timestamp, progressBar as HTMLElement);
      });
    }
  }

  private addTimestampMarker(timestamp: Timestamp, container: HTMLElement) {
    const marker = document.createElement('div');
    marker.className = 'ytclipper-timestamp';
    marker.title = `${timestamp.title} - ${this.formatTime(timestamp.timestamp)}`;
    marker.style.cssText = `
      position: absolute;
      top: 0;
      bottom: 0;
      width: 2px;
      background-color: #ff6b35;
      cursor: pointer;
      z-index: 1000;
      left: ${(timestamp.timestamp / (this.player?.duration || 1)) * 100}%;
    `;

    marker.addEventListener('click', () => {
      if (this.player) {
        this.player.currentTime = timestamp.timestamp;
      }
    });

    container.appendChild(marker);
  }

  private async saveQuickTimestamp() {
    if (!this.player || !this.currentVideoId) return;

    const pageData = this.getPageData();
    if (!pageData) return;

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SAVE_TIMESTAMP',
        data: {
          videoId: pageData.videoId,
          timestamp: pageData.currentTime,
          title: `Timestamp at ${this.formatTime(pageData.currentTime)}`,
          note: '',
          tags: [],
        },
      });

      if (response.success) {
        this.showNotification('Timestamp saved!');
        this.loadTimestamps(); // Refresh timestamp display
      } else {
        this.showNotification('Failed to save timestamp', 'error');
      }
    } catch (error) {
      logger.error('Failed to save timestamp:', error);
      this.showNotification('Failed to save timestamp', 'error');
    }
  }

  private getPageData(): YouTubePageData | null {
    if (!this.player || !this.currentVideoId) return null;

    const titleElement = document.querySelector(
      'h1.ytd-watch-metadata yt-formatted-string',
    );
    const title = titleElement?.textContent || 'Unknown Video';

    return {
      videoId: this.currentVideoId,
      title,
      currentTime: this.player.currentTime,
    };
  }

  private formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  private showNotification(
    message: string,
    type: 'success' | 'error' = 'success',
  ) {
    const notification = document.createElement('div');
    notification.className = 'ytclipper-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 24px;
      background-color: ${type === 'success' ? '#4CAF50' : '#f44336'};
      color: white;
      border-radius: 8px;
      z-index: 10000;
      font-size: 14px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      transition: all 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateY(-20px)';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  private injectUI() {
    // Inject the timestamp collection UI component
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('src/content-ui/index.js');
    document.head.appendChild(script);
  }

  public destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.hideFloatingButton();
  }
}

// Initialize the YouTube handler
const youtubeHandler = new YouTubeHandler();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  youtubeHandler.destroy();
});
