import { Storage } from './storage';

// does this class need both the api and the storage?
// seems so

export class User {
  constructor(api, storage) {
    this._api = api;
    this._storage = storage ?? new Storage();
    this.id = 0;
    this.tier = '';
    this.email = '';

    // this._onLoadCallbacks = [];
  }

  get userObj() {
    return {
      id: this.id,
      tier: this.tier,
      email: this.email,
    };
  }
  async createUser(email, jwkPublicKey) {
    const resp = await this._api.createUser(email, jwkPublicKey);
    if (!resp) {
      return null;
    }

    const { id, tier } = resp.user;

    this.id = id;
    this.tier = tier;
    this.email = email;

    return resp;
  }

  async login(email) {
    // Do I have an endpoint for this yet?
    // pretty sure that I do...
    console.log(`you are trying to log in with ${email}`);
    const resp = await this._api.login(email);
    if (!resp) {
      return null;
    }

    const { id, tier } = resp;

    this.id = id;
    this.tier = tier;
    this.email = email;

    return resp;
  }

  async load() {
    try {
      const { id, tier, email } = await this._storage.loadUser();

      console.log(`loading user`);
      console.table({ id, tier, email });
      this.id = id;
      this.tier = tier;
      this.email = email;
    } catch (e) {
      console.log(`No user in storage`);
    }

    // this._onLoadCallbacks.forEach(async (cb) => await cb());
  }

  async store() {
    const { id, tier, email } = this;
    if (!id) {
      console.log(`cannot store user`);
      return;
    }
    console.log(`storing user`);
    console.table({ id, tier, email });
    await this._storage.storeUser({ id, tier, email });
  }
}
