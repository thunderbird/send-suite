import { JwkKeyPair, StoredKey } from '@/lib/keychain';
import { UserType } from '@/types';
import LocalStorageAdapter from './LocalStorage';

export interface StorageAdapter {
  get: (k: string) => any;
  set: (k: string, v: any) => void;
  clear: () => void;
}

export class Storage {
  USER_KEY = 'lb/user';
  OTHER_KEYS_KEY = 'lb/keys';
  RSA_KEYS_KEY = 'lb/rsa';
  PASS_PHRASE = 'lb/passphrase';
  adapter: StorageAdapter;

  constructor(Adapter = LocalStorageAdapter) {
    this.adapter = new Adapter();
  }

  async storeUser(userObj: UserType): Promise<void> {
    this.adapter.set(this.USER_KEY, { ...userObj });
  }

  async loadUser(): Promise<UserType> {
    return this.adapter.get(this.USER_KEY);
  }

  async storeKeys(keysObj: StoredKey): Promise<void> {
    this.adapter.set(this.OTHER_KEYS_KEY, { ...keysObj });
  }

  async storePassPhrase(passPhrase: string): Promise<void> {
    this.adapter.set(this.PASS_PHRASE, { passPhrase });
  }

  getPassPhrase(): string {
    const keys = this.adapter.get(this.PASS_PHRASE);
    return keys?.passPhrase || '';
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
