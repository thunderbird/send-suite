import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import useApiStore from '@/stores/api-store';
import useUserStore from '@/stores/user-store';
import useKeychainStore from '@/stores/keychain-store';
import { Util } from '@/lib/keychain';
import Sharer from '@/common/share';

/*
ok...what do we want out of the sharing manager?

CRUD for:
- access links
- invitations

accepting:
- access links
- invitations


access links, like folders, are something that we get from the api.
and like downloading or uploading, we use a helper class

*/

const useSharingStore = defineStore('sharingManager', () => {
  const { api } = useApiStore();
  const { user } = useUserStore();
  const { keychain } = useKeychainStore();

  const sharer = new Sharer(user, keychain, api);

  async function createAccessLink(folderId, password, expiration) {
    let shouldAddPasswordAsHash = false;

    if (password.length === 0) {
      password = Util.generateRandomPassword();
      shouldAddPasswordAsHash = true;
    }

    let url = await sharer.requestAccessLink(folderId, password, expiration);

    if (!url) {
      return null;
    }

    if (shouldAddPasswordAsHash) {
      url = `${url}#${password}`;
    }

    return url;
  }

  return {
    // Getters ==================================

    // Actions ==================================
    createAccessLink,
  };
});

export default useSharingStore;
