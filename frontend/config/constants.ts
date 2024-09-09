type Environment = 'development' | 'staging' | 'production';

type EnvironmentConfig = { [key in Environment]: string };

const SERVER_BASE_URLS: EnvironmentConfig = {
  /* backend is the docker network name */
  development: 'http://backend:8080',
  staging: 'http://backend:8080',
  production: 'https://lockbox.thunderbird.dev',
};

const ENVIRONMENT = process.env.NODE_ENV as Environment;

export const SERVER_BASE_URL = SERVER_BASE_URLS[ENVIRONMENT];

console.log('Environment:', ENVIRONMENT);
console.log('Server Base URL:', SERVER_BASE_URL);
