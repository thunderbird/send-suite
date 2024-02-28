import { defineStore } from 'pinia';
import { User } from '@/lib/user';
import useApiStore from '@/stores/api-store';
import { Storage } from '@/lib/storage';

const useUserStore = defineStore('user', () => {
  const { api } = useApiStore();
  const storage = new Storage();

  const user = new User(api, storage);

  // After login, get user from backend and save it locally.
  // Returns a boolean signaling whether successfully populated the user.
  async function populateFromSession() {
    const userResp = await api.callApi(`users/me`);
    if (!userResp.user) {
      return;
    }

    const { id, email, tier } = userResp.user;

    user.id = id;
    user.email = email;
    user.tier = tier;

    return true;
  }

  async function getPublicKey() {
    // Explicitly passing user id; this route is for retrieving
    // any user's public key, not just the currently logged in user
    const resp = await api.callApi(`users/publickey/${user.id}`);
    return resp.publicKey;
  }

  async function updatePublicKey(jwkPublicKey) {
    const resp = await api.callApi(
      `users/publickey`,
      {
        publicKey: jwkPublicKey,
      },
      'POST'
    );
    return resp.update?.publicKey;
  }

  async function getMozAccountAuthUrl() {
    const resp = await api.callApi(`lockbox/fxa/login`);
    return resp.url;
  }

  return {
    user,
    populateFromSession,
    getPublicKey,
    updatePublicKey,
    getMozAccountAuthUrl,
  };
});

export default useUserStore;
