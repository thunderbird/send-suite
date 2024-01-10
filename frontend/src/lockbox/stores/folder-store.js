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
    let foldersTemp = rootFolder.value?.children ?? [...folders.value];

    console.log(`visibleFolders will calculate sizes for:`);
    console.log(foldersTemp);

    return calculateFolderSizes(foldersTemp);
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
    console.log(`no really...I just selected a folder with id ${folderId}`);
  }

  async function setSelectedFile(itemId) {
    selectedFolderId.value = null;
    selectedFileId.value = itemId;
    console.log(`no really...I just selected a file with id ${itemId}`);
  }

  return {
    // State ====================================
    rootFolder,
    selectedFolderId,
    selectedFileId,

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
  console.log(`We got a 🌳 to search`);
  debugger;
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
  if (!collection) {
    return null;
  }

  console.log(`Searching for a node with id ${id}`);
  if (!Array.isArray(collection)) {
    return findNodeInTree(id, collection);
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
