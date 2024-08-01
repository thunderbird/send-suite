import { PostHog } from 'posthog-node';

const client = new PostHog(process.env.POSTHOG_API_KEY || 'test', {
  host: process.env.POSTHOG_HOST || 'test',
});

export const useMetrics = () => {
  if (!process.env.POSTHOG_API_KEY || !process.env.POSTHOG_HOST) {
    console.warn('POSTHOG keys not set');
  }
  return client;
};
