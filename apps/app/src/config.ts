type Environment = 'development' | 'staging' | 'production';

export const ENV =
  (import.meta.env.VITE_ENVIRONMENT as Environment) || 'production';

const config = {
  development: {
    apiUrl: 'http://localhost:8080',
    googleClientId:
      '1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com',
  },
  staging: {
    apiUrl: 'https://api-staging.ytclipper.com',
    googleClientId:
      '1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com',
  },
  production: {
    apiUrl: 'https://api.ytclipper.com',
    googleClientId:
      '1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com',
  },
}[ENV];

export default config;
