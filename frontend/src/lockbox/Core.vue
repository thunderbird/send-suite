<script setup>
import { ref, inject, provide, watch } from 'vue';
import Uploader from '@/common/upload';
import { getContainerKeyFromChallenge } from '@/common/challenge.js';
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

const api = inject('api');
const userRef = inject('userRef');
const keychainRef = inject('keychainRef');

// =======================================================================
// File/Folder Manager
//
const uploader = new Uploader(userRef, keychainRef, api);

// Load folders once we have a user.
// Likely unnecessary once we have user sessions on the server.
watch(
  () => userRef.value.id,
  () => {
    getFolders();
  }
);

const folders = ref([]);
const currentFolderId = ref(null);
const currentFile = ref(null);

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
}

async function setCurrentFile(obj) {
  console.log(`you called Core.setCurrentFile with:`);
  console.log(obj);
  if (!obj) {
    // reset
    currentFile.value = null;
    return;
  }
  const { size, type } = await api.getUploadMetadata(obj.uploadId);
  currentFile.value = {
    ...obj,
    upload: {
      size,
      type,
    },
  };
}

// TODO: actually limit this to a specific folder
async function getFolders(root) {
  if (!userRef.value.id) {
    console.log(`no valid user id`);
    return;
  }
  if (!root) {
    folders.value = await api.getAllFolders(userRef.value.id);
    console.log(`loaded ${folders.value.length} folders`);
  } else {
    console.log(`TBD: what to do if we specify a root folder`);
  }
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

async function createFolder(parentFolderId = 0) {
  console.log(`you want to create a folder`);
  const response = await api.createFolder(userRef.value.id, 'Untitled');
  console.log(response);
  // await keychain.createAndAddContainerKey(1);
  await keychainRef.value.newKeyForContainer(response.id);
  await keychainRef.value.store();
  console.log(`TODO: only reload the one folder`);
  await getFolders();
}

async function uploadItem(fileBlob, folderId) {
  console.log(`Rendering Upload component with containerId and fileBlob`);
  const itemObj = await uploader.doUpload(fileBlob, folderId);
  if (itemObj) {
    getFolders();
  }
}
async function deleteFolder(id) {
  // remove self from group?
  // or burn the folder?
  const resp = await api.deleteContainer(id);
  if (resp) {
    console.log(`delete successful, updating folder list`);
    getFolders();
    setCurrentFile(null);
  }
}

async function copyItems(itemIds, destinationFolderId) {}

async function deleteItemAndContent(itemId, folderId) {
  // `true` as the third arg means delete the Content, not just the Item
  const result = await api.deleteItem(itemId, folderId, true);
  if (result) {
    getFolders();
    setCurrentFile(null);
  }
}

async function moveItems(itemIds, destinationFolderId) {
  // this.copy();
  // this.delete();
}

provide('folderManager', {
  folders,
  getFolders,
  createFolder,
  deleteFolder,
  currentFolderId,
  setCurrentFolderId,
  getDefaultFolder,
  currentFile,
  setCurrentFile,
  uploadItem,
  deleteItemAndContent,
});

// =======================================================================
// Sharing Manager

// and functions for toggling selections, sharing selections, etc.
//
const itemMap = ref(null);
const selectedItemsForSharing = ref([]);
const sharedWithMe = ref([]);
const sharedByMe = ref([]);

watch(
  () => userRef.value.id,
  () => {
    getFoldersSharedWithMe();
    getFoldersSharedByMe();
  }
);

function toggleItemForSharing(itemId) {
  console.log(`here is the itemId to toggle: ${itemId}`);
  if (selectedItemsForSharing.value.includes(itemId)) {
    // remove
    selectedItemsForSharing.value = selectedItemsForSharing.value.filter(
      (id) => id !== itemId
    );
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
async function acceptShare(hash, password) {
  const { unwrappedKey, containerId } = await getContainerKeyFromChallenge(
    hash,
    password,
    api,
    keychainRef
  );
  console.log(`unwrappedKey: ${unwrappedKey}`);
  console.log(`containerId: ${containerId}`);

  // let id;

  if (userRef.value.id) {
    // TODO: if the user has already used the accessLink successfully
    // we should skip this part and just return true
    // There's no need to create a duplicate invitation and membership
    console.log(`Using existing user id`);
    // TODO: this in particular needs to be server-side
    // Create an Invitation and set it to ACCEPTED
    const createInvitationResp = await api.createInvitationForHash(
      hash,
      userRef.value.id
    );
    if (!createInvitationResp) {
      return false;
    }

    const addMemberResp = await api.addMemberToContainer(
      userRef.value.id,
      containerId
    );
    console.log(`adding user to convo`);
    console.log(addMemberResp);
    if (!addMemberResp) {
      return false;
    }
  } else {
    // TODO: consider switching to sessionStorage
    // Generate a temporary keypair
    // for encrypting containerKey in keychain.
    await keychainRef.value.rsa.generateKeyPair();
  }
  await keychainRef.value.add(containerId, unwrappedKey);
  await keychainRef.value.store();
  return true;
}

async function getFoldersSharedWithMe() {
  if (!userRef.value.id) {
    console.log(`no valid user id`);
    return;
  }
  sharedWithMe.value = await api.getFoldersSharedWithUser(userRef.value.id);
}

async function getFoldersSharedByMe() {
  if (!userRef.value.id) {
    console.log(`no valid user id`);
    return;
  }
  sharedByMe.value = await api.getFoldersSharedByUser(userRef.value.id);
}

async function getSharedFolder(hash) {
  return await api.getContainerWithItemsForHash(hash);
}

async function getSharesForFolder(containerId) {
  if (!userRef.value.id) {
    console.log(`no valid user id`);
    return;
  }
  // return await api.getSharesForFolder(containerId, userRef.value.id);
  // Changing in favor of searching the local array
  return sharedByMe.value.filter((share) => share.container.id === containerId);
}

async function updateInvitationPermissions(
  containerId,
  invitationId,
  permission
) {
  if (!userRef.value.id) {
    console.log(`no valid user id`);
    return;
  }
  const result = await api.updateInvitationPermissions(
    containerId,
    userRef.value.id,
    invitationId,
    permission
  );

  if (result) {
    getFoldersSharedByMe();
  }
  return result;
}
async function updateAccessLinkPermissions(
  containerId,
  accessLinkId,
  permission
) {
  if (!userRef.value.id) {
    console.log(`no valid user id`);
    return;
  }
  const result = await api.updateAccessLinkPermissions(
    containerId,
    userRef.value.id,
    accessLinkId,
    permission
  );

  if (result) {
    getFoldersSharedByMe();
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

async function removeGroupMember(userId, folderId) {
  const success = await removeMemberFromContainer(userId, folderId);
  if (success) {
    // update our ref
    await getFoldersSharedByMe();
  }
  return success;
}

provide('sharingManager', {
  toggleItemForSharing,
  createItemMap,
  itemMap,
  selectedItemsForSharing,
  acceptShare,
  sharedWithMe,
  sharedByMe,
  getFoldersSharedWithMe,
  getFoldersSharedByMe,
  getGroupMembers,
  addGroupMember,
  removeGroupMember,
  getSharedFolder,
  getSharesForFolder,
  updateInvitationPermissions,
  updateAccessLinkPermissions,
});
</script>

<template>
  <slot></slot>
</template>
