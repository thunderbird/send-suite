export function transformStream(readable, transformer, oncancel) {
  try {
    return readable.pipeThrough(new TransformStream(transformer));
  } catch (e) {
    debugger;
    const reader = readable.getReader();
    return new ReadableStream({
      start(controller) {
        if (transformer.start) {
          return transformer.start(controller);
        }
      },
      async pull(controller) {
        let enqueued = false;
        const wrappedController = {
          enqueue(d) {
            enqueued = true;
            controller.enqueue(d);
          },
        };
        while (!enqueued) {
          const data = await reader.read();
          if (data.done) {
            if (transformer.flush) {
              await transformer.flush(controller);
            }
            return controller.close();
          }
          await transformer.transform(data.value, wrappedController);
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
  constructor(blob, size) {
    this.blob = blob;
    this.index = 0;
    this.chunkSize = size || 1024 * 64;
  }

  pull(controller) {
    return new Promise((resolve, reject) => {
      const bytesLeft = this.blob.size - this.index;
      if (bytesLeft <= 0) {
        controller.close();
        return resolve();
      }
      const size = Math.min(this.chunkSize, bytesLeft);
      const slice = this.blob.slice(this.index, this.index + size);
      const reader = new FileReader();
      reader.onload = () => {
        controller.enqueue(new Uint8Array(reader.result));
        resolve();
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(slice);
      this.index += size;
    });
  }
}

export function blobStream(blob, size) {
  return new ReadableStream(new BlobStreamController(blob, size));
}
