type Environment = 'development' | 'staging' | 'production';

const ENV = (import.meta.env.VITE_ENVIRONMENT as Environment) || 'production';

const config = {
  development: {
    apiUrl: 'http://localhost:8080',
    auth0Domain: 'dev-e1tm4i4p5zebu2rl.us.auth0.com',
    auth0ClientId: 'LV8DtOSlwPMexIvm7LsUxl7XWMJ2prU1',
    auth0Audience: 'https://api.ytclipper.com',
  },
  staging: {
    apiUrl: 'https://api.staging.ytclipper.com',
    auth0Domain: 'dev-e1tm4i4p5zebu2rl.us.auth0.com',
    auth0ClientId: 'LV8DtOSlwPMexIvm7LsUxl7XWMJ2prU1',
    auth0Audience: 'https://api.ytclipper.com',
  },
  production: {
    apiUrl: 'https://api.ytclipper.com',
    auth0Domain: 'dev-e1tm4i4p5zebu2rl.us.auth0.com',
    auth0ClientId: 'LV8DtOSlwPMexIvm7LsUxl7XWMJ2prU1',
    auth0Audience: 'https://api.ytclipper.com',
  },
}[ENV];

export default config;
