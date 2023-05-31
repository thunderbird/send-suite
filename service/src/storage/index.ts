import config from "../config";
import Metadata from "../lib/metadata";
import FSStorage from "./filesystem";
import { Config } from "./types";

function getPrefix(seconds) {
  return Math.max(Math.floor(seconds / 86400), 1);
}

class FileStore {
  private storage: FSStorage;
  private kv: Map<string, any>;

  constructor(config: Config) {
    this.storage = new FSStorage(config);
    this.kv = new Map();
  }

  async getPrefixedId(id) {
    const hash = await this.kv.get(id);
    const prefix = await hash.get("prefix");
    return `${prefix}-${id}`;
  }

  async get(id: string) {
    const filePath = await this.getPrefixedId(id);
    return this.storage.getStream(filePath);
  }

  async length(id: string) {
    const filePath = await this.getPrefixedId(id);
    return this.storage.length(filePath);
  }

  async set(id: string, file, meta, expireSeconds) {
    const prefix = getPrefix(expireSeconds);
    const filePath = `${prefix}-${id}`;
    console.log("in storage/index.ts, about to pass off to (fs.ts).set()");
    await this.storage.set(filePath, file);
    let hash = this.kv.get(id);
    if (!hash) {
      hash = new Map();
    }

    hash.set("prefix", prefix);
    if (meta) {
      console.log(`In storage.set(), adding metadata for ${id} to this.kv`);
      for (let k of Object.keys(meta)) {
        hash.set(k, meta[k]);
        console.log(`   setting ${k} to ${meta[k]}`);
      }
    }
    console.log(`🧨🧨🧨 final hash in this.kv:`);
    console.log(hash);
    this.kv.set(id, hash);
    /*
    In the original implementation, we were setting additional info
    in Redis for this file id:
    - prefix
    - meta data

    And we were setting the record to expire after `expireSeconds`
    */
  }

  setField(id: string, key: string, value: any) {
    // this.redis.hset(id, key, value);
    console.log(`In storage.set(), doing setField() for ${id}`);
    let hash = this.kv.get(id);
    if (!hash) {
      hash = new Map();
    }
    hash.set(key, value);
    console.log(`🧨🧨🧨 final hash in this.kv:`);
    console.log(hash);
    this.kv.set(id, hash);
  }

  async metadata(id: string): Promise<Metadata> {
    // const result = await this.redis.hgetallAsync(id);
    console.log(`🥡 trying to get ${id} from the kv store`);
    const result = await this.kv.get(id);
    console.log(result);
    return result && new Metadata(Object.fromEntries(result));
  }
}

export default new FileStore(config);
