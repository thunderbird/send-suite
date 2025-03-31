import { createWSClient } from '@trpc/client';
import { config } from 'dotenv';
config();
export type Environment = 'development' | 'staging' | 'production';

export const getIsEnvProd = (envVarObject: Record<string, string>) => {
  return envVarObject?.BASE_URL?.includes('https://send.tb.pro');
};

/**
 * Returns true if the environment is production
 * @param envVarObject - Object containing environment variables. You can use proces.env or import.meta.env, if executed from vite.config, use env that comes from loadEnv
 * @returns boolean indicating if environment is production
 */
export const getEnvironmentName = (
  envVarObject: Record<string, string>
): Environment => {
  if (!envVarObject) {
    throw new Error('Environment variables object is required');
  }
  // Development is when process.env.NODE_ENV is not set or set to 'development'
  if ((envVarObject.NODE_ENV || envVarObject.MODE) === 'development') {
    return 'development';
  }
  // Production is when BASE_URL is set to 'tb.pro'
  if (getIsEnvProd(envVarObject)) {
    return 'production';
  }
  // Staging is when BASE_URL is set to 'thunderbird.dev'
  return 'staging';
};

const isTesting = process.env.NODE_ENV === 'test';

export const WS_PORT = 3030;
export const wsClient = !isTesting
  ? createWSClient({
      url: `ws://localhost:${WS_PORT}`,
    })
  : null;
