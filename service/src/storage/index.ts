import config from "../config";
// import Metadata from "../lib/metadata";
import FSStorage from "./filesystem";
import { Config } from "./types";
import { createMetadata, getMetadata, updateMetadata } from "../models";

// function getPrefix(seconds) {
//   return Math.max(Math.floor(seconds / 86400), 1);
// }

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

  For the 2023 version, we're storing upload metadata in Postgres.
  */
  async get(id: string) {
    return this.storage.getStream(id);
  }

  async length(id: string) {
    return this.storage.length(id);
  }

  // Note: only called from wsHandler.handleUpload()
  // Therefore, we're creating
  async set(id: string, file, meta, expireSeconds) {
    const filePath = id;
    console.log("in storage/index.ts, about to pass off to fs.set()");
    await this.storage.set(filePath, file);
    const { owner, metadata, dlimit, auth, nonce } = meta;

    return createMetadata(id, owner, metadata, dlimit, auth, nonce);
    /*
    In the original implementation, we were setting additional info:
    - dl
    - pwd
    - expireSeconds
    */
  }

  // Note: this is only called from auth.hmac()
  // and it's only ever the `nonce`
  // However, we'll keep it flexible, in case we need to update
  // other fields.
  async setField(id: string, key: string, value: any) {
    console.log(`In storage.set(), doing setField() for ${id}`);
    console.log(`   setting ${key} to ${value}`);
    return updateMetadata(id, {
      [key]: value,
    });
  }

  // The metadata is the hash we were storing under the file's ID.
  // We use this in:
  // - auth.owner (currently unused)
  // And it's originally generated in `wsHandler.handleUpload()`
  async metadata(id: string) {
    // const result = await this.redis.hgetallAsync(id);
    console.log(`🥡 trying to get metadata for ${id} from the db`);
    // const hash = await this.kv.get(id);
    return await getMetadata(id);
  }
}

export default new FileStore(config);
