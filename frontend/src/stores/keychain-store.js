import { defineStore } from 'pinia';
import { Keychain } from '@/lib/keychain';
import { Storage } from '@/lib/storage';

const useKeychainStore = defineStore('keychain', () => {
  const storage = new Storage();
  const keychain = new Keychain(storage);
  return {
    keychain,
  };
});

export default useKeychainStore;
