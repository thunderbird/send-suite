import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import useApiStore from '@/stores/api-store';
import useUserStore from '@/stores/user-store';
import useKeychainStore from '@/stores/keychain-store';
import Uploader from '@/lib/upload';
import Downloader from '@/lib/download';
import { CONTAINER_TYPE } from '@/lib/const';

import {
  Folder,
  FolderResponse,
  Item,
  ItemResponse,
  FolderStore,
} from '@/apps/lockbox/stores/folder-store.types';
import { NamedBlob } from '@/lib/filesync';

const useFolderStore: () => FolderStore = defineStore('folderManager', () => {
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

  const selectedFolder = computed<Folder>(
    () => findNode(selectedFolderId.value, folders.value) as Folder
  );

  const selectedFile = computed<Item>(
    () => findNode(selectedFileId.value, rootFolder.value?.items) as Item
  );

  function init(): void {
    console.log(`initializing the folderStore`);
    folders.value = [];
    rootFolder.value = null;

    selectedFolderId.value = 0;
    selectedFileId.value = 0;
  }

  async function fetchSubtree(rootFolderId: number): Promise<void> {
    const tree = await api.call<FolderResponse>(`containers/${rootFolderId}/`);
    folders.value = tree.children;
    rootFolder.value = tree;
  }

  async function fetchUserFolders(): Promise<void> {
    const userFolders = await api.call<FolderResponse[]>(`users/folders`);
    folders.value = userFolders;
    rootFolder.value = null;
  }

  async function goToRootFolder(folderId: number): Promise<void> {
    if (folderId) {
      await fetchSubtree(folderId);
    } else {
      await fetchUserFolders();
      selectedFolderId.value = null;
      selectedFileId.value = null;
    }
  }

  function setSelectedFolder(folderId: number): void {
    // Updates the computed value
    selectedFolderId.value = folderId;
    selectedFileId.value = null;
  }

  async function setSelectedFile(itemId: number): Promise<void> {
    // Updates the computed value
    selectedFolderId.value = null;
    selectedFileId.value = itemId;
  }

  async function createFolder(
    name = 'Untitled',
    parentId = 0,
    shareOnly = false
  ): Promise<Folder | null> {
    if (rootFolder.value) {
      parentId = rootFolder.value.id;
    }
    const { container } = await api.call<{ container: Folder }>(
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
    return null;
  }

  async function renameFolder(folderId: number, name: string): Promise<Folder> {
    const result = await api.call<FolderResponse>(
      `containers/${folderId}/rename`,
      { name },
      'POST'
    );
    if (result) {
      // Update name locally, without re-fetching
      const node = findNode(folderId, folders.value);
      node.name = result.name;
    }
    return result;
  }

  async function renameItem(
    folderId: number,
    itemId: number,
    name: string
  ): Promise<Item> {
    const result = await api.call<ItemResponse>(
      `containers/${folderId}/item/${itemId}/rename`,
      { name },
      'POST'
    );
    if (result) {
      const node = findNode(itemId, rootFolder.value.items);
      node.name = result.name;
    }
    return result;
  }

  async function uploadItem(
    fileBlob: NamedBlob,
    folderId: number
  ): Promise<Item> {
    const newItem = await uploader.doUpload(fileBlob, folderId);
    if (newItem && rootFolder.value) {
      rootFolder.value.items = [...rootFolder.value.items, newItem];
    }
    return newItem;
  }

  async function deleteFolder(folderId: number): Promise<void> {
    // currently burning the folder, which deletes child folders, items, memberships,
    // and "ephemeral" users
    const resp = await api.call<{ result: { message: string }[] }>(
      `containers/${folderId}`,
      {},
      'DELETE'
    );

    if (resp?.result.length > 0) {
      folders.value = [...folders.value.filter((f) => f.id !== folderId)];
    }
  }

  async function deleteItem(itemId: number, folderId: number): Promise<void> {
    const result = await api.call(
      `containers/${folderId}/item/${itemId}`,
      {
        shouldDeleteContent: true,
      },
      'DELETE'
    );
    if (result) {
      if (selectedFileId.value === itemId) {
        setSelectedFile(null);
      }
      if (rootFolder.value?.items) {
        rootFolder.value.items = [
          ...rootFolder.value.items.filter((i: Item) => i.id !== itemId),
        ];
      }
    }
  }

  async function downloadContent(
    uploadId: string,
    containerId: number,
    wrappedKeyStr: string,
    name: string
  ): Promise<boolean> {
    return await downloader.doDownload(
      uploadId,
      containerId,
      wrappedKeyStr,
      name
    );
  }

  function print(): void {
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

function calculateFolderSizes(folders: Folder[]): Folder[] {
  // NOT recursive. (yet)
  // To do this properly, we'd want to ask the server.
  // Otherwise, we'd have to fetch all descendents in order
  // to do the full calculation.
  const foldersWithSizes = folders.map((folder) => {
    let size =
      folder.items?.reduce(
        (total, { upload }) => total + upload?.size || 0,
        0
      ) || 0;

    folder.size = size;
    return folder;
  });
  return foldersWithSizes;
}

function findNode(
  id: number,
  collection: Folder[] | Item[]
): Folder | Item | null {
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
