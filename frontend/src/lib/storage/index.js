import LocalStorageAdapter from './LocalStorage';

export class Storage {
  USER_KEY = 'lb/user';
  OTHER_KEYS_KEY = 'lb/keys';
  RSA_KEYS_KEY = 'lb/rsa';

  constructor(StorageAdapter = LocalStorageAdapter) {
    this.adapter = new StorageAdapter();
    /*
    This first version will assume that we're dealing
    with a key/value store with these methods:
    - get(key)
    - set(key, val)
    - remove(key)
    - clear()
    - keys()
    */
  }

  async _store(key, val) {
    this.adapter.set(key, val);
  }

  async _load(key) {
    return this.adapter.get(key);
  }

  async storeUser(userObj) {
    this._store(this.USER_KEY, { ...userObj });
  }

  async loadUser() {
    return this._load(this.USER_KEY);
  }

  async storeKeys(keysObj) {
    this._store(this.OTHER_KEYS_KEY, { ...keysObj });
  }

  async loadKeys() {
    return this._load(this.OTHER_KEYS_KEY);
  }

  async storeKeypair(keysObj) {
    this._store(this.RSA_KEYS_KEY, { ...keysObj });
  }

  async loadKeypair() {
    return this._load(this.RSA_KEYS_KEY);
  }
}
