import { StorageAdapter } from '.';

export default class LocalStorageAdapter implements StorageAdapter {
  constructor() {}

  keys() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      keys.push(localStorage.key(i));
    }
    return keys;
  }

  get(key: string): any {
    const val = localStorage.getItem(key);
    if (!val) {
      return null;
    }
    return JSON.parse(val);
  }

  set(key: string, val: any) {
    const value = JSON.stringify(val);
    localStorage.setItem(key, value);
  }

  remove(id: string): void {
    localStorage.removeItem(id);
  }

  clear(): void {
    console.log(`clearing localStorage`);
    localStorage.clear();
  }
}
