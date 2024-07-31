import { AsyncJsonResponse } from '@/lib/api';
import { Storage } from '@/lib/storage';
import useApiStore from '@/stores/api-store';
import { Backup } from '@/stores/user-store.types';
import { UserTier, UserType } from '@/types';
import { defineStore } from 'pinia';

export interface UserStore {
  user: UserType;
  createUser: (
    email: string,
    jwkPublicKey: string,
    isEphemeral?: boolean
  ) => Promise<UserType>;
  login: (loginEmail?: string) => Promise<UserType>;
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

  const user: UserType = {
    id: 0,
    tier: UserTier.FREE,
    email: '',
  };

  function populateUser(userData: UserType) {
    user.id = userData.id;
    user.tier = userData.tier;
    user.email = userData.email;

    if (!userData.hashedEmail) {
      console.log('hashedEmail not found in user object');
    } else {
      user.hashedEmail = userData.hashedEmail;
    }
  }

  async function createUser(
    email: string,
    jwkPublicKey: string,
    isEphemeral = false
  ): Promise<UserType> {
    const resp = await api.call<{ user: UserType | null }>(
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

    return {
      id: resp.user.id,
      tier: resp.user.tier,
      email,
      hashedEmail: resp.user.hashedEmail,
    };
  }

  // TODO: delete this in favor of using the user store's populate()
  // which retrieves the user from the backend session.
  async function login(loginEmail = user.email): Promise<UserType> {
    console.log(`logging in as ${loginEmail}`);
    const resp = await api.call<UserType | null>(
      `users/login`,
      { email: loginEmail },
      'POST'
    );
    if (!resp) {
      return null;
    }

    populateUser(resp);

    return resp;
  }

  async function load(): Promise<boolean> {
    try {
      const { id, tier, email, hashedEmail } = await storage.loadUser();

      console.table({ id, tier, email });
      populateUser({ id, email, tier, hashedEmail });

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
    const userResp = await api.call<{ user: UserType }>(`users/me`);
    if (!userResp?.user) {
      // Either we didn't get a response or it doesn't have a .user
      return false;
    }

    populateUser(userResp.user);

    return true;
  }

  async function getPublicKey(): Promise<string> {
    // Explicitly passing user id; this route is for retrieving
    // any user's public key, not just the currently logged in user
    const resp = await api.call<{ publicKey: string }>(
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
