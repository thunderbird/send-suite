import * as Sentry from '@sentry/vue';

type App = ReturnType<typeof import('vue').createApp>;

const TRACING_LEVELS_PROD = ['error', 'warn'];
const TRACING_LEVELS_DEV = ['error', 'warn', 'debug'];

const isProduction = import.meta.env.MODE === 'production';

export const initSentry = (app: App) => {
  Sentry.init({
    app,
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
      Sentry.captureConsoleIntegration({
        levels: isProduction ? TRACING_LEVELS_PROD : TRACING_LEVELS_DEV,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: 0.5,
    // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
    // tracePropagationTargets: ['localhost', /^https:\/\/yourserver\.io\/api/],
    // Session Replay
    replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
    replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
    environment: import.meta.env.MODE,
  });
};
