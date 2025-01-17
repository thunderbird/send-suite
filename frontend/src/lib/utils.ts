import { JsonResponse } from '@/lib/api';
import { NamedBlob } from '@/types';
import JSZip from 'jszip';
import { MAX_FILE_SIZE } from './const';
/**
 * Returns a promise that resolves after an amount of time has passed.
 *
 * @param { number } delayMs - number of milliseconds that must pass before the promise resolves
 */
export function delay(delayMs = 100): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

/**
 * Runs a function at an interval until it succeeds or the maximum wait time is reached.
 *
 * @param {function(): any} fn - The function to retry. Function can be `async`.
 * @param {number} waitTimeMs - How long to wait between each retry.
 * @param {number} maxWaitTimeMs - The maximum amount of time to retry until we give up.
 */
export async function retryUntilSuccessOrTimeout(
  fn: () => Promise<boolean>,
  waitTimeMs: number = 1_000,
  maxWaitTimeMs: number = 5_000
): Promise<void> {
  for (
    let waitTotalMs = 0;
    waitTotalMs < maxWaitTimeMs;
    waitTotalMs += waitTimeMs
  ) {
    await delay(waitTimeMs);
    try {
      const result: boolean = await fn();
      // Stop retrying if the function returns a truthy value
      if (!!result) return;
    } catch (e) {
      console.error(
        `Error on waiting for the file to show up in storage: ${e}`
      );
    }
  }
}

export function calculateTimeout(
  fileSizeMb: number,
  uploadSpeedMbps: number,
  buffer: number = 1.25
): number {
  const uploadSpeedMBps = uploadSpeedMbps / 8;
  const uploadTime = fileSizeMb / uploadSpeedMBps;
  return Math.ceil(uploadTime * buffer); // Returns the timeout in seconds with buffer
}

export async function streamToArrayBuffer(
  stream: ReadableStream,
  size?: number
): Promise<ArrayBufferLike> {
  const reader = stream.getReader();
  let state = await reader.read();

  if (size) {
    const result = new Uint8Array(size);
    let offset = 0;
    while (!state.done) {
      result.set(state.value, offset);
      offset += state.value.length;
      state = await reader.read();
    }
    return result.buffer;
  }

  const parts = [];
  let len = 0;
  while (!state.done) {
    parts.push(state.value);
    len += state.value.length;
    state = await reader.read();
  }
  let offset = 0;
  const result = new Uint8Array(len);
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result.buffer;
}

export function timestamp(): number {
  return new Date().getTime();
}

class ConnectionError extends Error {
  canceled: boolean;
  duration: number;
  size: number;
  constructor(canceled: boolean, duration?: number, size?: number) {
    super(canceled ? '0' : 'connection closed');
    this.canceled = canceled;
    this.duration = duration;
    this.size = size;
  }
}

export function asyncInitWebSocket(serverUrl: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    try {
      const ws = new WebSocket(serverUrl);
      ws.addEventListener('open', () => resolve(ws), { once: true });
    } catch (e) {
      reject(new ConnectionError(false));
    }
  });
}

export async function connectToWebSocketServer(
  serverUrl: string
): Promise<WebSocket> {
  const ws = new WebSocket(serverUrl);
  return new Promise((resolve) => {
    const timer = setInterval(() => {
      if (ws.readyState === 1) {
        clearInterval(timer);
        resolve(ws);
      }
    }, 10);
  });
}

export async function listenForResponse(
  ws: WebSocket,
  canceler: Record<string, any>
): Promise<JsonResponse> {
  return new Promise((resolve, reject) => {
    function handleClose() {
      // a 'close' event before a 'message' event means the request failed
      ws.removeEventListener('message', handleMessage);
      reject(new ConnectionError(canceler.canceled));
    }
    function handleMessage(msg: MessageEvent) {
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

// https://gist.github.com/zentala/1e6f72438796d74531803cc3833c039c
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes == 0) return '0 Bytes';
  const k = 1024,
    dm = decimals,
    sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
    i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export async function zipBlob(blob: Blob, filename: string) {
  const zip = new JSZip();
  zip.file(filename, blob);

  return zip.generateAsync({ type: 'blob' });
}

export const formatBlob = async (blob: NamedBlob): Promise<NamedBlob> => {
  if (blob.type === '') {
    const zippedBlob = await zipBlob(blob, blob.name);
    const compressedBlob = new Blob([zippedBlob], {
      type: 'application/zip',
    }) as NamedBlob;
    compressedBlob.name = `${blob.name}.zip`;
    return compressedBlob;
  }
  return blob;
};

export const checkBlobSize = async (blob: NamedBlob) => {
  console.log(blob);
  if (blob.size > MAX_FILE_SIZE) {
    console.warn('File too big');
    return false;
  }
  return true;
};

export const getDaysUntilDate = (date: Date | string): number => {
  const targetDate = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 3600 * 24));
};
