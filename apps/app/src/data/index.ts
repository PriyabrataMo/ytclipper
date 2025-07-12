import { type ClipperData } from '@/types';

export const mockData: ClipperData = {
  videos: [
    {
      id: '1',
      title: 'React Best Practices 2024',
      description:
        'Learn modern React patterns and best practices for building scalable applications.',
      youtubeId: 'dQw4w9WgXcQ', // Rick Roll for demo - replace with actual video IDs
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      duration: '15:30',
      channelName: 'React Mastery',
      createdAt: '2024-01-15T10:00:00Z',
      notes: [
        {
          id: '1-1',
          timestamp: '2:15',
          timestampSeconds: 135,
          content:
            'Important concept about component composition and reusability patterns.',
          createdAt: '2024-01-15T10:15:00Z',
        },
        {
          id: '1-2',
          timestamp: '5:42',
          timestampSeconds: 342,
          content:
            'Custom hooks implementation - very useful for state management.',
          createdAt: '2024-01-15T10:18:00Z',
        },
        {
          id: '1-3',
          timestamp: '8:20',
          timestampSeconds: 500,
          content:
            'Performance optimization techniques using React.memo and useMemo.',
          createdAt: '2024-01-15T10:22:00Z',
        },
        {
          id: '1-4',
          timestamp: '12:10',
          timestampSeconds: 730,
          content:
            'Context API best practices - when to use and when to avoid.',
          createdAt: '2024-01-15T10:25:00Z',
        },
      ],
    },
    {
      id: '2',
      title: 'TypeScript Advanced Features',
      description:
        'Deep dive into advanced TypeScript features for professional development.',
      youtubeId: 'dQw4w9WgXcQ',
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      duration: '22:45',
      channelName: 'TypeScript Pro',
      createdAt: '2024-01-20T14:30:00Z',
      notes: [
        {
          id: '2-1',
          timestamp: '3:30',
          timestampSeconds: 210,
          content: 'Generic constraints and conditional types explanation.',
          createdAt: '2024-01-20T14:35:00Z',
        },
        {
          id: '2-2',
          timestamp: '7:15',
          timestampSeconds: 435,
          content:
            'Utility types like Pick, Omit, and Record - practical examples.',
          createdAt: '2024-01-20T14:40:00Z',
        },
        {
          id: '2-3',
          timestamp: '14:50',
          timestampSeconds: 890,
          content:
            'Mapped types and template literal types for dynamic type generation.',
          createdAt: '2024-01-20T14:45:00Z',
        },
      ],
    },
    {
      id: '3',
      title: 'Next.js 14 App Router Deep Dive',
      description:
        'Complete guide to Next.js 14 App Router with server components and streaming.',
      youtubeId: 'dQw4w9WgXcQ',
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      duration: '28:12',
      channelName: 'Next.js Masters',
      createdAt: '2024-01-25T09:00:00Z',
      notes: [
        {
          id: '3-1',
          timestamp: '4:20',
          timestampSeconds: 260,
          content: 'Server components vs client components - when to use each.',
          createdAt: '2024-01-25T09:10:00Z',
        },
        {
          id: '3-2',
          timestamp: '9:45',
          timestampSeconds: 585,
          content: 'Loading UI and streaming with Suspense boundaries.',
          createdAt: '2024-01-25T09:15:00Z',
        },
        {
          id: '3-3',
          timestamp: '16:30',
          timestampSeconds: 990,
          content: 'Route handlers and API routes in the app directory.',
          createdAt: '2024-01-25T09:20:00Z',
        },
        {
          id: '3-4',
          timestamp: '22:15',
          timestampSeconds: 1335,
          content: 'Metadata API and SEO optimization strategies.',
          createdAt: '2024-01-25T09:25:00Z',
        },
      ],
    },
    {
      id: '4',
      title: 'Tailwind CSS Master Class',
      description:
        'Learn advanced Tailwind CSS techniques for responsive and maintainable designs.',
      youtubeId: 'dQw4w9WgXcQ',
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      duration: '18:33',
      channelName: 'CSS Wizards',
      createdAt: '2024-02-01T16:45:00Z',
      notes: [
        {
          id: '4-1',
          timestamp: '2:50',
          timestampSeconds: 170,
          content: 'Custom utility classes and component extraction patterns.',
          createdAt: '2024-02-01T16:50:00Z',
        },
        {
          id: '4-2',
          timestamp: '8:12',
          timestampSeconds: 492,
          content:
            'Responsive design with mobile-first approach and breakpoints.',
          createdAt: '2024-02-01T16:55:00Z',
        },
        {
          id: '4-3',
          timestamp: '13:40',
          timestampSeconds: 820,
          content:
            'Dark mode implementation with CSS variables and class strategies.',
          createdAt: '2024-02-01T17:00:00Z',
        },
      ],
    },
    {
      id: '5',
      title: 'Building Scalable APIs with Node.js',
      description:
        'Learn how to build production-ready APIs with Node.js, Express, and best practices.',
      youtubeId: 'dQw4w9WgXcQ',
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      duration: '35:20',
      channelName: 'Backend Mastery',
      createdAt: '2024-02-05T11:15:00Z',
      notes: [
        {
          id: '5-1',
          timestamp: '5:15',
          timestampSeconds: 315,
          content:
            'Project structure and folder organization for scalable apps.',
          createdAt: '2024-02-05T11:20:00Z',
        },
        {
          id: '5-2',
          timestamp: '12:30',
          timestampSeconds: 750,
          content: 'Middleware patterns and error handling strategies.',
          createdAt: '2024-02-05T11:25:00Z',
        },
        {
          id: '5-3',
          timestamp: '19:45',
          timestampSeconds: 1185,
          content: 'Database integration with Prisma and connection pooling.',
          createdAt: '2024-02-05T11:30:00Z',
        },
        {
          id: '5-4',
          timestamp: '26:10',
          timestampSeconds: 1570,
          content:
            'Authentication and authorization with JWT and role-based access.',
          createdAt: '2024-02-05T11:35:00Z',
        },
        {
          id: '5-5',
          timestamp: '31:50',
          timestampSeconds: 1910,
          content: 'API documentation with Swagger and testing strategies.',
          createdAt: '2024-02-05T11:40:00Z',
        },
      ],
    },
  ],
};
