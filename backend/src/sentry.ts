// Import with `import * as Sentry from "@sentry/node"` if you are using ESM
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { ENVIRONMENT } from './config';

const packageJson = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8')
);

const TRACING_LEVELS_PROD = ['error', 'warn'];
const TRACING_LEVELS_DEV = ['error', 'warn', 'debug'];

const isProduction = ENVIRONMENT === 'production';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    nodeProfilingIntegration(),
    Sentry.captureConsoleIntegration({
      levels: isProduction ? TRACING_LEVELS_PROD : TRACING_LEVELS_DEV,
    }),
  ],
  // Performance Monitoring
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: 0,
  // Set sampling rate for profiling - this is relative to tracesSampleRate
  profilesSampleRate: 1.0,
  release: packageJson.version,
});

console.log('Sentry initialized with env: ' + ENVIRONMENT);
console.log('Sentry is using release version: ' + packageJson.version);
