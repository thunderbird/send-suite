import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import useApiStore from '@/stores/api-store';
import useUserStore from '@/stores/user-store';
import useKeychainStore from '@/stores/keychain-store';
import { Util } from '@/lib/keychain';
import { getContainerKeyFromChallenge } from '@/common/challenge';
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

  const _links = ref([]);

  const links = computed(() => {
    return [..._links.value];
  });

  async function createAccessLink(folderId, password, expiration) {
    let shouldAddPasswordAsHash = false;

    console.log(`password is: ${password}`);
    if (password.length === 0) {
      console.log(`no password, generating one`);
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

    // refetch access links
    // TODO: consider just adding updating sharer.requestAccessLink so that it returns the whole link and then pushing it to _links
    await fetchAccessLinks(folderId);
    return url;
  }

  async function acceptAccessLink(linkId, password) {
    // Check for existence of link.
    const { unwrappedKey, containerId } = await getContainerKeyFromChallenge(linkId, password, api, keychain);
    console.log(`unwrappedKey: ${unwrappedKey}`);
    console.log(`containerId: ${containerId}`);

    if (user.id) {
      // Use the AccessLink to make the User a member of the shared folder.
      const acceptAccessLinkResp = await api.callApi(`sharing/${linkId}/member/accept`, {}, 'POST');

      if (!acceptAccessLinkResp) {
        return false;
      }
    } else {
      // TODO: consider switching to sessionStorage.
      // Generate a temporary keypair for encrypting containerKey in keychain.
      await keychain.rsa.generateKeyPair();
    }
    await keychain.add(containerId, unwrappedKey);
    await keychain.store();
    return true;
  }

  async function isAccessLinkValid(linkId) {
    return await api.callApi(`sharing/exists/${linkId}`);
  }

  async function fetchAccessLinks(folderId) {
    _links.value = await api.callApi(`containers/${folderId}/links`);
  }

  async function shareItems(itemsArray, password) {
    let shouldAddPasswordAsHash = false;

    console.log(`password is: ${password}`);
    if (password.length === 0) {
      console.log(`no password, generating one`);
      password = Util.generateRandomPassword();
      shouldAddPasswordAsHash = true;
    }

    let url = await sharer.shareItemsWithPassword(itemsArray, password);

    if (!url) {
      return null;
    }

    if (shouldAddPasswordAsHash) {
      url = `${url}#${password}`;
    }

    return url;
  }

  async function getSharedFolder(hash) {
    return await api.callApi(`sharing/${hash}/`);
  }

  return {
    // Getters ==================================
    links,

    // Actions ==================================
    createAccessLink,
    isAccessLinkValid,
    acceptAccessLink,
    fetchAccessLinks,
    shareItems,
    getSharedFolder,
  };
});

export default useSharingStore;
