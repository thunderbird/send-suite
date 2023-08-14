import Nanobus from "nanobus";
import Keychain from "./Keychain";
import { delay, bytes, streamToArrayBuffer } from "./utils";
import { blobStream } from "./streams";
import Zip from "./zip";

export default class Receiver extends Nanobus {
  constructor(fileManager, fileInfo) {
    super("FileReceiver");
    if (fileManager.value) {
      throw new Error("Wrapped Vue ref passed instead of instance");
      return;
    }
    this.fileManager = fileManager;
    this.keychain = new Keychain(fileInfo.secretKey, fileInfo.nonce);
    if (fileInfo.requiresPassword) {
      this.keychain.setPassword(fileInfo.password, fileInfo.url);
    }
    this.fileInfo = fileInfo;
    this.reset();
    console.log(`Receiver initialized with:`);
    console.log(fileInfo);
  }

  get progressRatio() {
    return this.progress[0] / this.progress[1];
  }

  get progressIndefinite() {
    return this.state !== "downloading";
  }

  get sizes() {
    return {
      partialSize: bytes(this.progress[0]),
      totalSize: bytes(this.progress[1]),
    };
  }

  cancel() {
    if (this.downloadRequest) {
      this.downloadRequest.cancel();
    }
  }

  reset() {
    this.msg = "fileSizeProgress";
    this.state = "initialized";
    this.progress = [0, 1];
  }

  async getMetadata() {
    const meta = await this.fileManager.metadata(
      this.fileInfo.id,
      this.keychain
    );
    console.log(`in receiver.getMetadata()`);
    console.log(meta);
    this.fileInfo.name = meta.name;
    this.fileInfo.type = meta.type;
    this.fileInfo.iv = meta.iv;
    this.fileInfo.size = +meta.size;
    this.fileInfo.manifest = meta.manifest;
    this.state = "ready";
  }

  // async reportLink(reason) {
  //   await reportLink(this.fileInfo.id, this.keychain, reason);
  // }

  sendMessageToSw(msg) {
    console.log(`what is the serviceworker for?`);
    return new Promise((resolve, reject) => {
      const channel = new MessageChannel();

      channel.port1.onmessage = function (event) {
        if (event.data === undefined) {
          reject("bad response from serviceWorker");
        } else if (event.data.error !== undefined) {
          reject(event.data.error);
        } else {
          resolve(event.data);
        }
      };

      navigator.serviceWorker.controller.postMessage(msg, [channel.port2]);
    });
  }

  async downloadBlob(noSave = false) {
    this.state = "downloading";
    debugger;
    this.downloadRequest = await this.fileManager.downloadFile(
      this.fileInfo.id,
      this.keychain,
      (p) => {
        this.progress = [p, this.fileInfo.size];
        this.emit("progress");
      }
    );
    try {
      const ciphertext = await this.downloadRequest.result;
      // ciphertext is a blob
      debugger;
      this.downloadRequest = null;
      this.msg = "decryptingFile";
      this.state = "decrypting";
      this.emit("decrypting");
      let size = this.fileInfo.size;

      // I turn the blob into a stream
      // then I decrypt the stream
      let plainStream = this.keychain.decryptStream(blobStream(ciphertext));
      if (this.fileInfo.type === "send-archive") {
        const zip = new Zip(this.fileInfo.manifest, plainStream);
        plainStream = zip.stream;
        size = zip.size;
      }

      // the stream is turned into an array buffer
      const plaintext = await streamToArrayBuffer(plainStream, size);
      debugger;
      if (!noSave) {
        // For saving files
        return await saveFile({
          // plaintext: await streamToArrayBuffer(blobStream(ciphertext), size),
          plaintext,
          name: decodeURIComponent(this.fileInfo.name),
          type: this.fileInfo.type,
        });
      } else {
        // Used for messages
        const decoder = new TextDecoder();
        const plaintextString = decoder.decode(plaintext);
        return plaintextString;
      }
      //   this.msg = "downloadFinish";
      //   this.emit("complete");
      //   this.state = "complete";
    } catch (e) {
      console.log(e);
      this.downloadRequest = null;
      throw e;
    }
  }

  async downloadStream(noSave = false) {
    debugger;

    return; // 2023-07-05: confirming that I do not use this

    const start = Date.now();
    const onprogress = (p) => {
      this.progress = [p, this.fileInfo.size];
      this.emit("progress");
    };

    this.downloadRequest = {
      cancel: () => {
        this.sendMessageToSw({ request: "cancel", id: this.fileInfo.id });
      },
    };

    try {
      this.state = "downloading";

      const info = {
        request: "init",
        id: this.fileInfo.id,
        filename: this.fileInfo.name,
        type: this.fileInfo.type,
        manifest: this.fileInfo.manifest,
        key: this.fileInfo.secretKey,
        requiresPassword: this.fileInfo.requiresPassword,
        password: this.fileInfo.password,
        url: this.fileInfo.url,
        size: this.fileInfo.size,
        nonce: this.keychain.nonce,
        noSave,
      };
      // not going to use the service worker
      // await this.sendMessageToSw(info);

      onprogress(0);

      const downloadUrl = this.fileManager.getDownloadUrl(this.fileInfo.id);
      if (noSave) {
        console.log(
          `🧨 Receiver.downloadStream() - noSave: accessing api/download/:id`
        );

        // const res = await fetch(getApiUrl(`/api/download/${this.fileInfo.id}`));
        const res = await fetch(downloadUrl);
        if (res.status !== 200) {
          throw new Error(res.status);
        }
      } else {
        console.log(
          `🧨 Receiver.downloadStream() - !noSave: accessing api/download/:id`
        );

        // const downloadPath = `/api/download/${this.fileInfo.id}`;
        // let downloadUrl = getApiUrl(downloadPath);
        // if (downloadUrl === downloadPath) {
        //   downloadUrl = `${location.protocol}//${location.host}${downloadPath}`;
        // }
        const a = document.createElement("a");
        a.href = downloadUrl;
        document.body.appendChild(a);
        a.click();
      }
      return;
      let prog = 0;
      let hangs = 0;
      while (prog < this.fileInfo.size) {
        const msg = await this.sendMessageToSw({
          request: "progress",
          id: this.fileInfo.id,
        });
        if (msg.progress === prog) {
          hangs++;
        } else {
          hangs = 0;
        }
        if (hangs > 30) {
          // TODO: On Chrome we don't get a cancel
          // signal so one is indistinguishable from
          // a hang. We may be able to detect
          // which end is hung in the service worker
          // to improve on this.
          const e = new Error("hung download");
          e.duration = Date.now() - start;
          e.size = this.fileInfo.size;
          e.progress = prog;
          throw e;
        }
        prog = msg.progress;
        onprogress(prog);
        await delay(1000);
      }

      this.downloadRequest = null;
      this.msg = "downloadFinish";
      this.emit("complete");
      this.state = "complete";
    } catch (e) {
      this.downloadRequest = null;
      if (e === "cancelled" || e.message === "400") {
        throw new Error(0);
      }
      throw e;
    }
  }

  download(options) {
    // if (options.stream) {
    //   return this.downloadStream(options.noSave);
    // }
    return this.downloadBlob(options.noSave);
  }
}

async function saveFile(file) {
  console.log(`In saveFile`);
  return new Promise(function (resolve, reject) {
    const dataView = new DataView(file.plaintext);
    const blob = new Blob([dataView], { type: file.type });

    if (navigator.msSaveBlob) {
      navigator.msSaveBlob(blob, file.name);
      return resolve();
    } else {
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(downloadUrl);
      setTimeout(resolve, 100);
    }
  });
}
