import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { describe, expect, it, vi } from 'vitest';
import { uploadWithTracker } from './helpers';

const TEST_URL = `${import.meta.env.VITE_SEND_SERVER_URL}/api`;
const TEST_CONTENT = 'test-content';
const TEST_BLOB = new Blob([TEST_CONTENT]);

describe('helpers', () => {
  const restHandlers = [
    http.get(`${TEST_URL}/download/*`, () =>
      HttpResponse.json({ blob: TEST_BLOB })
    ),
    http.put(`${TEST_URL}/upload`, async () =>
      HttpResponse.json({ status: 'success' })
    ),
  ];

  const server = setupServer(...restHandlers);

  beforeAll(() => {
    server.listen();
  });

  afterAll(() => {
    server.close();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  describe('uploadWithTracker', () => {
    const TEST_URL = `${import.meta.env.VITE_SEND_SERVER_URL}/api`;
    const TEST_CONTENT = 'test-content';
    const TEST_BLOB = new Blob([TEST_CONTENT]);

    describe('helpers', () => {
      const restHandlers = [
        http.get(`${TEST_URL}/download/*`, () =>
          HttpResponse.json({ blob: TEST_BLOB })
        ),
        http.put(`${TEST_URL}/upload`, async () =>
          HttpResponse.json({ status: 'success' })
        ),
      ];

      const server = setupServer(...restHandlers);

      beforeAll(() => {
        server.listen();
      });

      afterAll(() => {
        server.close();
      });

      afterEach(() => {
        server.resetHandlers();
      });

      describe('uploadWithTracker', () => {
        it('should track upload progress', async () => {
          const progressTracker = vi.fn();
          const stream = new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode(TEST_CONTENT));
              controller.close();
            },
          });

          try {
            const result = await uploadWithTracker({
              url: `${TEST_URL}/upload`,
              readableStream: stream,
              progressTracker,
            });
            expect(progressTracker).toHaveBeenCalled();
            expect(result).toBe('{"status":"success"}');
          } catch (error) {
            console.log(error);
          }
        });
      });
    });
  });
});
