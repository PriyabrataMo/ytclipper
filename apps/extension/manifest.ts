import type { Manifest } from './packages/dev-utils';

const manifest: Manifest = {
  manifest_version: 3,
  name: '__MSG_extensionName__',
  version: '1.0.0',
  description: '__MSG_extensionDescription__',
  default_locale: 'en',

  permissions: ['activeTab', 'storage', 'scripting', 'tabs'],

  host_permissions: ['https://www.youtube.com/*', 'https://youtube.com/*'],

  background: {
    service_worker: 'src/background/index.js',
    type: 'module',
  },

  content_scripts: [
    {
      matches: ['https://www.youtube.com/*', 'https://youtube.com/*'],
      js: ['src/content/index.js'],
      css: ['assets/content.css'],
      run_at: 'document_end',
    },
  ],

  action: {
    default_popup: 'src/popup/index.html',
    default_title: '__MSG_extensionName__',
    default_icon: {
      16: 'icon-16.png',
      32: 'icon-32.png',
      48: 'icon-48.png',
      128: 'icon-128.png',
    },
  },

  icons: {
    16: 'icon-16.png',
    32: 'icon-32.png',
    48: 'icon-48.png',
    128: 'icon-128.png',
  },

  web_accessible_resources: [
    {
      resources: ['src/content-ui/index.js'],
      matches: ['https://www.youtube.com/*', 'https://youtube.com/*'],
    },
  ],
};

export default manifest;
