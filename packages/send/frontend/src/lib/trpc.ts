/**
 * This is the client-side code that uses the inferred types from the server
 */
import logger from '@/logger';
import { createTRPCClient, httpBatchLink, retryLink } from '@trpc/client';
import { AppRouter } from 'server/index';

/**
 * We only import the `AppRouter` type from the server - this is not available at runtime
 */

export const trpc = createTRPCClient<AppRouter>({
  links: [
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
          fetch(`${import.meta.env.VITE_SEND_SERVER_URL}/api/auth/refresh`, {
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
      url: `${import.meta.env.VITE_SEND_SERVER_URL}/trpc`,
      fetch(url, options) {
        return fetch(url, {
          ...options,
          // Include credentials for cookies
          credentials: 'include',
        });
      },
    }),
  ],
});
