import 'dotenv/config';

type Environment = 'development' | 'staging' | 'production';

// type EnvironmentConfig = { [key in Environment]: string };

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

export { ENVIRONMENT };

export default appConfig;
