/**
 * This is the client-side code that uses the inferred types from the server
 */
import logger from '@/logger';
import {
  createTRPCClient,
  httpBatchLink,
  retryLink,
  splitLink,
  wsLink,
} from '@trpc/client';

import { AppRouter } from 'server/index';
import { wsClient } from './config';

// create persistent WebSocket connection

const refreshUrl = `${import.meta.env.VITE_SEND_SERVER_URL}/api/auth/refresh`;
const trpcUrl = `${import.meta.env.VITE_SEND_SERVER_URL}/trpc`;

/**
 * We only import the `AppRouter` type from the server - this is not available at runtime
 */
export const trpc = createTRPCClient<AppRouter>({
  links: [
    splitLink({
      condition: (op) => op.type === 'subscription',
      // Handle non subscription requests with HTTP
      false: [
        retryLink({
          /**
           * Retry strategy for failed requests:
           * - For 401 unauthorized errors: Attempts to refresh the token and retries up to 3 times
           * - For queries (not mutations): Retries up to 3 times
           * - For all other cases: No retry
           */
          retry(opts) {
            // Retry unauthorized requests (401) to refresh token
            if (opts.error.data.code === 'UNAUTHORIZED') {
              fetch(refreshUrl, {
                credentials: 'include',
              })
                .then(() => {
                  logger.info('revalidated token');
                })
                .catch((err) => {
                  logger.info('could not revalidate token', err);
                });
              return opts.attempts <= 3;
            }
            if (opts.op.type !== 'query') {
              // Only retry queries
              return false;
            }
            // Retry up to 3 times
            return opts.attempts <= 3;
          },
        }),
        httpBatchLink({
          url: trpcUrl,
          fetch(url, options) {
            console.log('Fetching from splitLink, false (not a subscription)');
            return fetch(url, {
              ...options,
              // Include credentials for cookies
              credentials: 'include',
            });
          },
        }),
      ],
      // Handle subscriptions with WebSocket
      true: [
        wsLink({
          client: wsClient,
        }),
      ],
    }),
  ],
});
