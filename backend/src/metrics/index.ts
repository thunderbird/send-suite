import { PostHog } from 'posthog-node';

const client = new PostHog(process.env.POSTHOG_API_KEY, {
  host: process.env.POSTHOG_HOST,
});

export const useMetrics = () => {
  if (!process.env.POSTHOG_API_KEY || !process.env.POSTHOG_HOST) {
    throw new Error('POSTHOG keys not set');
  }
  return client;
};
