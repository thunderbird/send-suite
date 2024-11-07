import { UserResponse } from '@/stores/user-store.types';
import { FolderStore as FS } from './folder-store';

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
  daysToExpiry?: number;
  expired?: boolean;
};

export type Upload = UploadResponse;

export type ShareResponse = {
  id?: number;
  containerId?: number;
  container?: ContainerResponse;
  senderId: number;
  sender?: UserResponse;
};

export type FolderStore = FS;
