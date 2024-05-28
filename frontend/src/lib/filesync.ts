import {
  delay,
  streamToArrayBuffer,
  asyncInitWebSocket,
  listenForResponse,
} from '@/lib/utils';
import { blobStream } from '@/lib/streams';
import { ECE_RECORD_SIZE, encryptStream, decryptStream } from '@/lib/ece';
import { JsonResponse } from '@/lib/api';

export type NamedBlob = Blob & { name: string };

export type Canceler = Record<string, () => void>;

async function _upload(
  stream: ReadableStream,
  key: CryptoKey,
  canceler: Canceler = {}
): Promise<JsonResponse> {
  let host = import.meta.env.VITE_SEND_SERVER_URL;
  if (host) {
    host = host.split('//')[1];
  } else {
    throw new Error('no server url is set');
  }
  const endpoint = `wss://${host}/api/ws`;
  const ws = await asyncInitWebSocket(endpoint);

  try {
    // Send a preamble
    const fileMeta = {
      name: 'filename',
    };

    // Set up handler for the response to the preamble.
    // However, we do not need to do anything with that response.
    // Therefore, we omit the `await`
    listenForResponse(ws, canceler);
    ws.send(JSON.stringify(fileMeta));

    let size = 0;
    // Intentionally omitting `await` so that the encrypt & upload
    // finishes before we read the response from the server.
    const completedResponse = listenForResponse(ws, canceler);

    if (key) {
      stream = encryptStream(stream, key);
    }

    const reader = stream.getReader();
    let state = await reader.read();

    while (!state.done) {
      if (canceler.cancelled) {
        ws.close();
      }
      if (ws.readyState !== WebSocket.OPEN) {
        break;
      }
      const buf = state.value;
      ws.send(buf);

      size += buf.length;
      state = await reader.read();
      while (
        ws.bufferedAmount > ECE_RECORD_SIZE * 2 &&
        ws.readyState === WebSocket.OPEN &&
        !canceler.cancelled
      ) {
        await delay();
      }
    }
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(new Uint8Array([0])); //EOF
    }

    console.log(`👍👍👍`);
    console.log(await completedResponse);
    console.log(`wrote ${size} bytes`);
    return await completedResponse;
  } catch (e) {
    throw e;
  } finally {
    if (
      ws.readyState !== WebSocket.CLOSED &&
      ws.readyState !== WebSocket.CLOSING
    ) {
      ws.close();
    }
  }
}

async function _download(id: string, canceler: Canceler = {}): Promise<Blob> {
  const endpoint = `${import.meta.env.VITE_SEND_SERVER_URL}/api/download`;
  const xhr = new XMLHttpRequest();
  canceler.oncancel = function () {
    xhr.abort();
  };
  return new Promise((resolve, reject) => {
    xhr.addEventListener('loadend', function () {
      canceler.oncancel = function () {};

      if (xhr.status !== 200) {
        return reject(new Error(`${xhr.status}`));
      }
      const blob = new Blob([xhr.response]);
      resolve(blob);
    });

    xhr.open('get', `${endpoint}/${id}`);
    xhr.responseType = 'blob';
    xhr.send();
  });
}

async function _saveFile(file: Record<string, any>): Promise<void> {
  return new Promise(function (resolve) {
    const dataView = new DataView(file.plaintext);
    const blob = new Blob([dataView], { type: file.type });

    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
      resolve();
    }, 0);
  });
}

export async function getBlob(
  id: string,
  size: number,
  key: CryptoKey,
  isMessage = true,
  filename = 'dummy.file',
  type = 'text/plain'
): Promise<string | void> {
  const downloadedBlob = await _download(id);

  let plaintext: ArrayBufferLike | string;
  if (key) {
    let plainStream = decryptStream(blobStream(downloadedBlob), key);
    plaintext = await streamToArrayBuffer(plainStream, size);
  } else {
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

export async function sendBlob(blob: Blob, aesKey: CryptoKey): Promise<string> {
  const stream = blobStream(blob);
  const result = await _upload(stream, aesKey);
  // Using a type guard since a JsonResponse can be a single object or an array
  if (Array.isArray(result)) {
    return result[0].id;
  } else {
    return result.id;
  }
}
