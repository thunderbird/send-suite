/* eslint-disable @typescript-eslint/no-explicit-any */
const DEFAULT_CHUNK_SIZE = 1024 * 64;

function readableToTransformController(
  controller: ReadableStreamDefaultController,
  overrides?: Record<string, any>
): TransformStreamDefaultController {
  return {
    enqueue: controller.enqueue.bind(controller),
    error: controller.error.bind(controller),
    terminate: () => {
      /* No-op. Just satisfying the type */
    },
    desiredSize: controller.desiredSize,
    ...overrides,
  };
}

export function transformStream(
  readable: ReadableStream,
  transformer: Transformer,
  oncancel?: (a?: any) => void
) {
  try {
    return readable.pipeThrough(new TransformStream(transformer));
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    const reader = readable.getReader();
    return new ReadableStream({
      start(controller) {
        if (transformer.start) {
          return transformer.start(readableToTransformController(controller));
        }
      },
      async pull(controller) {
        let enqueued = false;
        while (!enqueued) {
          const data = await reader.read();
          if (data.done) {
            if (transformer.flush) {
              await transformer.flush(
                readableToTransformController(controller)
              );
            }
            return controller.close();
          }
          await transformer.transform(
            data.value,
            readableToTransformController(controller, {
              enqueue(d) {
                enqueued = true;
                controller.enqueue(d);
              },
            })
          );
        }
      },
      cancel(reason) {
        readable.cancel(reason);
        if (oncancel) {
          oncancel(reason);
        }
      },
    });
  }
}

class BlobStreamController {
  blob: Blob;
  index: number;
  chunkSize: number;
  constructor(blob: Blob, size?: number) {
    this.blob = blob;
    this.index = 0;
    this.chunkSize = size || DEFAULT_CHUNK_SIZE;
  }

  pull(controller: ReadableStreamDefaultController<Uint8Array>): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const bytesLeft = this.blob.size - this.index;
      if (bytesLeft <= 0) {
        controller.close();
        return resolve();
      }
      const size = Math.min(this.chunkSize, bytesLeft);
      const slice = this.blob.slice(this.index, this.index + size);
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          controller.enqueue(new Uint8Array(reader.result));
          resolve();
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(slice);
      this.index += size;
    });
  }
}

export function blobStream(
  blob: Blob,
  size?: number
): ReadableStream<Uint8Array> {
  return new ReadableStream(new BlobStreamController(blob, size));
}

export function arrayBufferToReadableStream(
  buffer: ArrayBuffer
): ReadableStream {
  return new ReadableStream({
    start: (controller) => {
      controller.enqueue(new Uint8Array(buffer));
      controller.close();
    },
  });
}

export async function readableStreamToArrayBuffer(
  stream: ReadableStream
): Promise<ArrayBuffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    chunks.push(value);
  }

  let totalLength = 0;
  for (const chunk of chunks) {
    totalLength += chunk.length;
  }

  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result.buffer;
}
