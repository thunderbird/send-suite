import { FolderStore } from '@/apps/send/stores/folder-store';
import { ProgressTracker } from '@/apps/send/stores/status-store';
import init from '@/lib/init';
import { UserStore } from '@/stores/user-store';
import { Canceler, JsonResponse } from '@/types';
import { RouteLocationNormalized } from 'vue-router';
import {
  ECE_RECORD_SIZE,
  encryptStream,
  HEADER_SIZE,
  OVERHEAD_SIZE,
} from './ece';
import { Keychain } from './keychain';
import { asyncInitWebSocket, delay, listenForResponse } from './utils';

type DownloadOptions = {
  url?: string;
  id?: string;
  progressTracker: ProgressTracker;
};

export async function _download({
  url,
  progressTracker,
  id,
}: DownloadOptions): Promise<Blob> {
  const endpoint = `${import.meta.env.VITE_SEND_SERVER_URL}/api/download`;
  const xhr = new XMLHttpRequest();
  const { setProgress } = progressTracker;
  xhr.onprogress = (event) => {
    if (event.lengthComputable) {
      const downloadProgress = event.loaded;
      setProgress(downloadProgress);
    }
  };

  return new Promise((resolve, reject) => {
    xhr.addEventListener('loadend', async function () {
      if (xhr.status !== 200) {
        return reject(new Error(`${xhr.status}`));
      }
      const blob = new Blob([xhr.response]);
      resolve(blob);
    });
    // The id is used when the backend is using fs
    // Url is used when the backend is using s3
    xhr.open('get', id ? `${endpoint}/${id}` : url);
    xhr.responseType = 'blob';
    xhr.send();
  });
}

type Options = {
  canceler?: Canceler;
  progressTracker: ProgressTracker;
};

export async function _upload(
  stream: ReadableStream,
  key: CryptoKey,
  encryptedSize: number = -1,
  { canceler = {} as Canceler, progressTracker }: Options
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
      size: encryptedSize,
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
      console.log('Uploaded', size, 'bytes', '- timestamp:', Date.now());
      progressTracker.setProgress(size);
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
    console.error(e);
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

export async function encrypt(
  stream: ReadableStream,
  key: CryptoKey,
  progressTracker: ProgressTracker
): Promise<Uint8Array> {
  try {
    let size = 0;
    const chunks: Uint8Array[] = [];
    // Intentionally omitting `await` so that the encrypt & upload
    // finishes before we read the response from the server.

    if (key) {
      stream = encryptStream(stream, key);
    }

    const reader = stream.getReader();
    let state = await reader.read();

    while (!state.done) {
      const buf = state.value;
      chunks.push(buf);
      progressTracker.setProgress(size);

      size += buf.length;
      console.log('Encrypted', size, 'bytes', '- timestamp:', Date.now());
      state = await reader.read();
    }
    const concatenated = concatenateUint8Arrays(chunks);
    return concatenated;
  } catch (e) {
    console.error(e);
  }
}

function concatenateUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((acc, value) => acc + value.length, 0);
  const result = new Uint8Array(totalLength);
  let length = 0;

  for (const array of arrays) {
    result.set(array, length);
    length += array.length;
  }

  return result;
}

/**
 * Calculates the size of a file after encrypting.
 *
 * @param originalSize: number - the original file size.
 * @param recordSize: number - the size of each chunk of data that gets encrypted.
 * @returns number - the total size of the file after encryption.
 */
export function calculateEncryptedSize(
  originalSize: number,
  recordSize = ECE_RECORD_SIZE
) {
  // To get the original chunk size, subtract the overhead (which is tag size + padding)
  const chunkSize = recordSize - OVERHEAD_SIZE;

  // Calculate the number of chunks produced while slicing up the original file.
  const numChunks = Math.ceil(originalSize / chunkSize);

  // Add the overhead per chunk; add the header.
  const totalSize = originalSize + numChunks * OVERHEAD_SIZE + HEADER_SIZE;

  return totalSize;
}

/* 
  TODO: We have to replace send for lockbox because fxa isn't enabled for send
  We should remove this and return the actual url once fxa is enabled 
  https://github.com/thunderbird/send-suite/issues/216
*/
export const formatLoginURL = (url: string) => {
  if (url.includes('localhost')) {
    return url;
  }
  return url.replace('%2Flockbox%2Ffxa', '%2Ffxa');
};

// After mozilla account login, confirm that
// - we have a db user
// - the user has a public key
// - the user has a default folder for email attachments
export async function dbUserSetup(
  userStore: UserStore,
  keychain: Keychain,
  folderStore: FolderStore
) {
  // Populate the user if they exist
  const didPopulate = await userStore.populateFromBackend();
  if (!didPopulate) {
    return;
  }
  // Store the user we got by populating from session.
  userStore.store();

  // Check if the user has a public key.
  // If not, this is almost certainly a new user.
  const publicKey = await userStore.getPublicKey();
  if (!publicKey) {
    await keychain.rsa.generateKeyPair();
    await keychain.store();

    const jwkPublicKey = await keychain.rsa.getPublicKeyJwk();
    const didUpdate = await userStore.updatePublicKey(jwkPublicKey);
    if (!didUpdate) {
      console.warn(`DEBUG: could not update user's public key`);
    }
  }

  // When we call `init()`, it takes care of:
  // - loading user from storage
  // - loading keychain from storage
  // - creating the default folder
  await init(userStore, keychain, folderStore);
}

/* This function is a short hand to get the meta records from the route */
export const matchMeta = (to: RouteLocationNormalized, key: string) => {
  return to.matched.some((record) => record.meta[key]);
};

type UploadOptions = {
  url: string;
  readableStream: ReadableStream;
  progressTracker: ProgressTracker;
};

export const uploadWithTracker = ({
  url,
  readableStream,
  progressTracker,
}: UploadOptions) => {
  const { setProgress } = progressTracker;
  // Track upload progress using XMLHttpRequest
  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url, true);
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const uploadProgress = event.loaded;
        setProgress(uploadProgress);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.response);
      } else {
        console.error('Upload failed:');
        reject(new Error('UPLOAD_FAILED'));
      }
    };

    xhr.onerror = () => reject(new Error('XHR: UPLOAD_FAILED'));

    // Convert ReadableStream to Blob and send
    new Response(readableStream).blob().then((uploadBlob) => {
      xhr.send(uploadBlob);
    });
  });
};

export const getDaysToExpiryText = (daysToExpiry: number) => {
  if (daysToExpiry === 1) {
    return `Expires in ${daysToExpiry} day`;
  }
  return `Expires in ${daysToExpiry} days`;
};
