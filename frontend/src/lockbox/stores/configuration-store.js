import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

async function checkServerUrl(url) {
  // it should start with https://
  // should ping the server
  // TODO: add an endpoint to the backend for verification
}

const useConfigurationStore = defineStore('configuration', () => {
  const _serverUrl = ref('');

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
