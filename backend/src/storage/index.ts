import { ReadStream } from 'fs';
import { Readable } from 'stream';
import logger from '../logger';
import {
  Storage,
  StorageType,
  StorageAdapterConfig,
} from '@tweedegolf/storage-abstraction';

/**
 * Storage adapter for various storage backends including filesystem and Backblaze.
 */
export class FileStore {
  /**
   * A storage client instance.
   */
  private client: Storage;

  /**
   * Initialize the adapter.
   * @param config: StorageAdapterConfig - Optional configuration information. If omitted, we fall back to the filesystem.
   *
   * When configured for Backblaze, uses the native API instead of the S3-compatible API
   * (As of 2024-06-01, there were errors when accessing Backblaze via its S3 API.)
   */
  constructor(config?: StorageAdapterConfig) {
    if (!config) {
      switch (process.env.STORAGE_BACKEND) {
        case 'b2':
          config = {
            type: StorageType.B2,
            bucketName: process.env.B2_BUCKET_NAME,
            applicationKeyId: process.env.B2_APPLICATION_KEY_ID,
            applicationKey: process.env.B2_APPLICATION_KEY,
          };
          logger.info(`Initializing Backblaze storage ☁️`);
          break;
        case 'fs':
        // intentional fall-through;
        // fs is default
        default:
          config = {
            type: StorageType.LOCAL,
            directory: process.env.FS_LOCAL_DIR,
            bucketName: process.env.FS_LOCAL_BUCKET,
          };
          logger.info(`Initializing local filesystem storage 💾`);
          break;
      }
    }
    this.client = new Storage(config);
  }

  /**
   * Add a new file to storage.
   * @param id: string - The unique identifier for the file.
   * @param stream: ReadStream - A readable stream of the file's contents.
   * @returns True if the file was added without error; otherwise false.
   */
  async set(id: string, stream: ReadStream): Promise<boolean> {
    const result = await this.client.addFileFromStream({
      stream,
      targetPath: id,
    });
    if (result.error) {
      logger.error(`Error writing to storage: ${result.error}`);
    }
    return !result.error;
  }

  /**
   * Returns the size of the file in bytes.
   * @param id: string - The unique identifier for the file.
   * @returns The size of the file in bytes.
   *
   * Note that an encrypted file's size is greater than or equal to the unencrypted file's size.
   */
  async length(id: string): Promise<number> {
    const result = await this.client.sizeOf(id);
    return result.value;
  }

  /**
   * Returns a readable stream for a file in storage.
   * @param id: string - The unique identifier for the file.
   * @returns A readable stream for the file.
   */
  async get(id: string): Promise<Readable> {
    const result = await this.client.getFileAsStream(id);
    return result.value;
  }

  /**
   * Removes a file from storage.
   * @param id: string - The unique identifier for the file.
   * @returns True if the file was successfully removed; otherwise false.
   *
   * No error is thrown if the file is not found.
   */
  del(id: string): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      const result = await this.client.removeFile(id);
      if (result.value === 'ok') {
        resolve(true);
      } else {
        reject(result.error);
      }
    });
  }
}

// export a FileStore based on .env vars
export default new FileStore();
