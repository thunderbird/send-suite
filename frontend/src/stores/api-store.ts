import { ApiConnection } from '@/lib/api';
import useConfigurationStore from '@/stores/configuration-store';
import { defineStore } from 'pinia';

const useApiStore = defineStore('api', () => {
  const configurationStore = useConfigurationStore();
  const url = configurationStore.serverUrl;
  const api = new ApiConnection(url);
  return {
    api,
  };
});

export default useApiStore;
