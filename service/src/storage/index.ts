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
  /*
  getPrefixedId() is only used when querying for the file or its length.
  Those are the `get()` and `length()` methods.

  Originally, the prefix was likely used (or intended to be used for)
  some kind of sharding of the physical storage (and/or for distributing
  the load among several Redis servers.)

  For the 2023 version, we may do away with this so that we can
  store the metadata with each Item in the database.

  Of course, that means storing the `nonce` with the location of
  each item, so that's probably a security concern.

  */
  async get(id: string) {
    return this.storage.getStream(id);
  }

  async length(id: string) {
    return this.storage.length(id);
  }

  // Note: only called from wsHandler.handleUpload()
  async set(id: string, file, meta, expireSeconds) {
    const filePath = id;
    console.log("in storage/index.ts, about to pass off to (fs.ts).set()");
    await this.storage.set(filePath, file);
    let hash = this.kv.get(id);
    if (!hash) {
      hash = new Map();
    }

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

  // Note: this is only called from auth.hmac()
  setField(id: string, key: string, value: any) {
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

  // The metadata is the hash we were storing under the file's ID.
  // We use this in:
  // - auth.owner (currently unused)
  // And it's originally generated in `wsHandler.handleUpload()`
  async metadata(id: string): Promise<Metadata> {
    // const result = await this.redis.hgetallAsync(id);
    console.log(`🥡 trying to get ${id} from the kv store`);
    const hash = await this.kv.get(id);
    console.log(hash);
    return hash && new Metadata(Object.fromEntries(hash));
  }
}

export default new FileStore(config);
