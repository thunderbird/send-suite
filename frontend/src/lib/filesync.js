import { ECE_RECORD_SIZE } from './ece';
import { delay, streamToArrayBuffer } from './utils';
import { blobStream } from './streams';
import { encryptStream, decryptStream } from './ece';

class ConnectionError extends Error {
  constructor(cancelled, duration, size) {
    super(cancelled ? '0' : 'connection closed');
    this.cancelled = cancelled;
    this.duration = duration;
    this.size = size;
  }
}

function asyncInitWebSocket(server) {
  console.log(`opening websocket connection`);
  return new Promise((resolve, reject) => {
    try {
      const ws = new WebSocket(server);
      ws.addEventListener('open', () => resolve(ws), { once: true });
    } catch (e) {
      reject(new ConnectionError(false));
    }
  });
}

function listenForResponse(ws, canceller) {
  return new Promise((resolve, reject) => {
    function handleClose(event) {
      // a 'close' event before a 'message' event means the request failed
      ws.removeEventListener('message', handleMessage);
      reject(new ConnectionError(canceller.cancelled));
    }
    function handleMessage(msg) {
      ws.removeEventListener('close', handleClose);
      try {
        const response = JSON.parse(msg.data);
        if (response.error) {
          throw new Error(response.error);
        } else {
          resolve(response);
        }
      } catch (e) {
        reject(e);
      }
    }
    ws.addEventListener('message', handleMessage, { once: true });
    ws.addEventListener('close', handleClose, { once: true });
  });
}

export async function upload(blob, key, canceller = {}) {
  const endpoint = 'wss://localhost:8088/api/ws';
  const ws = await asyncInitWebSocket(endpoint);

  try {
    // Send a preamble
    const fileMeta = {
      name: 'does this even matter?',
    };

    const uploadInfoResponse = listenForResponse(ws, canceller);
    ws.send(JSON.stringify(fileMeta));
    const uploadInfo = await uploadInfoResponse;
    console.log(
      `👍👍👍 we did the uploadInfo, which was ${
        JSON.stringify(fileMeta).length
      } chars long`
    );
    console.log(uploadInfo);
    console.log(`file id ${uploadInfo.id}`);

    let size = 0;
    const completedResponse = listenForResponse(ws, canceller);

    let stream = blob;
    if (key) {
      // TODO: encrypt the stream
      // we want to make this optional for simple downloads
      stream = encryptStream(stream, key);
    }

    const reader = stream.getReader();
    let state = await reader.read();

    while (!state.done) {
      if (canceller.cancelled) {
        ws.close();
      }
      if (ws.readyState !== WebSocket.OPEN) {
        break;
      }
      const buf = state.value;
      ws.send(buf);
      // onprogress(size);
      size += buf.length;
      state = await reader.read();
      while (
        ws.bufferedAmount > ECE_RECORD_SIZE * 2 &&
        ws.readyState === WebSocket.OPEN &&
        !canceller.cancelled
      ) {
        await delay();
      }
    }
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(new Uint8Array([0])); //EOF
    }

    await completedResponse;
    console.log(`👍👍👍`);
    console.log(completedResponse);
    console.log(`wrote ${size} bytes`);
    return completedResponse;
  } catch (e) {
    throw e;
  } finally {
    if (![WebSocket.CLOSED, WebSocket.CLOSING].includes(ws.readyState)) {
      ws.close();
    }
  }
}

// export async function download(id, canceller = {}, doDecrypt = true) {
//   // const endpoint = 'wss://localhost:8088/api/ws';
//   // const ws = await asyncInitWebSocket(endpoint);

//   // try {
//   //   const fileMeta = {
//   //     type: 'download',
//   //     id,
//   //   };

//   //   const downloadInfoResponse = listenForResponse(ws, canceller);
//   //   ws.send(JSON.stringify(fileMeta));
//   //   const downloadInfo = await downloadInfoResponse;
//   //   console.log(downloadInfo);

//   //   const completedResponse = listenForResponse(ws, canceller);

//   //   if (doDecrypt) {
//   //     // TODO: decrypt the stream
//   //   }

//   //   ws.read()

//   // } catch (e) {
//   //   throw e;
//   // } finally {
//   //   if (![WebSocket.CLOSED, WebSocket.CLOSING].includes(ws.readyState)) {
//   //     ws.close();
//   //   }
//   // }
// }

// async download(id, keychain, onprogress, canceller) {
async function _doDownload(id, canceller = {}) {
  const endpoint = 'https://localhost:8088/api/download';
  const xhr = new XMLHttpRequest();
  canceller.oncancel = function () {
    xhr.abort();
  };
  return new Promise((resolve, reject) => {
    xhr.addEventListener('loadend', function () {
      canceller.oncancel = function () {};

      if (xhr.status !== 200) {
        return reject(new Error(xhr.status));
      }
      console.log(`got xhr.response`);
      console.log(xhr.response);
      const blob = new Blob([xhr.response]);
      resolve(blob);
    });

    xhr.addEventListener('progress', function (event) {
      if (event.target.status === 200) {
        // onprogress(event.loaded);
      }
    });

    xhr.open('get', `${endpoint}/${id}`);
    xhr.responseType = 'blob';
    xhr.send();
    // onprogress(0);
  });
}

async function saveFile(file) {
  return new Promise(function (resolve, reject) {
    const dataView = new DataView(file.plaintext);
    const blob = new Blob([dataView], { type: file.type });

    if (navigator.msSaveBlob) {
      navigator.msSaveBlob(blob, file.name);
      return resolve();
    } else {
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(downloadUrl);
      setTimeout(resolve, 100);
    }
  });
}

export async function download(id, size, key) {
  const downloadedBlob = await _doDownload(id);
  // This is *not* where we figure out the type
  // I can't just `const { type } = downloadedBlob`
  // unless I want to add a mimetype to the blob
  // I don't think this is the right place for that.

  let plaintext;
  // here's where we would decrypt:
  if (key) {
    console.log(`decrypting with key`);
    let plainStream = decryptStream(blobStream(downloadedBlob), key);
    plaintext = await streamToArrayBuffer(plainStream, size);
  } else {
    console.log(`no decryption, just convert blob to array buffer`);
    plaintext = await downloadedBlob.arrayBuffer();
  }
  // const plaintext = await downloadedBlob.arrayBuffer();

  // but how did I figure out the type before in the old front-end?
  // ... it came from the metadata I stored in the `Uploads` table
  //
  // And do something different with the plaintext based on type
  // if (type === 'MESSAGE') {}
  const decoder = new TextDecoder();
  const plaintextString = decoder.decode(plaintext);
  return plaintextString;

  // if (type === 'FILE') {}
  /*
        return await saveFile({
          // plaintext: await streamToArrayBuffer(blobStream(ciphertext), size),
          plaintext,
          name: decodeURIComponent(this.fileInfo.name),
          type: this.fileInfo.type,
        });
  */
}
