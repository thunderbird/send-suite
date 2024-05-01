import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import useApiStore from '@/stores/api-store';
import useUserStore from '@/stores/user-store';
import useKeychainStore from '@/stores/keychain-store';
import { Keychain, Util } from '@/lib/keychain';
import { getContainerKeyFromChallenge } from '@/lib/challenge';
import Sharer from '@/lib/share';
import { Container, Item } from '@/types';
import { User } from '@/lib/user';

const useSharingStore = defineStore('sharingManager', () => {
  const { api } = useApiStore();
  const { user } = useUserStore();
  const { keychain } = useKeychainStore();

  const sharer = new Sharer(user as User, keychain as Keychain, api);

  const _links = ref([]);

  const links = computed(() => {
    return [..._links.value];
  });

  async function createAccessLink(
    folderId: number,
    password: string,
    expiration: string
  ): Promise<string | null> {
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
    // TODO: consider just updating sharer.requestAccessLink so that it returns the whole link and then pushing it to _links
    await fetchAccessLinks(folderId);
    return url;
  }

  async function acceptAccessLink(
    linkId: string,
    password: string
  ): Promise<boolean> {
    // Check for existence of link.
    const { unwrappedKey, containerId } = await getContainerKeyFromChallenge(
      linkId,
      password,
      api,
      keychain as Keychain
    );

    if (user.id) {
      // Use the AccessLink to make the User a member of the shared folder.
      const acceptAccessLinkResp = await api.call(
        `sharing/${linkId}/member/accept`,
        {},
        'POST'
      );

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

  async function isAccessLinkValid(linkId: string): Promise<{ id: string }> {
    return await api.call<{ id: string }>(`sharing/exists/${linkId}`);
  }

  async function fetchAccessLinks(folderId: number): Promise<void> {
    _links.value = await api.call(`containers/${folderId}/links`);
  }

  async function shareItems(
    itemsArray: Item[],
    password: string
  ): Promise<string | null> {
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

  async function getSharedFolder(hash: string) {
    return await api.call<Container>(`sharing/${hash}/`);
  }

  async function getInvitations(userId: number) {
    // TODO: shift the userId from frontend argument to backend session
    return await api.call(`users/${userId}/invitations/`);
  }

  async function getFoldersSharedWithUser(userId: number) {
    // TODO: shift the userId from frontend argument to backend session
    return await api.call<{ [key: string]: any }[]>(
      `users/${userId}/folders/sharedWithUser`
    );
  }

  async function getFoldersSharedByUser(userId: number) {
    // TODO: shift the userId from frontend argument to backend session
    return await api.call(`users/${userId}/folders/sharedByUser`);
  }

  async function getSharesForFolder(containerId: number, userId: number) {
    // TODO: shift the userId from frontend argument to backend session
    return await api.call(`containers/${containerId}/shares`, {
      userId,
    });
  }

  async function acceptInvitation(invitationId: number, containerId: number) {
    return await api.call(
      `containers/${containerId}/member/accept/${invitationId}`,
      {},
      'POST'
    );
  }

  async function updateInvitationPermissions(
    containerId: number,
    userId: number,
    invitationId: number,
    permission: number
  ) {
    return await api.call(
      `containers/${containerId}/shares/invitation/update`,
      { userId, invitationId, permission },
      'POST'
    );
  }

  async function updateAccessLinkPermissions(
    containerId: number,
    userId: number,
    accessLinkId: string,
    permission: number
  ) {
    return await api.call(
      `containers/${containerId}/shares/accessLink/update`,
      { userId, accessLinkId, permission },
      'POST'
    );
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
    getInvitations,
    getFoldersSharedWithUser,
    getFoldersSharedByUser,
    getSharesForFolder,
    acceptInvitation,
    updateInvitationPermissions,
    updateAccessLinkPermissions,
  };
});

export default useSharingStore;
