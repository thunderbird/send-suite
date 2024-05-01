import type { InjectionKey } from 'vue';
import dayjs from 'dayjs';
export const DayJsKey = Symbol() as InjectionKey<typeof dayjs>;

export type JwkKeyPair = Record<'publicKey' | 'privateKey', string>;

export type Canceler = Record<string, () => void>;

export interface StorageAdapter {
  get: (k: string) => any;
  set: (k: string, v: any) => void;
  clear: () => void;
}

// Stored keys are always strings.
// They are parsed as needed for encrypting/decrypting.
export type KeyStore = {
  [key: number]: string;
};

export type JsonResponse<T = { [key: string]: any }> = T | T[];

export type AsyncJsonResponse<T = { [key: string]: any }> = Promise<
  JsonResponse<T>
> | null;

export type NamedBlob = Blob & { name: string };

export interface Api {
  call<T = { [key: string]: any }>(path: string): AsyncJsonResponse<T>;
}

// interfaces used for API responses
export interface User {
  id: number;
  email: string;
  tier: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Profile {
  mozid: string;
  avatar: string;
  user?: User;
  userId?: number;
}

export interface Share {
  id?: number;
  containerId?: number;
  container?: Container;
  senderId: number;
  sender?: User;
}

export interface Container {
  id: number;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
  type: string;

  shareOnly?: boolean;
  shares?: Share[];
  ownerId?: number;
  owner?: User;
  wrappedKey?: string;
  parentId?: number;
  parent?: Container;
  children?: Container[];
  items?: Item[];
  size?: number;
}

export interface Folder extends Container {}

export interface Item {
  id: number;
  name: string;
  wrappedKey?: string;
  containerId?: number;
  container?: Container;
  uploadId: string;
  type?: string;

  createdAt?: Date;
  updatedAt?: Date;
  upload?: Upload;
}

export interface Upload {
  id?: string;
  size?: number;
  ownerId?: number;
  type?: string;
  createdAt?: Date;
  owner?: {
    email: string;
  };
}
