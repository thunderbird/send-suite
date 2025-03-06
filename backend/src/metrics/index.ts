import { getEnvironmentName } from '@/config';
import { extended_client } from './posthog';

const client = new extended_client(process.env.POSTHOG_API_KEY!, {
  host: process.env.POSTHOG_HOST!,
  persistence: 'memory',
});

client.on('error', (error) => {
  console.error('Error in PostHog', error);
});

export const useMetrics = () => {
  const isProd = getEnvironmentName() === 'prod';
  const isMissingKeys =
    !process.env.POSTHOG_API_KEY || !process.env.POSTHOG_HOST;

  if (isMissingKeys) {
    console.warn('POSTHOG keys not set');
  }

  if (isProd && isMissingKeys) {
    console.error(
      `POSTHOG keys not correctly set, we got POSTHOG_API_KEY: ${process.env.POSTHOG_API_KEY} and POSTHOG_HOST: ${process.env.POSTHOG_HOST}`
    );
  }
  return client;
};
