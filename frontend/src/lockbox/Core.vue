<script setup>
import { ref, inject, provide, watch, toRaw } from 'vue';
import useApiStore from '@/stores/api-store';
import useUserStore from '@/stores/user-store';
import useKeychainStore from '@/stores/keychain-store';
import useFolderStore from '@/lockbox/stores/folder-store';

import Uploader from '@/common/upload';
import { getContainerKeyFromChallenge } from '@/common/challenge.js';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
/*
I need to know which one has been "selected"
But also, selection should only be enabled when run as an extension.

This is what I need to return from .onFileUpload.addListener callback:
return { url, aborted: false, };

But...I need to figure out:
- if I use the built-in "convert to...", what folder does it get uploaded to?
- how do I select a file from lockbox to attach?
  - am I now bypassing the cloudfile functionality and inserting my own link?

*/

const { api } = useApiStore();
const { user } = useUserStore();
const { keychain } = useKeychainStore();
const { fetchUserFolders } = useFolderStore();

/*
      Previously:
      - asked the api for:
        - all folders (if no root folder id)
        - sub folders of root folder (if root folder id)
      - updated:
        - folders
        - parentFolderId
        - rootFolder
        - currentfolder
        - currentFile

      Now, we want this to just return the visible folders.
      We'll need a separate function for retrieving folders
      Ideally, we're not running out the API all the time, only after something has changed.
      But, how do we know when it has changed?

What things do we actually need from the folderStore?
- current folder
- current file
- visible folders
- folder path
These are all derivable ("getters").

Things I need to keep track of:
- visible root id

And, some actions:
- create Folder
- upload File
- delete Folder (and content)
- rename File
- rename Folder
After each of these, I will need to update my folder tree

maybe we move the following:
- recentFolders (to a history/activity store?)



    */
// =======================================================================
// File/Folder Manager
//
const uploader = new Uploader(user, keychain, api);

// Load folders once we have a user.
// Likely unnecessary once we have user sessions on the server.
watch(
  () => user.id,
  () => {
    fetchUserFolders();
    // getVisibleFolders();
    // getRecentActivity();
  }
);

const folders = ref([]);
const recentFolders = ref([]);
const currentFolderId = ref(null);
const currentFile = ref(null);
const currentFolder = ref(null);
const rootFolderId = ref(null);
const rootFolder = ref(null);
const parentFolderId = ref(null);
const folderPath = ref([]);

function getDefaultFolder() {
  // TODO: need to designate one as "default"
  // for now, just use the first one
  if (folders.value.length === 0) {
    throw Error('No folders, no default');
  }
  return folders.value[folders.value.length - 1];
}

async function setCurrentFolderId(id) {
  console.log(`just set the currentFolderId.value to ${id}`);
  currentFolderId.value = id;
  await setCurrentFile(null);

  // Also set the currentFolder
  currentFolder.value = folders.value.find((f) => f.id === id);
}

async function setRootFolderId(id) {
  console.log(`just set the rootFolderId.value to ${id}`);
  rootFolderId.value = id;
  if (!id) {
    rootFolder.value = null;
  }
}

async function setCurrentFile(obj) {
  console.log(`you called Core.setCurrentFile with:`);
  console.log(obj);
  if (!obj) {
    // reset
    currentFile.value = null;
    return;
  }
  await setCurrentFolderId(null);
  const { size, type } = await api.getUploadMetadata(obj.uploadId);
  currentFile.value = {
    ...obj,
    upload: {
      size,
      type,
    },
  };
}

function calculateFolderSizes(folders) {
  // NOT recursive.
  const foldersWithSizes = folders.map((folder) => {
    folder.size = folder.items?.reduce((total, { upload }) => total + upload?.size || 0, 0);
    return folder;
  });
  return foldersWithSizes;
}

// TODO: actually limit this to a specific folder
async function getVisibleFolders() {
  if (!user.id) {
    console.log(`no valid user id`);
    return;
  }
  let foldersFromApi;
  if (rootFolderId.value) {
    const tree = await api.getFolderTree(user.id, rootFolderId.value);
    foldersFromApi = tree.children;

    console.log(tree);

    parentFolderId.value = tree.parentId || null;
    rootFolder.value = tree;

    console.log(`root folder has these items 🍬🍬🍬🍬🍬🍬`);
    console.log(tree.items);
  } else {
    // foldersFromApi = await api.getUserFolders(user.id);

    // We want:
    // - our own folders with no parent
    // - folders shared with me
    const userFolders = await api.getUserFolders(user.id);
    // const foldersSharedwithMe = await api.getFoldersSharedWithUser(user.id);
    foldersFromApi = [
      ...userFolders,
      // ...foldersSharedwithMe.map(f => f.share.container),
    ];
  }

  folders.value = calculateFolderSizes(foldersFromApi);
  if (currentFolderId.value) {
    currentFolder.value = folders.value.find((f) => f.id === currentFolderId.value);

    // Update the currentFile, if we were already tracking one
    if (currentFile.value) {
      currentFile.value = currentFolder.value.items.find((f) => f.id === currentFile.value.id);
    }
  }

  console.log(`got foldersFromApi: `);
  console.log(foldersFromApi);
}

