import { describe, expect, it, vi } from 'vitest';
import { uploadWithTracker } from './helpers';

describe('helpers', () => {
  describe('uploadWithTracker', () => {
    let xhrMock: any;

    beforeEach(() => {
      xhrMock = {
        open: vi.fn(),
        send: vi.fn(),
        setRequestHeader: vi.fn(),
        upload: {
          onprogress: null,
        },
        status: 200,
        response: '{"status":"success"}',
      };

      // @ts-ignore
      global.XMLHttpRequest = vi.fn(() => xhrMock);
    });

    it('should track upload progress', async () => {
      const progressTracker = vi.fn();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('test-content'));
          controller.close();
        },
      });

      const uploadPromise = uploadWithTracker({
        url: 'test-url',
        readableStream: stream,
        progressTracker,
      });

      // Simulate upload progress
      xhrMock.upload.onprogress({ lengthComputable: true, loaded: 50 });

      // Simulate successful completion
      xhrMock.onload();

      const result = await uploadPromise;
      expect(progressTracker).toHaveBeenCalledWith(50);
      expect(result).toBe('{"status":"success"}');
    });

    it('catches errors', async () => {
      const progressTracker = vi.fn();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('test-content'));
          controller.close();
        },
      });

      xhrMock.status = 500;

      const uploadPromise = uploadWithTracker({
        url: 'test-url',
        readableStream: stream,
        progressTracker,
      });

      // Simulate completion with error
      xhrMock.onload();

      await expect(uploadPromise).rejects.toThrow('UPLOAD_FAILED');
    });

    it('catches network errors', async () => {
      const progressTracker = vi.fn();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('test-content'));
          controller.close();
        },
      });

      const uploadPromise = uploadWithTracker({
        url: 'test-url',
        readableStream: stream,
        progressTracker,
      });

      // Simulate network error
      xhrMock.onerror();

      await expect(uploadPromise).rejects.toThrow('UPLOAD_FAILED');
    });
  });
});
