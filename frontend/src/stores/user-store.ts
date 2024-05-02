import { defineStore } from 'pinia';
import { User } from '@/lib/user';
import useApiStore from '@/stores/api-store';
import { Storage } from '@/lib/storage';
import { AsyncJsonResponse, Backup } from '@/types';

// Providing just enough typing for a user-store to be passed
// to init() (in init.ts).
export interface UserStore {
  user: User;
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

  const user = new User(api, storage);

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
    populateFromSession,
    getPublicKey,
    updatePublicKey,
    getMozAccountAuthUrl,
    createBackup,
    getBackup,
  };
});

export default useUserStore;
