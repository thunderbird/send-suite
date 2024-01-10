import { defineStore } from 'pinia';
import { ref, computed, toRaw } from 'vue';
import useApiStore from '@/stores/api-store';
import useUserStore from '@/stores/user-store';
import useKeychainStore from '@/stores/keychain-store';
import Uploader from '@/common/upload';

const useFolderStore = defineStore('folderManager', () => {
  const { api } = useApiStore();
  const { user } = useUserStore();
  const { keychain } = useKeychainStore();
  const uploader = new Uploader(user, keychain, api);

  const folders = ref([]);
  const items = ref([]);
  const rootFolder = ref(null);
  const folderPath = ref([]);

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

  const selectedFile = computed(() => findNode(selectedFileId.value, items.value));

  async function fetchSubtree(rootId) {
    const tree = await api.getFolderTree(user.id, rootId);
    folders.value = tree.children;
    items.value = tree.items;
    rootFolder.value = tree;
  }

  async function fetchUserFolders() {
    const userFolders = await api.getUserFolders(user.id);
    console.log(`fetchUserFolders got these:`);
    console.log(userFolders);
    folders.value = userFolders;
    items.value = null;
    rootFolder.value = null;
  }

  async function goToRootFolder(folderId) {
    if (folderId) {
      await fetchSubtree(folderId);
    } else {
      await fetchUserFolders();
      selectedFolderId.value = null;
      selectedFile.value = null;
    }
  }

  function setSelectedFolder(folderId) {
    // Updates the computed value
    selectedFolderId.value = folderId;
    selectedFileId.value = null;
  }

  async function setSelectedFile(itemId) {
    selectedFolderId.value = null;
    selectedFileId.value = itemId;
  }

  async function createFolder(parentId = 0) {
    if (rootFolder.value) {
      parentId = rootFolder.value.id;
    }
    const newFolder = await api.createFolder(user.id, 'Untitled', parentId);
    folders.value = [...folders.value, newFolder];
    await keychain.newKeyForContainer(newFolder.id);
    await keychain.store();
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
      const node = findNode(itemId, items.value);
      node.name = result.name;
    }
    return result;
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
    renameItem,
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
