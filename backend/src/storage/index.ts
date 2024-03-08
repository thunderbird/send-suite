import config from '../config';

import FSStorage from './filesystem';
import { Config } from '../types/custom';

class FileStore {
  private storage: FSStorage;
  private kv: Map<string, any>;

  constructor(config: Config) {
    this.storage = new FSStorage(config);
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

export default new FileStore(config);
