import { ECE_RECORD_SIZE } from './ece';
import { delay, asyncInitWebSocket, listenForResponse } from './utils';
import { encryptStream } from './ece';
import { Canceler, JsonResponse } from '@/types';
export async function _download(
  id: string,
  canceler: Canceler = {}
): Promise<Blob> {
  const endpoint = `${import.meta.env.VITE_SEND_SERVER_URL}/api/download`;
  const xhr = new XMLHttpRequest();
  canceler.oncancel = function () {
    xhr.abort();
  };

  return new Promise((resolve, reject) => {
    xhr.addEventListener('loadend', async function () {
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

export async function _upload(
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
