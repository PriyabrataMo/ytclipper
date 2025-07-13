import './content.css';

interface ClipperState {
  clipper_enabled?: boolean;
}
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

class YouTubeHandler {
  private player: HTMLVideoElement | null = null;
  private currentVideoId: string | null = null;
  private observers: MutationObserver[] = [];
  private isAuthenticated: boolean = true;
  private clipperEnabled: boolean = true;
  private clipButton: HTMLButtonElement | null = null;
  private notePanel: HTMLElement | null = null;
  private currentTimestamp: number | null = null;
  private tagsContainer: HTMLElement | null = null;

  constructor() {
    this.init();
    this.initializeClipperState();
  }

  private init() {
    this.checkAuthentication();
    this.waitForPlayer();
    this.observeUrlChanges();
  }

  private initializeClipperState() {
    try {
      const result = chrome.storage.sync.get('clipper_enabled') as ClipperState;
      this.clipperEnabled = result?.clipper_enabled ?? true;
    } catch (error) {
      console.error('Failed to initialize clipper state:', error);
      this.clipperEnabled = true;
    }
  }

  handleClipperToggle(enabled: boolean) {
    this.clipperEnabled = enabled;
    this.updateClipButtonVisibility();
  }

  private async checkAuthentication() {
    try {
      const result = await chrome.storage.sync.get([
        'auth0_token',
        'user_info',
      ]);

      this.isAuthenticated = !!(result.auth0_token && result.user_info);
      this.updateClipButtonVisibility();
    } catch (error) {
      console.error('Failed to check authentication:', error);
      this.isAuthenticated = false;
      this.updateClipButtonVisibility();
    }
  }

  private waitForPlayer() {
    const checkPlayer = () => {
      this.player = document.querySelector('video') as HTMLVideoElement;
      console.log('Checking for YouTube player:', this.player);
      if (this.player) {
        this.detectVideoChange();
        this.injectClipButton();
      } else {
        setTimeout(checkPlayer, 1000);
      }
    };

    console.log('Waiting for YouTube player...');
    checkPlayer();
  }

