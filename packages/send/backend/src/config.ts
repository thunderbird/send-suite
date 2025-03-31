import 'dotenv/config';
import fs from 'fs';
import path from 'path';

type Environment = 'development' | 'production';
export type EnvironmentName = 'stage' | 'prod' | 'development';

export const WS_PORT = 3030;

const appConfig = {
  file_dir: `/tmp/send-suite-dev-dir`,
  max_file_size: 1024 * 1024 * 1024 * 2.5,
};

const packageJson = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8')
);

export const VERSION = packageJson.version;

const ENVIRONMENT = process.env.NODE_ENV || ('development' as Environment);
const BASE_URL = process.env.BASE_URL;

export const IS_ENV_DEV = ENVIRONMENT === 'development';
export const IS_ENV_PROD = ENVIRONMENT === 'production';
export const IS_USING_BUCKET_STORAGE = process.env.STORAGE_BACKEND !== 'fs';

// Time constants
const ONE_MINUTE = 60 * 1000;
const FIFTEEN_MINUTES = ONE_MINUTE * 15;
const ONE_DAY = 1;
const ONE_WEEK = ONE_DAY * 7;

// File expiry time in days
export const DAYS_TO_EXPIRY = 15;

// We're not enforcing the limit right now, we only use it to display a value on the frontend
const ONE_TB_IN_BYTES = 1 * 1_000 * 1_000 * 1_000 * 1_000; // 1 TB (roughly)
export const TOTAL_STORAGE_LIMIT = ONE_TB_IN_BYTES;

// JWT expiry
export const JWT_EXPIRY = FIFTEEN_MINUTES;
export const JWT_REFRESH_TOKEN_EXPIRY = ONE_WEEK;

// Determines how many times a file can be attempted to be downloaded with the wrong password before it gets locked
export const MAX_ACCESS_LINK_RETRIES = 5;

export function getEnvironmentName(): EnvironmentName {
  if (BASE_URL.includes('send-backend.tb.pro')) {
    return 'prod';
  }
  if (BASE_URL.includes('send-backend-stage.tb.pro')) {
    return 'stage';
  }
  return 'development';
}

export { ENVIRONMENT };

export default appConfig;
