import { UserResponse } from '@/stores/user-store.types';

export type ContainerResponse = {
  id: number;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
  type: string;

  shareOnly?: boolean;
  shares?: ShareResponse[];
  ownerId?: number;
  owner?: UserResponse;
  wrappedKey?: string;
  parentId?: number;
  parent?: ContainerResponse;
  children?: ContainerResponse[];
  items?: ItemResponse[];
  size?: number;
};

export type FolderResponse = ContainerResponse;

export type Folder = FolderResponse;

export type ItemResponse = {
  id: number;
  name: string;
  wrappedKey?: string;
  containerId?: number;
  container?: ContainerResponse;
  uploadId: string;
  type?: string;

  createdAt?: Date;
  updatedAt?: Date;
  upload?: Upload;
};

export type Item = ItemResponse;

export type UploadResponse = {
  id?: string;
  size?: number;
  ownerId?: number;
  type?: string;
  createdAt?: Date;
  owner?: {
    email: string;
  };
};

export type Upload = UploadResponse;

export type ShareResponse = {
  id?: number;
  containerId?: number;
  container?: ContainerResponse;
  senderId: number;
  sender?: UserResponse;
};

export interface FolderStore {
  rootFolder: Folder;
  defaultFolder: Folder | null;
  visibleFolders: Folder[];
  selectedFolder: Folder;
  selectedFile: ItemResponse;
  createFolder: () => Promise<Folder>;
  sync: () => Promise<void>;
  init: () => void;
  print: () => void;
  goToRootFolder: (folderId: number) => Promise<void>;
  setSelectedFolder: (folderId: number) => void;
  setSelectedFile: (itemId: number) => Promise<void>;
  renameFolder: (folderId: number, name: string) => Promise<Folder>;
  deleteFolder: (folderId: number) => Promise<void>;
  uploadItem: (fileBlob: Blob, folderId: number) => Promise<ItemResponse>;
  deleteItem: (itemId: number, folderId: number) => Promise<void>;
  renameItem: (
    folderId: number,
    itemId: number,
    name: string
  ) => Promise<ItemResponse>;
  downloadContent: (
    uploadId: string,
    containerId: number,
    wrappedKeyStr: string,
    name: string
  ) => Promise<boolean>;
}
