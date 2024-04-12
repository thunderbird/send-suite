import config from '../config';
import FSStorage from './filesystem';
import S3Storage from './s3';
import { Config } from '../types/custom';
import logger from '../logger';

class FileStore {
  private storage: FSStorage | S3Storage;
  private kv: Map<string, any>;

  constructor(config: Config, StorageClass) {
    this.storage = new StorageClass(config);
    this.kv = new Map();
  }

  async get(id: string) {
    return this.storage.getStream(id);
  }

  async length(id: string) {
    return this.storage.length(id);
  }

  async set(id: string, file) {
    const filePath = id;
    await this.storage.set(filePath, file);
  }
}

let filestore;
if (process.env.STORAGE_BACKEND === 's3') {
  filestore = new FileStore(null, S3Storage);
  logger.info(`Initializing S3 storage ☁️`);
} else if (process.env.STORAGE_BACKEND === 'fs') {
  filestore = new FileStore(config, FSStorage);
  logger.info(`Initializing local filesystem storage 💾`);
}

export default filestore;
