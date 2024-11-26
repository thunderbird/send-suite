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

const ignoredTraces = [{ method: 'GET', endpoint: '/' }];

const excludedUserAgents = ['headless', 'elb'];

// Ignore events from health checks and headless browsers
const hasExcludedUserAgent = (headers: Record<string, string | undefined>) => {
  const userAgent = (
    headers['user-agent'] ||
    headers['User-Agent'] ||
    ''
  ).toLowerCase();
  return excludedUserAgents.some((agent) => userAgent.includes(agent));
};

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
  beforeSendTransaction: (event) => {
    if (hasExcludedUserAgent(event.request.headers)) {
      return null;
    }
    return event;
  },
  tracesSampleRate: 0.5,
  tracesSampler: (samplingContext) => {
    const shouldTrace = !ignoredTraces.some(
      ({ endpoint }) => samplingContext?.attributes['http.route'] === endpoint
    );

    return shouldTrace;
  },

  // Set sampling rate for profiling - this is relative to tracesSampleRate
  profilesSampleRate: 1.0,
  release: packageJson.version,
});

console.log('Sentry initialized with env: ' + ENVIRONMENT);
console.log('Sentry is using release version: ' + packageJson.version);
