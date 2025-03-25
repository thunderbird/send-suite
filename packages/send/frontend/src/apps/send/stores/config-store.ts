import { getEnvName } from '@/lib/clientConfig';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useConfigStore = defineStore('config', () => {
  const environmentName = getEnvName();
  const isProd = environmentName === 'production';
  const isStaging = environmentName === 'staging';
  const isDev = environmentName === 'development';

  const isExtension = computed(() => {
    return location.href.includes('moz-extension:');
  });

  const _serverUrl = ref(import.meta.env.VITE_SEND_SERVER_URL);
  const _isPublicLogin = ref(
    import.meta.env.VITE_ALLOW_PUBLIC_LOGIN === 'true'
  );

  const serverUrl = computed(() => _serverUrl.value);
  const isPublicLogin = computed(() => _isPublicLogin.value);

  function setServerUrl(url) {
    _serverUrl.value = url;
  }

  return {
    isProd,
    isStaging,
    isDev,

    // Server
    serverUrl,
    setServerUrl,
    isPublicLogin,

    // Extension
    isExtension,
  };
});

export type ConfigStore = ReturnType<typeof useConfigStore>;
