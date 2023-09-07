export default class Storage {
  constructor() {}

  keys() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      keys.push(localStorage.key(i));
    }
    return keys;
  }

  get(key) {
    const val = localStorage.getItem(key);
    if (!val) {
      return null;
    }
    return JSON.parse(val);
    // return val;
  }

  set(key, val) {
    const value = JSON.stringify(val);
    localStorage.setItem(key, value);
  }

  remove(id) {
    localStorage.removeItem(id);
  }
}