  private injectClipButton() {
    const controlBar = document.querySelector('.ytp-chrome-controls');

    if (!controlBar) {
      setTimeout(() => this.injectClipButton(), 500);
      return;
    }
    this.clipButton = document.createElement('button');
    this.clipButton.id = 'yt-clipper-button';
    this.clipButton.className = 'ytp-button yt-clipper-custom';
    this.clipButton.title = 'Save clip at current time';
    this.clipButton.setAttribute('aria-label', 'Save clip at current time');

    const textSpan = document.createElement('span');
    textSpan.textContent = 'Quick Note';
    textSpan.style.cssText = `
    pointer-events: none;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
  `;
    this.clipButton.appendChild(textSpan);

    this.clipButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.openNotePanel();
    });
    controlBar.appendChild(this.clipButton);
    this.updateClipButtonStyles();
    this.updateClipButtonVisibility();
  }

  injectNotePanel() {
    if (document.getElementById('yt-clipper-note-panel')) {
      return;
    }

    const panelHTML = `
      <div class="yt-clipper-note-panel" id="yt-clipper-note-panel">
        <div class="yt-clipper-panel-header">
          <div class="yt-clipper-panel-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Add Note
          </div>
          <button class="yt-clipper-close-btn" id="yt-clipper-close-btn">×</button>
        </div>
        <div class="yt-clipper-timestamp-info" id="yt-clipper-timestamp-info">
          📍 Current time: <strong>0:00</strong>
        </div>
        <form class="yt-clipper-note-form">
          <div class="yt-clipper-form-group">
            <label class="yt-clipper-form-label">Quick Actions</label>
            <div class="yt-clipper-quick-actions">
              <button type="button" class="yt-clipper-quick-action" data-note="Important moment">⭐ Important</button>
              <button type="button" class="yt-clipper-quick-action" data-note="Key insight">💡 Insight</button>
              <button type="button" class="yt-clipper-quick-action" data-note="Question">❓ Question</button>
              <button type="button" class="yt-clipper-quick-action" data-note="Action item">✅ Action</button>
            </div>
          </div>
          <div class="yt-clipper-form-group">
            <label class="yt-clipper-form-label" for="yt-clipper-noteTitle">Note Title</label>
            <input type="text" id="yt-clipper-noteTitle" class="yt-clipper-form-input" placeholder="Give your note a title..." />
          </div>
          <div class="yt-clipper-form-group">
            <label class="yt-clipper-form-label" for="yt-clipper-noteContent">Note Content</label>
            <textarea id="yt-clipper-noteContent" class="yt-clipper-form-input yt-clipper-form-textarea" placeholder="Write your note here..."></textarea>
          </div>
          <div class="yt-clipper-form-group">
            <label class="yt-clipper-form-label" for="yt-clipper-noteTags">Tags</label>
            <input type="text" id="yt-clipper-noteTags" class="yt-clipper-form-input" placeholder="Add tags (press Enter to add)" />
            <div class="yt-clipper-tags-input" id="yt-clipper-tags-container"></div>
          </div>
        </form>
        <div class="yt-clipper-action-buttons">
          <button class="yt-clipper-btn yt-clipper-btn-secondary" id="yt-clipper-cancel-btn">Cancel</button>
          <button class="yt-clipper-btn yt-clipper-btn-primary" id="yt-clipper-save-btn">Save Note</button>
        </div>
      </div>
    `;

    const panelContainer = document.createElement('div');
    panelContainer.innerHTML = panelHTML;
    document.body.appendChild(panelContainer);
    this.notePanel = document.getElementById('yt-clipper-note-panel');
    this.tagsContainer = document.getElementById('yt-clipper-tags-container');

    this.setupPanelEvents();
  }

  private setupPanelEvents() {
    // Panel toggle
    document
      .getElementById('yt-clipper-close-btn')
      ?.addEventListener('click', () => this.togglePanel(false));
    document
      .getElementById('yt-clipper-cancel-btn')
      ?.addEventListener('click', () => this.togglePanel(false));

    // Save handler
    document
      .getElementById('yt-clipper-save-btn')
      ?.addEventListener('click', () => this.saveNoteFromPanel());

    // Quick actions
    document.querySelectorAll('.quick-action').forEach((button) => {
      button.addEventListener('click', (e) => {
        const noteText = (e.target as HTMLElement).dataset.note || '';
        this.setQuickNote(noteText);
      });
    });

    // Tags input
    document
      .getElementById('yt-clipper-noteTags')
      ?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const input = e.target as HTMLInputElement;
          const tagText = input.value.trim();
          if (tagText) {
            this.addTag(tagText);
            input.value = '';
          }
        }
      });

    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.notePanel?.classList.contains('open')) {
        this.togglePanel(false);
      }
    });
  }

  private addTag(tagText: string) {
    if (!this.tagsContainer) {
      return;
    }

    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.innerHTML = `${tagText} <span class="tag-remove">×</span>`;
    this.tagsContainer.appendChild(tag);

    tag.querySelector('.tag-remove')?.addEventListener('click', () => {
      tag.remove();
    });
  }

  private togglePanel(open: boolean) {
    if (!this.notePanel) {
      return;
    }

    const videoContainer = document.querySelector('.html5-video-player');
    if (open) {
      this.notePanel.classList.add('open');
      videoContainer?.classList.add('yt-clipper-panel-open');
      setTimeout(() => {
        (
          document.getElementById('yt-clipper-noteTitle') as HTMLInputElement
        )?.focus();
      }, 300);
    } else {
      this.notePanel.classList.remove('open');
      videoContainer?.classList.remove('panel-open');
    }
  }

  private setQuickNote(noteText: string) {
    const titleInput = document.getElementById(
      'yt-clipper-noteTitle',
    ) as HTMLInputElement;
    const contentInput = document.getElementById(
      'yt-clipper-noteContent',
    ) as HTMLTextAreaElement;

    if (!titleInput.value) {
      titleInput.value = noteText;
    }

    contentInput.focus();
  }

  private openNotePanel() {
    if (!this.player || !this.currentVideoId) {
      return;
    }

    this.currentTimestamp = this.player.currentTime;
    const pageData = this.getPageData();
    if (!pageData) {
      return;
    }

    // Update timestamp info
    const timestampInfo = document.getElementById('yt-clipper-timestamp-info');
    if (timestampInfo) {
      timestampInfo.innerHTML = `📍 Current time: <strong>${this.formatTime(this.currentTimestamp)}</strong> | Video: "${pageData.title}"`;
    }

    // Reset form
    (
      document.getElementById('yt-clipper-noteTitle') as HTMLInputElement
    ).value = '';
    (
      document.getElementById('yt-clipper-noteContent') as HTMLTextAreaElement
    ).value = '';
    if (this.tagsContainer) {
      this.tagsContainer.innerHTML = '';
    }

    this.togglePanel(true);
  }

  private updateClipButtonStyles() {
    const button = this.clipButton;
    if (!button) {
      return;
    }

    // Position button at center of bottom control bar
    button.style.cssText = `
    position: absolute !important;
    left: 50% !important;
    top: 50% !important;
    transform: translate(-50%, -50%) !important;
    background: rgba(0, 0, 0, 0.8) !important;
    border: 2px solid #FF6B35 !important;
    border-radius: 10px !important;
    color: #FF6B35 !important;
    cursor: pointer !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: 74px !important;
    height: 40px !important;
    z-index: 1000 !important;
    transition: all 0.2s ease !important;
    opacity: 0.9 !important;
    font-size: 12px !important;
    outline: none !important;
    box-sizing: border-box !important;
    backdrop-filter: blur(4px) !important;
    color: white;
  `;

    // Add hover and interaction effects
    button.addEventListener('mouseenter', () => {
      button.style.backgroundColor = '#FF6B35 !important';
      button.style.color = 'white !important';
      button.style.opacity = '1 !important';
      button.style.transform = 'translate(-50%, -50%) scale(1.1) !important';
      button.style.boxShadow = '0 4px 12px rgba(255, 107, 53, 0.4) !important';
    });

    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = 'rgba(0, 0, 0, 0.8) !important';
      button.style.color = '#FF6B35 !important';
      button.style.opacity = '0.9 !important';
      button.style.transform = 'translate(-50%, -50%) scale(1) !important';
      button.style.boxShadow = 'none !important';
    });

    button.addEventListener('mousedown', () => {
      button.style.transform = 'translate(-50%, -50%) scale(0.95) !important';
    });

    button.addEventListener('mouseup', () => {
      button.style.transform = 'translate(-50%, -50%) scale(1.1) !important';
    });
  }

  private updateClipButtonVisibility() {
    if (!this.clipButton) {
      return;
    }

    if (this.isAuthenticated && this.clipperEnabled) {
      this.clipButton.style.display = 'flex !important';
      this.clipButton.style.opacity = '0.9 !important';
    } else {
      this.clipButton.style.display = 'none !important';
      this.clipButton.style.opacity = '0 !important';
    }
  }

  private observeUrlChanges() {
    // Watch for URL changes in YouTube SPA
    let lastUrl = location.href;
    const observer = new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        this.detectVideoChange();
      }

      if (!this.clipButton && document.querySelector('.html5-video-player')) {
        this.injectClipButton();
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
      this.loadTimestamps();
    }
  }

  private async loadTimestamps() {
    if (!this.currentVideoId) {
      return;
    }

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_TIMESTAMPS',
        data: { videoId: this.currentVideoId },
      });

      if (response.success) {
        this.displayTimestamps(response.timestamps);
      }
    } catch (error) {
      console.error('Failed to load timestamps:', error);
    }
  }

  private displayTimestamps(timestamps: Timestamp[]) {
    // Remove existing timestamp markers
    document
      .querySelectorAll('.ytclipper-timestamp')
      .forEach((el) => el.remove());

    // Add timestamp markers to the video progress bar
    const progressBar = document.querySelector('.ytp-progress-bar-container');

    if (progressBar && timestamps.length > 0) {
      timestamps.forEach((timestamp) => {
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
      left: ${(timestamp.timestamp / (this.player?.duration ?? 1)) * 100}%;
    `;

    marker.addEventListener('click', () => {
      if (this.player) {
        this.player.currentTime = timestamp.timestamp;
      }
    });

    container.appendChild(marker);
  }

  private getPageData(): YouTubePageData | null {
    if (!this.player || !this.currentVideoId) {
      return null;
    }

    const titleElement = document.querySelector(
      'h1.ytd-watch-metadata yt-formatted-string',
    );
    const title = titleElement?.textContent ?? 'Unknown Video';

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

  public destroy() {
    this.observers.forEach((observer) => observer.disconnect());
    if (this.clipButton) {
      this.clipButton.remove();
      this.clipButton = null;
    }
  }
  private saveNoteFromPanel() {
    const titleInput = document.getElementById(
      'yt-clipper-noteTitle',
    ) as HTMLInputElement;
    const contentInput = document.getElementById(
      'yt-clipper-noteContent',
    ) as HTMLTextAreaElement;

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();

    if (!title && !content) {
      this.showNotification('Please add a title or content for your note.');
      return;
    }

    // Collect tags
    const tags: string[] = [];
    this.tagsContainer?.querySelectorAll('.tag').forEach((tagEl) => {
      const tagText = tagEl.childNodes[0].textContent?.trim();
      if (tagText) {
        tags.push(tagText);
      }
    });

    // Save using existing functionality
    if (this.currentVideoId && this.currentTimestamp !== null) {
      chrome.runtime.sendMessage(
        {
          type: 'SAVE_TIMESTAMP',
          data: {
            videoId: this.currentVideoId,
            timestamp: this.currentTimestamp,
            title: title || `Note at ${this.formatTime(this.currentTimestamp)}`,
            note: content,
            tags,
          },
        },
        (response) => {
          if (response.success) {
            this.showNotification('Note saved successfully!');
            this.togglePanel(false);
            this.loadTimestamps();
          } else {
            this.showNotification('Failed to save note', 'error');
          }
        },
      );
    }
  }
}

const style = document.createElement('style');
style.textContent = `

`;
document.head.appendChild(style);

const youtubeHandler = new YouTubeHandler();
youtubeHandler.injectNotePanel();

window.addEventListener('beforeunload', () => {
  youtubeHandler.destroy();
});

console.log('Content script loaded on:', window.location.href);

window.addEventListener('load', () => {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('source') === 'extension') {
    const indicator = document.createElement('div');
    indicator.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #007bff;
      color: white;
      padding: 10px 15px;
      border-radius: 6px;
      font-size: 14px;
      z-index: 9999;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    indicator.textContent = 'Login to continue using YT Clipper extension';
    document.body.appendChild(indicator);

    setTimeout(() => {
      indicator.remove();
    }, 8000);
  }
});

window.addEventListener('message', (event) => {
  if (event.origin !== 'http://localhost:5173') {
    return;
  }

  if (event.data.type === 'AUTH0_TOKEN_UPDATE') {
    chrome.runtime.sendMessage({
      type: 'AUTH0_TOKEN_UPDATE',
      token: event.data.token,
      expiry: event.data.expiry,
      user: event.data.user,
    });
  }

  if (event.data.type === 'AUTH0_LOGOUT') {
    chrome.runtime.sendMessage({ type: 'AUTH0_LOGOUT' });
  }
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'TOGGLE_CLIPPER') {
    youtubeHandler.handleClipperToggle(message.enabled);
  }
});
