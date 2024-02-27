import { defineStore } from 'pinia';
import { User } from '@/lib/user';
import useApiStore from '@/stores/api-store';
import { Storage } from '@/lib/storage';

// Handles user/profile related data and actions, i.e., logging in/out
const useUserStore = defineStore('user', () => {
  const { api } = useApiStore();
  const storage = new Storage();

  const user = new User(api, storage);
  return {
    user,
  };
});

export default useUserStore;
