import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

const useConfigurationStore = defineStore('configuration', () => {
  const _serverUrl = ref(import.meta.env.VITE_SEND_SERVER_URL);
  // console.log(`configurationStore has the following server url: ${_serverUrl.value}`);
  const serverUrl = computed(() => _serverUrl.value);

  function setServerUrl(url) {
    // if (await checkServerUrl(url)) {}
    _serverUrl.value = url;
  }

  return {
    serverUrl,
    setServerUrl,
  };
});

export default useConfigurationStore;
