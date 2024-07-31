import { ApiConnection } from '@/lib/api';
import posthog from '@/plugins/posthog';
import { defineStore } from 'pinia';
import UAParser from 'ua-parser-js';

const initializeClientMetrics = (uid: string | undefined) => {
  if (!uid) {
    console.error('No UID provided for metrics initialization.');
    return;
  }
  console.log('Initializing metrics with uid:', uid);
  posthog.rest.identify(uid);
};

const sendMetricsToBackend = async (api: ApiConnection) => {
  /**
   * Metric collection for development purposes.
   * This data will be used to help guide development, design, and user experience decisions.
   */
  const parser = new UAParser(navigator.userAgent);
  const browser = parser.getBrowser();
  const os = parser.getOS();
  const device = parser.getDevice();
  const deviceRes = `${window?.screen?.width ?? -1}x${window?.screen?.height ?? -1}`;
  const effectiveDeviceRes = `${window?.screen?.availWidth ?? -1}x${window?.screen?.availHeight ?? -1}`;

  const response = await api.call(
    'metrics/page-load',
    {
      browser: browser.name,
      browser_version: `${browser.name}:${browser.version}`,
      os: os.name,
      os_version: `${os.name}:${os.version}`,
      device: device.model,
      device_model: `${device.vendor}:${device.model}`,
      resolution: deviceRes,
      effective_resolution: effectiveDeviceRes,
      user_agent: navigator.userAgent,
      locale: localStorage?.getItem('locale') ?? navigator.language,
      // theme: getPreferredTheme(),
    },
    'POST'
  );

  // const { data } = response;
  // return data.value?.id ?? false;
  return response;
};

const useMetricsStore = defineStore('metrics', () => {
  const metrics = posthog.rest;

  return {
    metrics,
    initializeClientMetrics,
    sendMetricsToBackend,
  };
});

export default useMetricsStore;
