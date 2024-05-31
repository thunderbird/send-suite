import fs from 'fs';
import { Readable } from 'stream';
import logger from '../logger';
import {
  Storage,
  StorageType,
  StorageAdapterConfig,
} from '@tweedegolf/storage-abstraction';

export class FileStore {
  private client: Storage;

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

  async set(id: string, stream: fs.ReadStream): Promise<boolean> {
    const result = await this.client.addFileFromStream({
      stream,
      targetPath: id,
    });
    if (result.error) {
      logger.error(`Error writing to storage: ${result.error}`);
    }
    return !result.error;
  }

  async length(id: string): Promise<number> {
    const result = await this.client.sizeOf(id);
    return result.value;
  }

  async get(id: string): Promise<Readable> {
    const result = await this.client.getFileAsStream(id);
    return result.value;
  }

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
