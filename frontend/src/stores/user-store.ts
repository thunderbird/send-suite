import { defineStore } from 'pinia';
import { User, UserTier } from '@/lib/user';
import useApiStore from '@/stores/api-store';
import { Storage } from '@/lib/storage';
import { Backup, UserResponse } from '@/stores/user-store.types';
import { AsyncJsonResponse } from '@/lib/api';

export interface UserStore {
  user: User;
  createUser: (
    email: string,
    jwkPublicKey: string,
    isEphemeral?: boolean
  ) => Promise<UserResponse>;
  login: (loginEmail?: string) => Promise<UserResponse>;
  load: () => Promise<boolean>;
  store: (
    newId?: number,
    newTier?: UserTier,
    newEmail?: string
  ) => Promise<void>;
  populateFromSession: () => Promise<boolean>;
  getPublicKey: () => Promise<string>;
  updatePublicKey: (jwk: string) => Promise<string>;
  getMozAccountAuthUrl: () => Promise<string>;
  createBackup: (
    userId: number,
    keys: string,
    keypair: string,
    keystring: string,
    salt: string
  ) => AsyncJsonResponse;
  getBackup: (id: number) => Promise<Backup>;
}

const useUserStore: () => UserStore = defineStore('user', () => {
  const { api } = useApiStore();
  const storage = new Storage();

  const user = new User();

  async function createUser(
    email: string,
    jwkPublicKey: string,
    isEphemeral = false
  ): Promise<UserResponse> {
    const resp = await api.call<UserResponse>(
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

    user.id = id;
    user.tier = tier;
    user.email = email;

    return user;
  }

  // TODO: delete this in favor of using the user store's populate()
  // which retrieves the user from the backend session.
  async function login(loginEmail = user.email): Promise<UserResponse> {
    console.log(`logging in as ${loginEmail}`);
    const resp = await api.call<UserResponse>(
      `users/login`,
      { email: loginEmail },
      'POST'
    );
    if (!resp) {
      return null;
    }

    const { id, tier, email } = resp;

    user.id = id;
    user.tier = tier as unknown as UserTier;
    user.email = email;

    return resp;
  }

  async function load(): Promise<boolean> {
    try {
      const { id, tier, email } = await storage.loadUser();

      console.table({ id, tier, email });
      user.id = id;
      user.tier = tier;
      user.email = email;

      return true;
    } catch (e) {
      console.log(`No user in storage`);
      return false;
    }
  }

  async function store(
    newId?: number,
    newTier?: UserTier,
    newEmail?: string
  ): Promise<void> {
    let { id, tier, email } = user;
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
    await storage.storeUser({ id, tier, email });
  }

  // After login, get user from backend and save it locally.
  // Returns a boolean signaling whether successfully populated the user.
  async function populateFromSession() {
    const userResp = await api.call<{ user: any }>(`users/me`);
    if (!userResp.user) {
      return false;
    }

    const { id, email, tier } = userResp.user;

    user.id = id;
    user.email = email;
    user.tier = tier;

    return true;
  }

  async function getPublicKey(): Promise<string> {
    // Explicitly passing user id; this route is for retrieving
    // any user's public key, not just the currently logged in user
    const resp = await api.call<{ publicKey: any }>(
      `users/publickey/${user.id}`
    );
    return resp.publicKey;
  }

  async function updatePublicKey(jwkPublicKey): Promise<string> {
    const resp = await api.call<{ update: { publicKey: string } }>(
      `users/publickey`,
      {
        publicKey: jwkPublicKey,
      },
      'POST'
    );
    return resp.update?.publicKey;
  }

  async function getMozAccountAuthUrl(): Promise<string> {
    const resp = await api.call<{ url: string }>(`lockbox/fxa/login`);
    return resp.url;
  }
  // TODO: shift the userId from frontend argument to backend session
  async function createBackup(userId, keys, keypair, keystring, salt) {
    return await api.call(
      `users/${userId}/backup`,
      {
        keys,
        keypair,
        keystring,
        salt,
      },
      'POST'
    );
  }

  // TODO: shift the userId from frontend argument to backend session
  async function getBackup(userId) {
    return await api.call<Backup>(`users/${userId}/backup`);
  }

  return {
    user,
    createUser,
    login,
    store,
    load,
    populateFromSession,
    getPublicKey,
    updatePublicKey,
    getMozAccountAuthUrl,
    createBackup,
    getBackup,
  };
});

export default useUserStore;
