import dayjs from 'dayjs';
import type { InjectionKey } from 'vue';
export const DayJsKey = Symbol() as InjectionKey<typeof dayjs>;

export enum UserTier {
  FREE = 1,
  EPHEMERAL,
  PRO,
}

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

/**
 * Api interface for object that makes HTTP requests
 *
 * @interface
 */
export interface Api {
  /**
   * Makes a network call to the specified path.
   *
   * @template T - The expected shape of the response object. If not provided, defaults to any object shape.
   *
   * @param {string} path - The path of the API endpoint. (Should not include `/api/`.)
   * @returns {AsyncJsonResponse<T>} Returns a Promise that resolves to the response data (or null).
   *
   */
  call<T = { [key: string]: any }>(path: string): AsyncJsonResponse<T>;
}

// interfaces used for API responses
export interface UserType {
  id: number;
  email: string;
  tier?: UserTier;
  createdAt?: Date;
  updatedAt?: Date;
  uniqueHash?: string;
}

export interface Profile {
  mozid: string;
  avatar: string;
  user?: UserType;
  userId?: number;
}

export interface Share {
  id?: number;
  containerId?: number;
  container?: Container;
  senderId: number;
  sender?: UserType;
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
  owner?: UserType;
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
  uploadId: string;

  wrappedKey?: string;
  containerId?: number;
  container?: Container;
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

export interface Backup {
  backupContainerKeys: string;
  backupKeypair: string;
  backupKeystring: string;
  backupSalt: string;
}
