export class Storage {
  USER_KEY = '_user';
  constructor() {
    this.db = {};
  }
  async storeUser(userObj) {
    this.db[this.USER_KEY] = userObj;
  }
  async loadUser() {
    return this.db[this.USER_KEY];
  }
}
