import { UserResponse } from '@/stores/user-store.types';
import { Container, Item } from '@/types';
import { FolderStore as FS } from './folder-store';

export type ContainerResponse = Container;

export type FolderResponse = ContainerResponse;

export type Folder = FolderResponse;

export type ItemResponse = Item;

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
  reportedAt?: Date;
  reported?: boolean;
};

export type Upload = UploadResponse;

export type ShareResponse = {
  id?: number;
  containerId?: string;
  container?: ContainerResponse;
  senderId: string;
  sender?: UserResponse;
};

export type FolderStore = FS;

export { Container, Item };
