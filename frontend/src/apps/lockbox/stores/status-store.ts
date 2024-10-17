// stores/counter.js
import { validator } from '@/lib/validations';
import useApiStore from '@/stores/api-store';
import useKeychainStore from '@/stores/keychain-store';
import useUserStore from '@/stores/user-store';
import { defineStore } from 'pinia';

export const useStatusStore = defineStore('status', () => {
  const { api } = useApiStore();
  const userStore = useUserStore();
  const { keychain } = useKeychainStore();

  const validators = () => validator({ api, keychain, userStore });

  return {
    validators,
  };
});
