import { logger } from '@ytclipper/extension-dev-utils';

import { AuthMessage, AuthStorage } from '../types/auth';

logger.info('Background service worker started');

const MY_DOMAIN = 'http://localhost:5173';

function isTokenValid(tokenExpiry?: number): boolean {
  return !!tokenExpiry && Date.now() < tokenExpiry;
}

async function updatePopupState(): Promise<void> {
  const result = (await chrome.storage.sync.get([
    'auth0_token',
    'user_info',
    'token_expiry',
  ])) as AuthStorage;

  if (result.auth0_token && isTokenValid(result.token_expiry)) {
    await chrome.action.setPopup({ popup: 'src/popup/index.html' });
    logger.info('Popup enabled - user authenticated');
  } else {
    await chrome.action.setPopup({ popup: '' });
    logger.info('Popup disabled - user not authenticated');
  }
}
updatePopupState().catch((error) => {
  logger.error('Error updating popup state:', error);
});

chrome.action.onClicked.addListener(async () => {
  const result = (await chrome.storage.sync.get([
    'auth0_token',
    'token_expiry',
  ])) as Pick<AuthStorage, 'auth0_token' | 'token_expiry'>;

  if (!result.auth0_token || !isTokenValid(result.token_expiry)) {
    logger.info('User not authenticated, redirecting to login page');
    chrome.tabs.create({
      url: MY_DOMAIN,
    });
  }
});

chrome.runtime.onMessage.addListener(
  (
    message: AuthMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void,
  ) => {
    if (message.type === 'AUTH0_TOKEN_UPDATE') {
      const dataToStore = {
        auth0_token: message.token,
        token_expiry: message.expiry,
        user_info: message.user,
      };

      chrome.storage.sync
        .set(dataToStore)
        .then(() => {
          updatePopupState();
          sendResponse({ success: true });
        })
        .catch((error) => {
          sendResponse({ success: false, error });
        });

      return true; // Keep channel open
    }

    if (message.type === 'AUTH0_LOGOUT') {
      chrome.storage.sync
        .remove(['auth0_token', 'token_expiry', 'user_info'])
        .then(() => {
          logger.info('User logged out, updating popup state');
          updatePopupState();
        })
        .then(() => {
          sendResponse({ success: true });
        })
        .catch((error) => {
          logger.error('Error during logout:', error);
          sendResponse({ success: false, error });
        });
      return true;
    }
    logger.warn('Unknown message type:', message);
    sendResponse({ success: false, error: 'Unknown message type' });

    return true;
  },
);

async function initatializeClipperState() {
  const result = await chrome.storage.sync.get('clipper_enabled');

  if (result.clipper_enabled === undefined) {
    await chrome.storage.sync.set({ clipper_enabled: true });
    logger.info('Clipper state initialized to enabled');
  }
}

initatializeClipperState().catch((error) => {
  logger.error('Error initializing clipper state:', error);
});

setInterval(
  () => {
    updatePopupState().catch((error) => {
      logger.error('Error updating popup state in interval:', error);
    });
  },
  5 * 60 * 1000,
);
