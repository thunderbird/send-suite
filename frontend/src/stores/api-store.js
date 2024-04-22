import { defineStore } from 'pinia';
import { ApiConnection } from '@/lib/api';
import useConfigurationStore from '@/stores/configuration-store';

const useApiStore = defineStore('api', () => {
  const configurationStore = useConfigurationStore();
  const url = configurationStore.serverUrl;
  console.log(`useApiStore is about to create a new ApiConnection with url: ${url}`);

  const api = new ApiConnection(url);
  return {
    api,
  };
});

export default useApiStore;
