import { defineStore } from 'pinia';
import { Keychain } from '@/lib/keychain';
import { Storage } from '@/lib/storage';

// TODO: decide if it's worth it to move the internals of the Keychain class to the store.
/*
cons: additional code (store setup) for tests
pros: (more) reactivity?

*/
const useKeychainStore = defineStore('keychain', () => {
  const storage = new Storage();
  let keychain = new Keychain(storage);

  function resetKeychain() {
    keychain._init();
  }

  return {
    keychain,
    resetKeychain,
  };
});

export default useKeychainStore;
