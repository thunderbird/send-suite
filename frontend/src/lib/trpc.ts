/**
 * This is the client-side code that uses the inferred types from the server
 */
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { AppRouter } from 'server/index';

/**
 * We only import the `AppRouter` type from the server - this is not available at runtime
 */

export const trpc = createTRPCClient<AppRouter>({
  links: [
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
