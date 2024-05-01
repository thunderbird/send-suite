import { JsonResponse } from '@/types';

export function delay(delay = 100): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delay));
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
  return new Promise((resolve, reject) => {
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
    function handleClose(event: CloseEvent) {
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
  var k = 1024,
    dm = decimals,
    sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
    i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
