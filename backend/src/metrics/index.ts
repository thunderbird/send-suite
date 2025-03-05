import { getEnvironmentName } from '@/config';
import { PostHog } from 'posthog-node';

const client = new PostHog(process.env.POSTHOG_API_KEY || 'test', {
  host: process.env.POSTHOG_HOST || 'test',
});

export const posthog_service = 'send';

export const useMetrics = () => {
  const isProd = getEnvironmentName() === 'prod';

  if (
    !process.env.POSTHOG_API_KEY ||
    !process.env.POSTHOG_HOST ||
    process.env.POSTHOG_API_KEY === 'test' ||
    process.env.POSTHOG_HOST === 'test'
  ) {
    if (isProd) {
      console.error(
        `POSTHOG keys not correctly set, we got POSTHOG_API_KEY: ${process.env.POSTHOG_API_KEY} and POSTHOG_HOST: ${process.env.POSTHOG_HOST}`
      );
    }
    console.warn('POSTHOG keys not set');
  }
  return client;
};
