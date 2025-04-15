import { CONTAINER_TYPE } from '@/lib/const';
import Downloader from '@/lib/download';
import Uploader from '@/lib/upload';
import useApiStore from '@/stores/api-store';
import useKeychainStore from '@/stores/keychain-store';
import useUserStore from '@/stores/user-store';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import {
  Container,
  ContainerResponse,
  Item,
  ItemResponse,
} from '@/apps/send/stores/folder-store.types';
import { ApiConnection } from '@/lib/api';
import { NamedBlob } from '@/lib/filesync';
import { backupKeys } from '@/lib/keychain';
import { CLIENT_MESSAGES } from '@/lib/messages';
import { checkBlobSize, formatBlob } from '@/lib/utils';

import useMetricsStore from '@/stores/metrics';
import { useStatusStore } from './status-store';

export interface FolderStore {
  rootFolder: Container;
  defaultFolder: Container | null;
  visibleFolders: Container[];
  selectedFolder: Container;
  selectedFile: ItemResponse;
  createFolder: (
    name?: string,
    parentId?: string,
    shareOnly?: boolean
  ) => Promise<Container | null>;
  sync: () => Promise<void>;
  init: () => void;
  print: () => void;
  goToRootFolder: (folderId: string) => Promise<void>;
  setSelectedFolder: (folderId: string) => void;
  setSelectedFile: (itemId: number) => Promise<void>;
  renameFolder: (folderId: string, name: string) => Promise<Container>;
  deleteFolder: (folderId: string) => Promise<void>;
  uploadItem: (
    fileBlob: Blob,
    folderId: string,
    api: ApiConnection
  ) => Promise<ItemResponse>;
  deleteItem: (itemId: number, folderId: string) => Promise<void>;
  renameItem: (
    folderId: string,
    itemId: number,
    name: string
  ) => Promise<ItemResponse>;
  downloadContent: (
    uploadId: string,
    containerId: string,
    wrappedKeyStr: string,
    name: string
  ) => Promise<boolean>;
}

