type Environment = 'development' | 'staging' | 'production';

export const ENV =
  (import.meta.env.VITE_ENVIRONMENT as Environment) || 'production';

const config = {
  development: {
    // apiUrl: 'http://localhost:8080',
    apiUrl: 'https://api-staging.ytclipper.com',
    googleClientId:
      '738014780988-agqnsme9h75nl8fppt4lt64thkt903bl.apps.googleusercontent.com',
  },
  staging: {
    apiUrl: 'https://api-staging.ytclipper.com',
    googleClientId:
      '738014780988-agqnsme9h75nl8fppt4lt64thkt903bl.apps.googleusercontent.com',
  },
  production: {
    apiUrl: 'https://api.ytclipper.com',
    googleClientId:
      '738014780988-7fumk1r4jll1ku36h6nh5gdo7raatpp0.apps.googleusercontent.com',
  },
}[ENV];

export default config;
