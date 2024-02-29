import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import useApiStore from '@/stores/api-store';
import useUserStore from '@/stores/user-store';
import useKeychainStore from '@/stores/keychain-store';
import Uploader from '@/common/upload';
import Downloader from '@/common/download';
import { timestamp } from '@/lib/utils';
import { CONTAINER_TYPE } from '@/lib/const';

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

  async function init() {
    console.log(`initializing the folderStore`);
    folders.value = [];
    rootFolder.value = null;

    selectedFolderId.value = 0;
    selectedFileId.value = 0;
  }

  async function fetchSubtree(rootFolderId) {
    const tree = await api.callApi(`containers/${rootFolderId}/`);
    folders.value = tree.children;
    rootFolder.value = tree;
  }

  async function fetchUserFolders() {
    const userFolders = await api.callApi(`users/folders`);
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

  async function createFolder(name = 'Untitled', parentId = 0, shareOnly = false) {
    if (rootFolder.value) {
      parentId = rootFolder.value.id;
    }
    const { container } = await api.callApi(
      `containers`,
      {
        name: name, // ?? timestamp(),
        type: CONTAINER_TYPE.FOLDER,
        parentId,
        shareOnly,
      },
      'POST'
    );
    if (container) {
      folders.value = [...folders.value, container];
      await keychain.newKeyForContainer(container.id);
      await keychain.store();
      return container;
    }
  }

  async function renameFolder(folderId, name) {
    const result = await api.callApi(`containers/${folderId}/rename`, { name }, 'POST');
    if (result) {
      // Update name locally, without re-fetching
      const node = findNode(folderId, folders.value);
      node.name = result.name;
    }
    return result;
  }

  async function renameItem(folderId, itemId, name) {
    const result = await api.callApi(`containers/${folderId}/item/${itemId}/rename`, { name }, 'POST');
    if (result) {
      const node = findNode(itemId, rootFolder.value.items);
      node.name = result.name;
    }
    return result;
  }

  async function uploadItem(fileBlob, folderId) {
    const newItem = await uploader.doUpload(fileBlob, folderId);
    if (newItem && rootFolder.value) {
      rootFolder.value.items = [...rootFolder.value.items, newItem];
    }
    return newItem;
  }

  async function deleteFolder(folderId) {
    // TODO: decide whether to:
    // - remove self from group?
    // - or burn the folder?
    const resp = await api.callApi(`containers/${folderId}`, {}, 'DELETE');
    if (resp) {
      folders.value = [...folders.value.filter((f) => f.id !== folderId)];
    }
  }

  async function deleteItem(itemId, folderId) {
    const result = await api.callApi(
      `containers/${folderId}/item/${itemId}`,
      {
        shouldDeleteContent: true,
      },
      'DELETE'
    );
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

  function print() {
    console.log(`rootFolder: ${rootFolder.value}`);
    console.log(`defaultFolder: ${defaultFolder.value}`);
    console.log(`visibleFolders: ${visibleFolders.value}`);
    console.log(`selectedFolder: ${selectedFolder.value}`);
    console.log(`selectedFile: ${selectedFile.value}`);
  }

  return {
    // State ====================================
    rootFolder,

    // Getters ==================================
    defaultFolder,
    visibleFolders,
    selectedFolder,
    selectedFile,
    print,

    // Actions ==================================
    init,
    fetchSubtree,
    fetchUserFolders,
    goToRootFolder,
    sync: async () => await goToRootFolder(null),
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
