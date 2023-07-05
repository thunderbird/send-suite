import Nanobus from "nanobus";
import OwnedFile from "./OwnedFile";
import Keychain from "./Keychain";
import { arrayToB64, bytes } from "./utils";
import { encryptedSize } from "./utils";

export default class Sender extends Nanobus {
  constructor(fileManager) {
    super("FileSender");
    if (fileManager.value) {
      throw new Error("Wrapped Vue ref passed instead of instance");
      return;
    }
    this.keychain = new Keychain();
    this.reset();
    this.fileManager = fileManager;
  }

  get progressRatio() {
    return this.progress[0] / this.progress[1];
  }

  get progressIndefinite() {
    return (
      ["fileSizeProgress", "notifyUploadEncryptDone"].indexOf(this.msg) === -1
    );
  }

  get sizes() {
    return {
      partialSize: bytes(this.progress[0]),
      totalSize: bytes(this.progress[1]),
    };
  }

  reset() {
    this.uploadRequest = null;
    this.msg = "importingFile";
    this.progress = [0, 1];
    this.cancelled = false;
  }

  cancel() {
    this.cancelled = true;
    if (this.uploadRequest) {
      this.uploadRequest.cancel();
    }
  }

  /*
  Expects an Archive, which it passes to Keychain for encrypting.
  Returns an OwnedFile (whose actual "ownership" isn't tied to anything)

  The actual work of uploading is via `uploadWs`
  */
  async upload(payload, bearerToken, password) {
    if (this.cancelled) {
      throw new Error(0);
    }
    this.msg = "encryptingFile";
    this.emit("encrypting");
    const totalSize = encryptedSize(payload.size);
    const encStream = await this.keychain.encryptStream(payload.stream);
    const metadata = await this.keychain.encryptMetadata(payload);
    const authKeyB64 = await this.keychain.authKeyB64();

    console.log(`about to call uploadWs()`);
    this.uploadRequest = this.fileManager.uploadWs(
      encStream,
      metadata,
      authKeyB64,
      payload.timeLimit,
      payload.dlimit,
      bearerToken,
      (p) => {
        this.progress = [p, totalSize];
        this.emit("progress");
      }
    );

    if (this.cancelled) {
      throw new Error(0);
    }

    this.msg = "fileSizeProgress";
    this.emit("progress"); // HACK to kick MS Edge
    try {
      const result = this.uploadRequest.result;
      this.msg = "notifyUploadEncryptDone";
      this.uploadRequest = null;
      this.progress = [1, 1];
      const secretKey = arrayToB64(this.keychain.rawSecret);

      const ownedFile = new OwnedFile({
        id: result.id,
        url: `${result.url}#${secretKey}`, // HERE is where the URL is stamped onto the file
        name: payload.name,
        size: payload.size,
        manifest: payload.manifest,
        time: result.duration,
        speed: payload.size / (result.duration / 1000),
        createdAt: Date.now(),
        expiresAt: Date.now() + payload.timeLimit * 1000,
        secretKey: secretKey,
        nonce: this.keychain.nonce,
        ownerToken: result.ownerToken,
        dlimit: payload.dlimit,
        timeLimit: payload.timeLimit,
      });
      console.log(`
      ⁉️⁉️⁉️ did you send a password? ${password}
      `);
      if (password) {
        console.log(`💣💣💣 setting password to "password"`);
        await ownedFile.setPassword(password);
        console.log(`password set?`);
      }

      return ownedFile;
    } catch (e) {
      this.msg = "errorPageHeader";
      this.uploadRequest = null;
      throw e;
    }
  }
}