async function getRecentActivity() {
  if (!user.id) {
    console.log(`no valid user id`);
    return;
  }
  recentFolders.value = await api.getRecentActivity(user.id);
}

// // Make this computed?
// function sharedWithMe() {
//   // Folders I can access, but do not own
//   // This is basically a filtering function.
// }

// // Make this computed?
// function sharedWithOthers() {
//   // Folders I own, share with others
//   // This is basically a filtering function.
// }

async function search(searchString, maybeModifiedDate, maybeCreatedDate) {
  // Can only search titles, not contents
  // The date stuff could just be booleans for sorting
}

async function createDefaultFolder() {}

async function setDefaultFolder() {
  // should we be able to set a different default?
}

async function createFolder(parentId = 0) {
  console.log(`you want to create a folder`);
  const response = await api.createFolder(user.id, 'Untitled', parentId);
  console.log(response);
  // await keychain.createAndAddContainerKey(1);
  await keychain.newKeyForContainer(response.id);
  await keychain.store();
  console.log(`TODO: only reload the one folder`);
  await getVisibleFolders();
}

async function uploadItem(fileBlob, folderId) {
  console.log(`Rendering Upload component with containerId and fileBlob`);
  const itemObj = await uploader.doUpload(fileBlob, folderId);
  if (itemObj) {
    getVisibleFolders();
    getRecentActivity();
  }
  return itemObj;
}
async function deleteFolder(id) {
  // remove self from group?
  // or burn the folder?
  const resp = await api.deleteContainer(id);
  if (resp) {
    console.log(`delete successful, updating folder list`);
    getVisibleFolders();
    setCurrentFile(null);
  }
}

async function copyItems(itemIds, destinationFolderId) {}

async function deleteItemAndContent(itemId, folderId) {
  // `true` as the third arg means delete the Content, not just the Item
  const result = await api.deleteItem(itemId, folderId, true);
  if (result) {
    getVisibleFolders();
    setCurrentFile(null);
  }
}

async function moveItems(itemIds, destinationFolderId) {
  // this.copy();
  // this.delete();
}

async function renameItem(containerId, itemId, name) {
  const result = await api.renameItem(containerId, itemId, name);
  if (result) {
    console.log(`you renamed the thing`);
    console.log(result);

    // Heavy-handed, but refreshes the file name in FolderView component.
    await getVisibleFolders();

    // Get the name from the response, assign so that it updates
    // the FileInfo component.
    currentFile.value.name = result.name;
  }
  return result;
}

async function renameFolder(containerId, name) {
  const result = await api.renameFolder(containerId, name);
  if (result) {
    await getVisibleFolders();
  }
  return result;
}

async function gotoRootFolder(id) {
  if (id !== rootFolderId.value) {
    await setRootFolderId(id);
    await getVisibleFolders();
  }
}

provide('folderManager', {
  folders,
  getVisibleFolders,
  createFolder,
  deleteFolder,
  currentFolder,
  currentFolderId,
  setCurrentFolderId,
  getDefaultFolder,
  currentFile,
  setCurrentFile,
  uploadItem,
  deleteItemAndContent,
  renameFolder,
  renameItem,
  rootFolderId,
  rootFolder,
  setRootFolderId,
  parentFolderId,
  gotoRootFolder,
  recentFolders,
  getRecentActivity,
});

// =======================================================================
// Sharing Manager

// and functions for toggling selections, sharing selections, etc.
//
const itemMap = ref(null);
const selectedItemsForSharing = ref([]);
const sharedWithMe = ref([]);
const sharedByMe = ref([]);
const invitations = ref([]);

watch(
  () => user.id,
  () => {
    getFoldersSharedWithMe();
    getFoldersSharedByMe();
    getInvitations();
  }
);

function toggleItemForSharing(itemId) {
  console.log(`here is the itemId to toggle: ${itemId}`);
  if (selectedItemsForSharing.value.includes(itemId)) {
    // remove
    selectedItemsForSharing.value = selectedItemsForSharing.value.filter((id) => id !== itemId);
  } else {
    // add
    selectedItemsForSharing.value = [...selectedItemsForSharing.value, itemId];
  }
}

function createItemMap(folders) {
  const map = {};
  // TODO: optimize this
  for (let folder of folders) {
    for (let item of folder.items) {
      const { name, uploadId, wrappedKey, type } = item;
      map[item.id] = {
        containerId: folder.id,
        name,
        uploadId,
        wrappedKey,
        type,
      };
    }
  }
  itemMap.value = map;
  console.log(`itemMap created`);
  console.log(map);
}

