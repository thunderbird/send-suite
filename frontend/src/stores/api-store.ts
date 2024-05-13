import { defineStore } from 'pinia';
import { ApiConnection } from '@/lib/api';
import useConfigurationStore from '@/stores/configuration-store';

const useApiStore = defineStore('api', () => {
  const configurationStore = useConfigurationStore();
  const url = configurationStore.serverUrl;
  const api = new ApiConnection(url);
  return {
    api,
  };
});

export default useApiStore;
