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

  // TODO: move this to the server-side
  async function acceptAccessLink(linkId, password) {
    // Check for existence of link
    const { unwrappedKey, containerId } = await getContainerKeyFromChallenge(linkId, password, api, keychain);
    console.log(`unwrappedKey: ${unwrappedKey}`);
    console.log(`containerId: ${containerId}`);

    if (user.id) {
      // TODO: if the user has already used the accessLink successfully
      // we should skip this part and just return true
      // There's no need to create a duplicate invitation and membership
      console.log(`Using existing user id`);
      // TODO: this in particular needs to be server-side
      // Create an Invitation and set it to ACCEPTED
      const createInvitationResp = await api.createInvitationForAccessLink(linkId, user.id);
      // TODO: reminder that this creates an invitation, where the value of
      // the wrappedKey is the password-wrapped one, not the publicKey wrapped one.

      if (!createInvitationResp) {
        return false;
      }

      const addMemberResp = await api.addMemberToContainer(user.id, containerId);
      console.log(`adding user to convo`);
      console.log(addMemberResp);
      if (!addMemberResp) {
        return false;
      }
    } else {
      // TODO: consider switching to sessionStorage
      // Generate a temporary keypair
      // for encrypting containerKey in keychain.
      await keychain.rsa.generateKeyPair();
    }
    await keychain.add(containerId, unwrappedKey);
    await keychain.store();
    return true;
  }

  async function isAccessLinkValid(linkId) {
    return await api.isAccessLinkValid(linkId);
  }

  async function accessLinksForFolder(folderId) {
    return await api.getAccessLinksForContainer(folderId);
  }

  return {
    // Getters ==================================

    // Actions ==================================
    createAccessLink,
    isAccessLinkValid,
    acceptAccessLink,
    accessLinksForFolder,
  };
});

export default useSharingStore;
