import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import useApiStore from '@/stores/api-store';
import useUserStore from '@/stores/user-store';
import useKeychainStore from '@/stores/keychain-store';
import Uploader from '@/common/upload';
import Downloader from '@/common/download';

const useFolderStore = defineStore('folderManager', () => {
  const { api } = useApiStore();
  const { user } = useUserStore();
  const { keychain } = useKeychainStore();
  const uploader = new Uploader(user, keychain, api);
  const downloader = new Downloader(keychain, api);

  const folders = ref([]);
  const rootFolder = ref(null);

  const selectedFolderId = ref(0);
  const selectedFileId = ref(0);

  const defaultFolder = computed(() => {
    const total = folders.value.length;
    return total === 0 ? null : folders.value[total - 1];
  });

  const visibleFolders = computed(() => {
    if (folders.value.length === 0) {
      return [];
    }
    return calculateFolderSizes(folders.value);
  });

  const selectedFolder = computed(() => findNode(selectedFolderId.value, folders.value));

  const selectedFile = computed(() => findNode(selectedFileId.value, rootFolder.value?.items));

  async function fetchSubtree(rootId) {
    const tree = await api.getFolderTree(user.id, rootId);
    folders.value = tree.children;
    rootFolder.value = tree;
  }

  async function fetchUserFolders() {
    const userFolders = await api.getUserFolders(user.id);
    console.log(`fetchUserFolders got these:`);
    console.log(userFolders);
    folders.value = userFolders;
    rootFolder.value = null;
  }

  async function goToRootFolder(folderId) {
    if (folderId) {
      await fetchSubtree(folderId);
    } else {
      await fetchUserFolders();
      selectedFolderId.value = null;
      selectedFileId.value = null;
    }
  }

  function setSelectedFolder(folderId) {
    // Updates the computed value
    selectedFolderId.value = folderId;
    selectedFileId.value = null;
  }

  async function setSelectedFile(itemId) {
    // Updates the computed value
    selectedFolderId.value = null;
    selectedFileId.value = itemId;
  }

  async function createFolder(parentId = 0) {
    if (rootFolder.value) {
      parentId = rootFolder.value.id;
    }
    const newFolder = await api.createFolder(user.id, 'Untitled', parentId);
    if (newFolder) {
      folders.value = [...folders.value, newFolder];
      await keychain.newKeyForContainer(newFolder.id);
      await keychain.store();
    }
  }

  async function renameFolder(folderId, name) {
    const result = await api.renameFolder(folderId, name);
    if (result) {
      // Update name locally, without re-fetching
      const node = findNode(folderId, folders.value);
      node.name = result.name;
    }
    return result;
  }

  async function renameItem(folderId, itemId, name) {
    const result = await api.renameItem(folderId, itemId, name);
    if (result) {
      const node = findNode(itemId, rootFolder.value.items);
      node.name = result.name;
    }
    return result;
  }

  async function uploadItem(fileBlob, folderId) {
    const newItem = await uploader.doUpload(fileBlob, folderId);
    if (newItem) {
      rootFolder.value.items = [...rootFolder.value.items, newItem];
    }
    return newItem;
  }

  async function deleteFolder(id) {
    // remove self from group?
    // or burn the folder?
    const resp = await api.deleteContainer(id);
    if (resp) {
      folders.value = [...folders.value.filter((f) => f.id !== id)];
    }
  }

  async function deleteItem(itemId, folderId) {
    // `true` as the third arg means delete the Content, not just the Item
    const result = await api.deleteItem(itemId, folderId, true);
    if (result) {
      if (selectedFileId === itemId) {
        setSelectedFile(null);
      }
      if (rootFolder.value?.items) {
        rootFolder.value.items = [...rootFolder.value.items.filter((i) => i.id !== itemId)];
      }
    }
  }

  async function downloadContent(uploadId, containerId, wrappedKey, name) {
    const success = await downloader.doDownload(uploadId, containerId, wrappedKey, name);
  }

  return {
    // State ====================================
    rootFolder,

    // Getters ==================================
    defaultFolder,
    visibleFolders,
    selectedFolder,
    selectedFile,

    // Actions ==================================
    fetchSubtree,
    fetchUserFolders,
    goToRootFolder,
    setSelectedFolder,
    setSelectedFile,
    createFolder,
    renameFolder,
    deleteFolder,
    renameItem,
    uploadItem,
    deleteItem,
    downloadContent,
  };
});

export default useFolderStore;

function calculateFolderSizes(folders) {
  // NOT recursive. (yet)
  // To do this properly, we'd want to ask the server.
  // Otherwise, we'd have to fetch all descendents in order
  // to do the full calculation.
  const foldersWithSizes = folders.map((folder) => {
    let size = folder.items?.reduce((total, { upload }) => total + upload?.size || 0, 0);
    if (isNaN(size)) {
      size = 0;
    }
    folder.size = size;
    return folder;
  });
  return foldersWithSizes;
}

function findNode(id, collection) {
  if (!collection) {
    return null;
  }

  for (let node of collection) {
    if (node.id === id) {
      return node;
    }
  }

  // Shouldn't we search .children of each node?
  // Only if we're grabbing folders recursively from the backend.

  return null;
}
