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
    let foldersTemp = [...folders.value];
    const id = rootFolder.value?.id || 0;
    if (id) {
      foldersTemp = childrenOf(id, folders.value);
    }

    return calculateFolderSizes(foldersTemp);
  });

  const selectedFolder = computed(() => findNode(selectedFolderId.value, toRaw(folders.value)));

  const selectedFile = computed(() => findItem(selectedFileId.value, folders.value));

  async function fetchSubtree(rootId) {
    const tree = await api.getFolderTree(user.id, rootId);
    folders.value = tree.children;
    // const parentId = tree.parentId ?? null;
    // if (parentId) {
    //   // Implicitly updates part of folders.value
    //   console.log(`going to call replaceSubtree`);
    //   replaceSubtree(parentId, folders.value, tree.children);
    // } else {
    //   folders.value = tree.children;
    // }
  }

  async function fetchUserFolders() {
    const userFolders = await api.getUserFolders(user.id);
    console.log(`fetchUserFolders got these:`);
    console.log(userFolders);
    folders.value = userFolders;
  }

  async function goToRootFolder(folderId) {
    if (folderId) {
      await fetchSubtree(folderId);
      rootFolder.value = findNode(folderId, toRaw(folders.value));
    } else {
      await fetchUserFolders();
    }
  }

  function setSelectedFolder(folderId) {
    // Updates the computed value
    selectedFolderId.value = folderId;
  }

  async function setSelectedFile(itemId) {
    selectedFile.value = findItem(itemId, folders.value);
  }

  return {
    // State ====================================
    rootFolder,
    selectedFolderId,

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
  };
});

export default useFolderStore;

function calculateFolderSizes(folders) {
  // NOT recursive. (yet)
  // To do this properly, we'd want to ask the server.
  // Otherwise, we'd have to fetch all descendents in order
  // to do the full calculation.
  const foldersWithSizes = folders.map((folder) => {
    folder.size = folder.items?.reduce((total, { upload }) => total + upload?.size || 0, 0);
    return folder;
  });
  return foldersWithSizes;
}

function findNodeInTree(id, head) {
  if (head.id === id) {
    return head;
  }
  if (!head.children) {
    return null;
  }

  for (let child of head.children) {
    const found = findNode(id, child);
    if (found) {
      return found;
    }
  }
  return null;
}

function findNode(id, collection) {
  if (!Array.isArray(collection)) {
    return findNodeInTree(id, collection);
  }

  for (let node of collection) {
    if (node.id === id) {
      return node;
    }
  }

  // Shouldn't we handle children?

  return null;
}

function findItem(id, head) {
  if (!(head.items || head.children)) {
    return null;
  }

  for (let item of head.items) {
    if (item.id === id) {
      return item;
    }
  }

  for (let child of head.children) {
    const found = findItem(id, child);
    if (found) {
      return found;
    }
  }

  return null;
}

// TODO: move to computed() in store definition
function childrenOf(id, tree) {
  const node = findNode(id, tree);
  return node?.children;
}

// Destructive.
function replaceSubtree(id, tree, subtree) {
  const node = findNode(id, tree);
  if (node) {
    node.children = subtree;
  }
}
