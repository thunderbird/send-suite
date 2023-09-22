export class Storage {
  constructor() {
    this.user = {};
    this.keys = {};
  }

  async storeUser(userObj) {
    this.user = { ...userObj };
  }

  async loadUser() {
    return { ...this.user };
  }

  async storeKeys(keysObj) {
    this.keys = {
      ...keysObj,
    };
  }

  async loadKeys() {
    return {
      ...this.keys,
    };
  }
}
