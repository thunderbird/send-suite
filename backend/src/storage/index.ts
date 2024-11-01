import { S3Client } from '@aws-sdk/client-s3';
import {
  Storage,
  StorageAdapterConfig,
  StorageType,
} from '@tweedegolf/storage-abstraction';
import { FileStreamParams } from '@tweedegolf/storage-abstraction/dist/types/add_file_params';
import { ReadStream } from 'fs';
import { Readable } from 'stream';
import {
  getClientFromAWSSDK,
  getSignedUrl,
  getSignedUrlforDownload,
} from './s3b2';

const TWELVE_HOURS = 12 * 60 * 60 * 1000;

type Direct = {
  directClient?: S3Client;
};

const B2_CONFIG = {
  type: StorageType.B2,
  bucketName: process.env.B2_BUCKET_NAME,
  applicationKeyId: process.env.B2_APPLICATION_KEY_ID,
  applicationKey: process.env.B2_APPLICATION_KEY,
};

/**
 * Storage adapter for various storage backends including filesystem and Backblaze.
 */
export class FileStore {
  /**
   * A storage client instance.
   */
  private client: Storage & Direct;

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
          config = B2_CONFIG;
          console.log(`Initializing Backblaze storage ☁️`);
          break;
        case 's3':
          config = {
            type: StorageType.S3,
            region: process.env.S3_REGION || 'auto',
            bucketName: process.env.S3_BUCKET_NAME,
            endpoint: process.env.S3_ENDPOINT,
            accessKeyId: process.env.S3_ACCESS_KEY,
            secretAccessKey: process.env.S3_SECRET_KEY,
          };
          console.log(`Initializing S3 storage ☁️`);
          break;
        case 'fs':
        // intentional fall-through;
        // fs is default
        // eslint-disable-next-line no-fallthrough
        default:
          config = {
            type: StorageType.LOCAL,
            directory: process.env.FS_LOCAL_DIR,
            bucketName: process.env.FS_LOCAL_BUCKET,
          };
          console.log(`Initializing local filesystem storage 💾`);
          break;
      }
    }

    /* Backblaze's token only lasts 24 hours, so we renew it before that */
    if (process.env.STORAGE_BACKEND === 'b2') {
      setInterval(() => {
        console.log('Renewing client');
        this.client = new Storage(B2_CONFIG);
        getClientFromAWSSDK().then(
          (client) => (this.client.directClient = client)
        );
      }, TWELVE_HOURS);
    }
    // We have to instantiate an s3 client using backblaze for signed uploads/downloads
    getClientFromAWSSDK().then((client) => (this.client.directClient = client));
    this.client = new Storage(config);
  }

  async getUploadBucketUrl(key: string, contentType: string) {
    return await getSignedUrl(this.client.directClient, key, contentType);
  }

  async getDownloadBucketUrl(id: string) {
    return await getSignedUrlforDownload(this.client.directClient, id);
  }

  /**
   * Add a new file to storage.
   * @param id: string - The unique identifier for the file.
   * @param stream: ReadStream - A readable stream of the file's contents.
   * @returns True if the file was added without error; otherwise false.
   */
  async set(id: string, stream: ReadStream, size?: number): Promise<boolean> {
    const params: FileStreamParams = {
      stream,
      targetPath: id,
    };

    if (size) {
      params.options = {
        ContentLength: size,
      };
    }

    const result = await this.client.addFileFromStream(params);
    if (result.error) {
      console.error(`Error writing to storage: ${result.error}`);
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
    // eslint-disable-next-line no-async-promise-executor
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
