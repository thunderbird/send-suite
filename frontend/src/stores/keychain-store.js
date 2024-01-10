import { defineStore } from 'pinia';
import { Keychain } from '@/lib/keychain';
import { Storage } from '@/lib/storage';

// TODO: decide if it's worth it to move the internals of the Keychain class to the store.
/*
cons: not sure how I'd run the automated tests outside of the browser
pros: (more) reactivity?

*/
const useKeychainStore = defineStore('keychain', () => {
  const storage = new Storage();
  const keychain = new Keychain(storage);
  return {
    keychain,
  };
});

export default useKeychainStore;
