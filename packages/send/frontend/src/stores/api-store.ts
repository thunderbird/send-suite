import { useConfigStore } from '@/apps/send/stores/config-store';
import { ApiConnection } from '@/lib/api';
import { defineStore } from 'pinia';

const useApiStore = defineStore('api', () => {
  const configurationStore = useConfigStore();
  const url = configurationStore.serverUrl;
  const api = new ApiConnection(url);
  return {
    api,
  };
});

export default useApiStore;
