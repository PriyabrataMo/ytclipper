import type { Manifest } from './packages/dev-utils';

const manifest: Manifest = {
  manifest_version: 3,
  name: '__MSG_extensionName__',
  version: '0.0.1',
  description: '__MSG_extensionDescription__',
  default_locale: 'en',

  permissions: ['activeTab', 'storage', 'scripting', 'tabs'],

  host_permissions: [
    'https://www.youtube.com/*',
    'https://youtube.com/*',
    'https://app.ytclipper.com/*',
    'https://ytclipper.com/*',
    'http://localhost:5173/*',
  ],

  background: {
    service_worker: 'src/background/index.js',
    type: 'module',
  },

  icons: {
    '16': 'icon16.png',
    '32': 'icon32.png',
    '48': 'icon48.png',
    '128': 'icon128.png',
  },

  content_scripts: [
    {
      matches: [
        'https://www.youtube.com/*',
        'https://youtube.com/*',
        'http://localhost:5173/*',
        'https://app.ytclipper.com/*',
      ],
      js: ['src/content/index.js'],
      css: ['assets/content.css'],
      run_at: 'document_end',
    },
  ],

  action: {
    default_popup: 'src/popup/index.html',
    default_title: 'YTClipper',
    default_icon: {
      '16': 'icon16.png',
      '32': 'icon32.png',
      '48': 'icon48.png',
      '128': 'icon128.png',
    },
  },
  homepage_url: 'https://ytclipper.com',
};

export default manifest;
