export interface MetadataConfig {
  title?: string;
  description?: string;
  keywords?: readonly string[];
  author?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  siteName?: string;
  locale?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterSite?: string;
  twitterCreator?: string;
}

export const defaultMetadata: MetadataConfig = {
  title: 'YTClipper - YouTube Video Timestamp Manager',
  description:
    'Create, organize, and share YouTube video timestamps with ease. YTClipper helps you bookmark important moments in videos and build collections of valuable content.',
  keywords: [
    'youtube',
    'timestamps',
    'video',
    'bookmarks',
    'clips',
    'moments',
    'video management',
    'youtube tools',
    'video timestamps',
    'content organization',
  ],
  author: 'YTClipper Team',
  image: '/og-image.jpg',
  url: 'https://ytclipper.com',
  type: 'website',
  siteName: 'YTClipper',
  locale: 'en_US',
  twitterCard: 'summary_large_image',
  twitterSite: '@ytclipper',
  twitterCreator: '@ytclipper',
};

export const pageMetadata = {
  home: {
    title: 'YTClipper - YouTube Video Timestamp Manager',
    description:
      'Create, organize, and share YouTube video timestamps with ease. Start building your collection of valuable video moments today.',
    keywords: [
      'youtube timestamps',
      'video bookmarks',
      'youtube tools',
      'video clips',
    ],
  },
  auth: {
    title: 'Sign In - YTClipper',
    description:
      'Sign in to YTClipper to start creating and managing your YouTube video timestamps.',
    keywords: ['sign in', 'login', 'authentication', 'youtube timestamps'],
  },
  dashboard: {
    title: 'Dashboard - YTClipper',
    description:
      'Manage your YouTube video timestamps, collections, and bookmarks from your personal dashboard.',
    keywords: ['dashboard', 'video management', 'timestamps', 'collections'],
  },
  profile: {
    title: 'Profile - YTClipper',
    description:
      'Manage your account settings, authentication methods, and preferences.',
    keywords: ['profile', 'account settings', 'user preferences'],
  },
  videos: {
    title: 'Videos - YTClipper',
    description:
      'Browse and manage your saved YouTube videos and their timestamps.',
    keywords: ['videos', 'youtube', 'saved videos', 'video library'],
  },
  videoDetail: (title?: string) => ({
    title: title ? `${title} - YTClipper` : 'Video Details - YTClipper',
    description: title
      ? `View and manage timestamps for "${title}" on YTClipper.`
      : 'View and manage timestamps for this video on YTClipper.',
    keywords: ['video timestamps', 'video details', 'youtube video'],
  }),
} as const;

export function generateMetaTags(config: MetadataConfig): string {
  const {
    title,
    description,
    keywords,
    author,
    image,
    url,
    type = 'website',
    siteName,
    locale = 'en_US',
    twitterCard = 'summary_large_image',
    twitterSite,
    twitterCreator,
  } = { ...defaultMetadata, ...config };

  const tags = [
    // Basic meta tags
    title && `<title>${title}</title>`,
    description && `<meta name="description" content="${description}" />`,
    keywords && `<meta name="keywords" content="${keywords.join(', ')}" />`,
    author && `<meta name="author" content="${author}" />`,
    `<meta name="robots" content="index, follow" />`,
    `<meta name="viewport" content="width=device-width, initial-scale=1.0" />`,

    // Open Graph
    title && `<meta property="og:title" content="${title}" />`,
    description &&
      `<meta property="og:description" content="${description}" />`,
    `<meta property="og:type" content="${type}" />`,
    image && `<meta property="og:image" content="${image}" />`,
    url && `<meta property="og:url" content="${url}" />`,
    siteName && `<meta property="og:site_name" content="${siteName}" />`,
    locale && `<meta property="og:locale" content="${locale}" />`,

    // Twitter Cards
    `<meta name="twitter:card" content="${twitterCard}" />`,
    title && `<meta name="twitter:title" content="${title}" />`,
    description &&
      `<meta name="twitter:description" content="${description}" />`,
    image && `<meta name="twitter:image" content="${image}" />`,
    twitterSite && `<meta name="twitter:site" content="${twitterSite}" />`,
    twitterCreator &&
      `<meta name="twitter:creator" content="${twitterCreator}" />`,

    // Additional meta tags
    `<meta name="theme-color" content="#3b82f6" />`,
    `<meta name="msapplication-TileColor" content="#3b82f6" />`,
    `<link rel="canonical" href="${url}" />`,
  ];

  return tags.filter(Boolean).join('\n');
}