// TODO: move this to the server-side
async function acceptAccessLink(linkId, password) {
  // Check for existence of link

  const { unwrappedKey, containerId } = await getContainerKeyFromChallenge(linkId, password, api, keychainRef);
  console.log(`unwrappedKey: ${unwrappedKey}`);
  console.log(`containerId: ${containerId}`);

  // let id;

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

async function getFoldersSharedWithMe() {
  if (!user.id) {
    console.log(`no valid user id`);
    return;
  }
  sharedWithMe.value = await api.getFoldersSharedWithUser(user.id);
}

async function getFoldersSharedByMe() {
  if (!user.id) {
    console.log(`no valid user id`);
    return;
  }
  sharedByMe.value = await api.getFoldersSharedByUser(user.id);
}

async function getSharedFolder(hash) {
  return await api.getContainerWithItemsForAccessLink(hash);
}

async function showFoldersSharedBySender(userId) {
  folders.value = sharedWithMe.value
    .filter((shareRef) => {
      const { share } = toRaw(shareRef);
      return userId === share?.sender?.id;
    })
    .map((shareRef) => {
      const { share } = toRaw(shareRef);
      return share.container;
    });
}

async function showFoldersSharedWithRecipient(userId) {
  folders.value = sharedByMe.value
    .filter((shareRef) => {
      const share = toRaw(shareRef);
      return share.invitations.some((invitation) => userId === invitation.recipientId);
    })
    .map((shareRef) => {
      const { container } = toRaw(shareRef);
      return container;
    });
}

async function getSharesForFolder(containerId) {
  if (!user.id) {
    console.log(`no valid user id`);
    return;
  }
  // return await api.getSharesForFolder(containerId, user.id);
  // Changing in favor of searching the local array
  return sharedByMe.value.filter((share) => share.container.id === containerId);
}

async function updateInvitationPermissions(containerId, invitationId, permission) {
  if (!user.id) {
    console.log(`no valid user id`);
    return;
  }
  const result = await api.updateInvitationPermissions(containerId, user.id, invitationId, permission);

  if (result) {
    await getFoldersSharedByMe();
  }
  return result;
}
async function updateAccessLinkPermissions(containerId, accessLinkId, permission) {
  if (!user.id) {
    console.log(`no valid user id`);
    return;
  }
  const result = await api.updateAccessLinkPermissions(containerId, user.id, accessLinkId, permission);

  if (result) {
    await getFoldersSharedByMe();
  }
  return result;
}

async function deleteAccessLink(hash) {
  const result = await api.deleteAccessLink(hash);

  if (result) {
    await getFoldersSharedByMe();
  }
  return result;
}

async function getGroupMembers(folderId) {
  return await api.getContainerGroupMembers(folderId);
}

async function addGroupMember(userId, folderId) {
  /*
  I think I'm creating an invitation.
  Can I reuse the code from chat?

  OK - that one creates an invitation using their public key.
  That means, I need to know their email address (or user id or whatever).

  And that's not the same as a sharing link.
  I can't create an invitation for a non-user or one without a public key.


  Here's what I think:
  - an invitation and a link are the same thing
    - (but they'd need to be combined)
  - it is keyed in two ways:
    - a password
    - a public key
  -

  */
  // update our ref
  // await getFoldersSharedByMe();
}

async function removeInvitationAndGroupMembership(containerId, invitationId) {
  const success = await api.removeInvitationAndGroupMembership(containerId, invitationId);
  if (success) {
    // update our ref
    await getFoldersSharedByMe();
  }
  return success;
}

async function getInvitations() {
  invitations.value = await api.getInvitations(user.id);
}

async function acceptInvitation(containerId, invitationId, wrappedKey) {
  // Unwrap and store key
  try {
    const unwrappedKey = await keychain.rsa.unwrapContainerKey(wrappedKey, keychain.rsa.privateKey);

    await keychain.add(containerId, unwrappedKey);
    await keychain.store();

    const resp = await api.acceptInvitation(invitationId, containerId);
    if (!resp) {
      return null;
    }
    await getFoldersSharedWithMe();
    await getInvitations();
    await getVisibleFolders();
    return resp;
  } catch (e) {
    console.log(e);
    debugger;
  }
}

provide('sharingManager', {
  itemMap,
  selectedItemsForSharing,
  sharedWithMe,
  sharedByMe,
  invitations,
  toggleItemForSharing,
  createItemMap,
  acceptAccessLink,
  deleteAccessLink,
  isAccessLinkValid,
  getFoldersSharedWithMe,
  getFoldersSharedByMe,
  showFoldersSharedBySender,
  showFoldersSharedWithRecipient,
  getGroupMembers,
  addGroupMember,
  removeInvitationAndGroupMembership,
  getSharedFolder,
  getSharesForFolder,
  updateInvitationPermissions,
  updateAccessLinkPermissions,
  acceptInvitation,
  getInvitations,
});

// =======================================================================
// Tag Manager
async function addTagForContainer(containerId, name, color) {
  await api.addTagForContainer(containerId, name, color);
  await getVisibleFolders();
}
async function addTagForItem(itemId, name, color) {
  await api.addTagForItem(itemId, name, color);
  await getVisibleFolders();
}

provide('tagManager', {
  addTagForContainer,
  addTagForItem,
});
// =======================================================================
// Misc
dayjs.extend(relativeTime);
provide('dayjs', dayjs);
</script>

<template>
  <slot></slot>
</template>
