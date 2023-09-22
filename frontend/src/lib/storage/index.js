import LocalStorageAdapter from './LocalStorage';

export class Storage {
  USER_KEY = 'lb/user';
  KEYS_KEY = 'lb/keys';
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
    this._store(this.KEYS_KEY, { ...keysObj });
  }

  async loadKeys() {
    return this._load(this.KEYS_KEY);
  }
}
