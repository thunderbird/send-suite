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
  async function populate() {
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

  return {
    user,
    populate,
  };
});

export default useUserStore;
