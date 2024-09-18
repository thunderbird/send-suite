import { defineStore } from 'pinia';
import { Keychain } from '@/lib/keychain';
import { Storage } from '@/lib/storage';

// TODO: decide if it's worth it to move the internals of the Keychain class to the store.
/*
cons: additional code (store setup) for tests
pros: (more) reactivity?

*/

// Providing just enough typing for a keychain-store to be passed
// to init() (in init.ts).
type KeychainStore = {
  keychain: Keychain;
  resetKeychain: () => void;
};

const useKeychainStore: () => KeychainStore = defineStore('keychain', () => {
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
