import Keychain from "./Keychain";
import { arrayToB64 } from "./utils";
import { del, fileInfo, setParams } from "./api";

/*
move the imported stuff from api to fileManager
then update the calls so it uses this.filemanager.whatever()


*/

export default class OwnedFile {
  constructor(fileManager, obj) {
    if (fileManager.value) {
      throw new Error("Wrapped Vue ref passed instead of instance");
    }
    if (!obj.manifest) {
      throw new Error("invalid file object");
    }
    this.fileManager = fileManager;
    this.id = obj.id;
    this.url = obj.url;
    this.name = obj.name;
    this.size = obj.size;
    this.manifest = obj.manifest;
    this.time = obj.time;
    this.speed = obj.speed;
    this.createdAt = obj.createdAt;
    this.expiresAt = obj.expiresAt;
    this.ownerToken = obj.ownerToken;
    this.dlimit = obj.dlimit || 1;
    this.dtotal = obj.dtotal || 0;
    this.keychain = new Keychain(obj.secretKey, obj.nonce);
    this._hasPassword = !!obj.hasPassword;
    this.timeLimit = obj.timeLimit;
  }

  get hasPassword() {
    return !!this._hasPassword;
  }

  get expired() {
    return this.dlimit === this.dtotal || Date.now() > this.expiresAt;
  }

  async setPassword(password) {
    try {
      this.password = password;
      this._hasPassword = true;
      this.keychain.setPassword(password, this.url);
      const result = await this.fileManager.setPassword(
        this.id,
        this.ownerToken,
        this.keychain
      );
      return result;
    } catch (e) {
      this.password = null;
      this._hasPassword = false;
      throw e;
    }
  }

  del() {
    return del(this.id, this.ownerToken);
  }

  changeLimit(dlimit, user = {}) {
    if (this.dlimit !== dlimit) {
      this.dlimit = dlimit;
      return setParams(this.id, this.ownerToken, user.bearerToken, { dlimit });
    }
    return Promise.resolve(true);
  }

  async updateDownloadCount() {
    const oldTotal = this.dtotal;
    const oldLimit = this.dlimit;
    try {
      console.log(`we are trying to updateDownloadCount`);
      const result = await fileInfo(this.id, this.ownerToken);
      this.dtotal = result.dtotal;
      this.dlimit = result.dlimit;
    } catch (e) {
      if (e.message === "404") {
        console.log(`yeah, that's a 404 for ${this.id}`);
        this.dtotal = this.dlimit;
      }
      // ignore other errors
    }
    return oldTotal !== this.dtotal || oldLimit !== this.dlimit;
  }

  toJSON() {
    return {
      id: this.id,
      url: this.url,
      name: this.name,
      size: this.size,
      manifest: this.manifest,
      time: this.time,
      speed: this.speed,
      createdAt: this.createdAt,
      expiresAt: this.expiresAt,
      secretKey: arrayToB64(this.keychain.rawSecret),
      ownerToken: this.ownerToken,
      dlimit: this.dlimit,
      dtotal: this.dtotal,
      hasPassword: this.hasPassword,
      timeLimit: this.timeLimit,
    };
  }
}
