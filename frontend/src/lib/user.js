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
  async createUser(email, jwkPublicKey, isEphemeral = false) {
    const resp = await this._api.callApi(
      `users`,
      {
        email,
        publicKey: jwkPublicKey,
        tier: isEphemeral ? 'EPHEMERAL' : 'PRO',
      },
      'POST'
    );
    if (!resp) {
      return null;
    }

    const { id, tier } = resp.user;

    this.id = id;
    this.tier = tier;
    this.email = email;

    return resp;
  }

  // TODO: delete this in favor of using the user store's populate()
  // which retrieves the user from the backend session.
  async login(loginEmail = this.email) {
    console.log(`logging in as ${loginEmail}`);
    const resp = await this._api.callApi(`users/login`, { email: loginEmail }, 'POST');
    if (!resp) {
      return null;
    }

    const { id, tier, email } = resp;

    this.id = id;
    this.tier = tier;
    this.email = email; // why did I comment this out before?

    return resp;
  }

  async load() {
    try {
      const { id, tier, email } = await this._storage.loadUser();

      console.table({ id, tier, email });
      this.id = id;
      this.tier = tier;
      this.email = email;

      return true;
    } catch (e) {
      console.log(`No user in storage`);
    }
  }

  async store(newId, newTier, newEmail) {
    let { id, tier, email } = this;
    id = newId ?? id;
    tier = newTier ?? tier;
    email = newEmail ?? email;

    if (!id) {
      console.log(`cannot store user`);
      return;
    }
    console.log(`storing user`);
    console.table({ id, tier, email });
    await this._storage.storeUser({ id, tier, email });
  }
}
