import { Storage } from './storage';
import { ApiConnection } from './api';
import { User as IUser, UserTier } from '@/types';

export class User implements IUser {
  api: ApiConnection;
  storage: Storage;
  id: number;
  tier: string;
  email: string;

  constructor(api: ApiConnection, storage: Storage) {
    this.api = api;
    this.storage = storage ?? new Storage();
    this.id = 0;
    this.tier = '';
    this.email = '';
  }

  async createUser(
    email: string,
    jwkPublicKey: string,
    isEphemeral = false
  ): Promise<IUser> {
    const resp = await this.api.call<IUser>(
      `users`,
      {
        email,
        publicKey: jwkPublicKey,
        tier: isEphemeral ? UserTier.EPHEMERAL : UserTier.PRO,
      },
      'POST'
    );
    if (!resp) {
      return null;
    }

    const { user } = resp as Record<string, any>;
    const { id, tier } = user;

    this.id = id;
    this.tier = tier;
    this.email = email;

    return user;
  }

  // TODO: delete this in favor of using the user store's populate()
  // which retrieves the user from the backend session.
  async login(loginEmail = this.email): Promise<IUser> {
    console.log(`logging in as ${loginEmail}`);
    const resp = await this.api.call<IUser>(
      `users/login`,
      { email: loginEmail },
      'POST'
    );
    if (!resp) {
      return null;
    }

    const { id, tier, email } = resp;

    this.id = id;
    this.tier = tier;
    this.email = email; // why did I comment this out before?

    return resp;
  }

  async load(): Promise<boolean> {
    try {
      const { id, tier, email } = await this.storage.loadUser();

      console.table({ id, tier, email });
      this.id = id;
      this.tier = tier;
      this.email = email;

      return true;
    } catch (e) {
      console.log(`No user in storage`);
      return false;
    }
  }

  async store(
    newId?: number,
    newTier?: string,
    newEmail?: string
  ): Promise<void> {
    let { id, tier, email } = this;
    id = newId ?? id;
    tier = newTier ?? tier;
    email = newEmail ?? email;

    // TODO: this is confusing.
    // we could be storing new values, but we're not setting them
    // on the current/active object.
    // Confirm whether we need to update the current/active object.
    if (!id) {
      return;
    }
    await this.storage.storeUser({ id, tier, email });
  }
}
