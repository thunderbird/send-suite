import { JwkKeyPair, StoredKey } from '@/lib/keychain';
import LocalStorageAdapter from './LocalStorage';
import { User } from '../user';

export interface StorageAdapter {
  get: (k: string) => any;
  set: (k: string, v: any) => void;
  clear: () => void;
}

export class Storage {
  USER_KEY = 'lb/user';
  OTHER_KEYS_KEY = 'lb/keys';
  RSA_KEYS_KEY = 'lb/rsa';
  adapter: StorageAdapter;

  constructor(Adapter = LocalStorageAdapter) {
    this.adapter = new Adapter();
  }

  async storeUser(userObj: User): Promise<void> {
    this.adapter.set(this.USER_KEY, { ...userObj });
  }

  async loadUser(): Promise<User> {
    return this.adapter.get(this.USER_KEY);
  }

  async storeKeys(keysObj: StoredKey): Promise<void> {
    this.adapter.set(this.OTHER_KEYS_KEY, { ...keysObj });
  }

  async loadKeys(): Promise<StoredKey> {
    return this.adapter.get(this.OTHER_KEYS_KEY);
  }

  async storeKeypair(keypair: JwkKeyPair) {
    this.adapter.set(this.RSA_KEYS_KEY, { ...keypair });
  }

  async loadKeypair(): Promise<JwkKeyPair> {
    return this.adapter.get(this.RSA_KEYS_KEY);
  }

  async clear(): Promise<void> {
    return this.adapter.clear();
  }

  async export() {
    // primarily for debugging or moving a user to another device
    // prior to getting multiple-device login implemented
    const user = await this.loadUser();
    const keypair = await this.loadKeypair();
    const keys = await this.loadKeys();
    return {
      user,
      keypair,
      keys,
    };
  }
}
