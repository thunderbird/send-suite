import { getEnvName } from '@/lib/clientConfig';
import { defineStore } from 'pinia';

export const useConfigStore = defineStore('config', () => {
  const environmentName = getEnvName();
  const isProd = environmentName === 'production';
  const isStaging = environmentName === 'staging';
  const isDev = environmentName === 'development';

  return {
    isProd,
    isStaging,
    isDev,
  };
});

export type ConfigStore = ReturnType<typeof useConfigStore>;