const useFolderStore = defineStore('folderManager', () => {
  const { api } = useApiStore();
  const { user } = useUserStore();
  const { setUploadSize, progress } = useStatusStore();
  const { metrics } = useMetricsStore();
  const { keychain } = useKeychainStore();

  const uploader = new Uploader(user, keychain, api);
  const downloader = new Downloader(keychain, api);

  const folders = ref<Container[]>([]);
  const rootFolder = ref<Container | null>(null);
  const msg = ref('');

  const selectedFolderId = ref<string | null>(null);
  const selectedFileId = ref<number | null>(null);

  const defaultFolder = computed(() => {
    if (!folders?.value) {
      return null;
    }
    const total = folders.value.length;
    return total === 0 ? null : folders.value[total - 1];
  });

  const visibleFolders = computed(() => {
    if (folders.value.length === 0) {
      return [];
    }
    return calculateFolderSizes(folders.value);
  });

  const selectedFolder = computed<Container | null>(() => {
    if (!selectedFolderId.value) return null;
    return findContainer(selectedFolderId.value, folders.value);
  });

  const selectedFile = computed<Item | null>(() => {
    if (!selectedFileId.value || !rootFolder.value?.items) return null;
    return findItem(selectedFileId.value, rootFolder.value.items);
  });

  function init(): void {
    console.log(`initializing the folderStore`);
    folders.value = [];
    rootFolder.value = null;

    selectedFolderId.value = null;
    selectedFileId.value = null;
  }

  async function fetchSubtree(rootFolderId: string): Promise<void> {
    const tree = await api.call<ContainerResponse>(
      `containers/${rootFolderId}/`
    );
    folders.value = tree.children;
    rootFolder.value = tree;
  }

  async function fetchUserFolders(): Promise<void> {
    const userFolders = await api.call<ContainerResponse[]>(`users/folders`);
    folders.value = userFolders;
    rootFolder.value = null;
  }

  async function goToRootFolder(folderId: string | null): Promise<void> {
    if (folderId) {
      await fetchSubtree(folderId);
    } else {
      await fetchUserFolders();
      selectedFolderId.value = null;
      selectedFileId.value = null;
    }
  }

  function setSelectedFolder(folderId: string): void {
    selectedFolderId.value = folderId;
    selectedFileId.value = null;
  }

  async function setSelectedFile(itemId: number): Promise<void> {
    selectedFolderId.value = null;
    selectedFileId.value = itemId;
  }

  async function createFolder(
    name = 'Untitled',
    parentId?: string,
    shareOnly = false
  ): Promise<Container | null> {
    if (rootFolder.value) {
      parentId = rootFolder.value.id;
    }
    const containerResponse = await api.call<{ container: Container }>(
      `containers`,
      {
        name,
        type: CONTAINER_TYPE.FOLDER,
        parentId,
        shareOnly,
      },
      'POST'
    );

    if (containerResponse?.container) {
      const { container } = containerResponse;
      folders.value = [...folders.value, container];
      await keychain.newKeyForContainer(container.id);
      await backupKeys(keychain, api, msg);
      await keychain.store();
      return container;
    }
    return null;
  }

  async function renameFolder(
    folderId: string,
    name: string
  ): Promise<Container> {
    const result = await api.call<ContainerResponse>(
      `containers/${folderId}/rename`,
      { name },
      'POST'
    );
    if (result) {
      const node = findContainer(folderId, folders.value);
      if (node) {
        node.name = result.name;
      }
    }
    return result;
  }

  async function renameItem(
    folderId: string,
    itemId: number,
    name: string
  ): Promise<Item> {
    const result = await api.call<ItemResponse>(
      `containers/${folderId}/item/${itemId}/rename`,
      { name },
      'POST'
    );
    if (result && rootFolder.value?.items) {
      const node = findItem(itemId, rootFolder.value.items);
      if (node) {
        node.name = result.name;
      }
    }
    return result;
  }

  async function uploadItem(
    fileBlob: NamedBlob,
    folderId: string,
    api: ApiConnection
  ): Promise<Item> {
    progress.error = '';

    const canUpload = await checkBlobSize(fileBlob);

    if (!canUpload) {
      progress.error = CLIENT_MESSAGES.FILE_TOO_BIG;
      throw new Error('Too big');
    }

    const formattedBlob = await formatBlob(fileBlob);

    setUploadSize(formattedBlob.size);

    try {
      const newItem = await uploader.doUpload(
        formattedBlob,
        folderId,
        api,
        progress
      );
      if (newItem && rootFolder.value) {
        rootFolder.value.items = [...rootFolder.value.items, newItem];
      }
      return newItem;
    } catch (error) {
      progress.error = error.message;
      throw new Error('Upload failed');
    }
  }

  async function deleteFolder(folderId: string): Promise<void> {
    const resp = await api.call<{ result: { message: string }[] }>(
      `containers/${folderId}`,
      {},
      'DELETE'
    );

    if (resp?.result.length > 0) {
      folders.value = [...folders.value.filter((f) => f.id !== folderId)];
    }
  }

  async function deleteItem(itemId: number, folderId: string): Promise<void> {
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
    containerId: string,
    wrappedKeyStr: string,
    name: string
  ): Promise<boolean> {
    return await downloader.doDownload(
      uploadId,
      containerId,
      wrappedKeyStr,
      name,
      metrics,
      progress
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
    rootFolder: computed(() => rootFolder.value),
    defaultFolder: computed(() => defaultFolder.value),
    visibleFolders: computed(() => visibleFolders.value),
    selectedFolder: computed(() => selectedFolder.value),
    selectedFile: computed(() => selectedFile.value),
    print,
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

function calculateFolderSizes(folders: Container[]): Container[] {
  const foldersWithSizes = folders.map((folder) => {
    const size =
      folder.items?.reduce(
        (total, { upload }) => total + upload?.size || 0,
        0
      ) || 0;

    folder.size = size;
    return folder;
  });
  return foldersWithSizes;
}

function findContainer(
  id: string,
  containers: Container[] | undefined
): Container | null {
  if (!containers) return null;
  return containers.find((container) => container.id === id) || null;
}

function findItem(id: number, items: Item[] | undefined): Item | null {
  if (!items) return null;
  return items.find((item) => item.id === id) || null;
}
