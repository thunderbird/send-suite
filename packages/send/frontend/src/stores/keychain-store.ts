import { Keychain } from '@/lib/keychain';
import { Storage } from '@/lib/storage';
import { defineStore } from 'pinia';

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
  addKey: (id: string, key: CryptoKey) => Promise<void>;
  getKey: (id: string) => Promise<CryptoKey>;
  removeKey: (id: string) => void;
  newKeyForContainer: (id: string) => Promise<void>;
};

const useKeychainStore = defineStore('keychain', () => {
  const storage = new Storage();
  const keychain = new Keychain(storage);

  function resetKeychain() {
    keychain._init();
  }

  async function addKey(id: string, key: CryptoKey) {
    await keychain.add(id, key);
  }

  async function getKey(id: string) {
    return await keychain.get(id);
  }

  function removeKey(id: string) {
    keychain.remove(id);
  }

  async function newKeyForContainer(id: string) {
    await keychain.newKeyForContainer(id);
  }

  const store: KeychainStore = {
    keychain,
    resetKeychain,
    addKey,
    getKey,
    removeKey,
    newKeyForContainer,
  };

  return store;
});

export default useKeychainStore;
