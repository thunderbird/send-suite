import { ECE_RECORD_SIZE } from './ece';
import {
  delay,
  streamToArrayBuffer,
  asyncInitWebSocket,
  listenForResponse,
} from './utils';
import { blobStream } from './streams';
import { encryptStream, decryptStream } from './ece';

async function _upload(blob, key, canceller = {}) {
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
      // console.log(`got xhr.response`);
      // console.log(xhr.response);
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

async function _saveFile(file) {
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

export async function download(
  id,
  size,
  key,
  isMessage = true,
  filename = 'dummy.file',
  type = 'text/plain'
) {
  const downloadedBlob = await _doDownload(id);

  let plaintext;
  if (key) {
    let plainStream = decryptStream(blobStream(downloadedBlob), key);

    plaintext = await streamToArrayBuffer(plainStream, size);
  } else {
    console.log(`no decryption, just convert blob to array buffer`);
    plaintext = await downloadedBlob.arrayBuffer();
  }
  if (isMessage) {
    const decoder = new TextDecoder();
    const plaintextString = decoder.decode(plaintext);
    return plaintextString;
  } else {
    return await _saveFile({
      plaintext,
      name: decodeURIComponent(filename),
      type, // mime type of the upload
    });
  }
}

export async function sendBlob(blob, aesKey) {
  console.log(`want to send blob of size ${blob.size}`);
  console.log(blob);

  const stream = blobStream(blob);
  const result = await _upload(stream, aesKey);
  console.log(result);
  return result.id;
}
