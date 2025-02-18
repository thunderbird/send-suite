import 'dotenv/config';

type Environment = 'development' | 'production';

const appConfig = {
  // file_dir: `${tmpdir()}${path.sep}send-${randomBytes(4).toString("hex")}`,
  file_dir: `/tmp/send-suite-dev-dir`,
  // default_expire_seconds: 86400,
  // default_downloads: 1,
  // base_url: process.env.BASE_URL,
  // detect_base_url: false,
  max_file_size: 1024 * 1024 * 1024 * 2.5,
};

const ENVIRONMENT = process.env.NODE_ENV || ('development' as Environment);

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

// JWT expiry
export const JWT_EXPIRY = FIFTEEN_MINUTES;
export const JWT_REFRESH_TOKEN_EXPIRY = ONE_WEEK;

// Determines how many times a file can be attempted to be downloaded with the wrong password before it gets locked
export const MAX_ACCESS_LINK_RETRIES = 5;

export { ENVIRONMENT };

export default appConfig;
