/* eslint-disable @typescript-eslint/no-explicit-any */
import { getBlob, sendBlob } from '@/lib/filesync';
import { createPinia, setActivePinia } from 'pinia';
import { describe, expect, it, vi } from 'vitest';

import { Keychain } from '@/lib/keychain';
import {
  arrayBufferToReadableStream,
  readableStreamToArrayBuffer,
} from '@/lib/streams';

import { encryptStream } from '@/lib/ece';
import * as useApiStore from '@/stores/api-store';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { mockProgressTracker } from './helpers';

const API_URL = `${import.meta.env.VITE_SEND_SERVER_URL}/api`;
const UPLOAD_ID = `abcdefg1234567`;
const isBucketStorage = true;

// ===================================================
// Setup steps needed at the top-level for `vi.mock()`
const keychain = new Keychain();
const key = await keychain.content.generateKey();

const fileName = 'dummy.txt';
const fileContents = new Array(26)
  .fill(0)
  .map((_, i) => String.fromCharCode(i + 97))
  .join('');
const metadata = { size: fileContents.length, type: 'text/plain' };
const bucketUrl = `${API_URL}/dummybucket`;

const textEncoder = new TextEncoder();
const plaintextUint8Array = textEncoder.encode(fileContents);
const plaintextStream = arrayBufferToReadableStream(plaintextUint8Array);
const encryptedStream = encryptStream(plaintextStream, key);
const encryptedArrayBuffer = await readableStreamToArrayBuffer(encryptedStream);

const { downloadMock } = vi.hoisted(() => {
  return {
    downloadMock: vi.fn(),
  };
});

vi.mock('@/lib/helpers', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/utils')>();

  const _download = downloadMock;
  return {
    ...original,
    _download,
  };
});
// ===================================================

downloadMock.mockImplementation(() => {
  return new Blob([encryptedArrayBuffer]);
});

describe(`Filesync`, () => {
  describe(`getBlob`, async () => {
    const restHandlers = [
      http.get(`${API_URL}/uploads/${UPLOAD_ID}/metadata`, async () =>
        HttpResponse.json(metadata)
      ),
      http.get(`${API_URL}/download/${UPLOAD_ID}/signed`, async () =>
        HttpResponse.json({ url: bucketUrl })
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

    beforeEach(() => {
      setActivePinia(createPinia());
    });

    it(`should download and decrypt the upload`, async () => {
      const fetchSpy = vi.spyOn(global, 'fetch');
      const { api } = useApiStore.default();
      const progress = mockProgressTracker;

      expect(async () => {
        const result = await getBlob(
          UPLOAD_ID,
          metadata.size,
          key,
          isBucketStorage,
          fileName,
          metadata.type,
          api,
          progress
        );
        expect(result).toBe(undefined);
      }).not.toThrow();

      expect(fetchSpy).toBeCalledTimes(1);
      expect(fetchSpy).toBeCalledWith(
        `${API_URL}/download/${UPLOAD_ID}/signed`,
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it(`should download and decrypt the upload when no key is provided`, async () => {
      const fetchSpy = vi.spyOn(global, 'fetch');
      const { api } = useApiStore.default();
      const progress = mockProgressTracker;

      expect(async () => {
        const result = await getBlob(
          UPLOAD_ID,
          metadata.size,
          undefined,
          isBucketStorage,
          fileName,
          metadata.type,
          api,
          progress
        );
        expect(result).toBe(undefined);
      }).not.toThrow();

      expect(fetchSpy).toBeCalledTimes(1);
      expect(fetchSpy).toBeCalledWith(
        `${API_URL}/download/${UPLOAD_ID}/signed`,
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it(`should throw an error if the bucket url is null`, async () => {
      const fetchSpy = vi.spyOn(global, 'fetch');
      server.use(
        http.get(`${API_URL}/download/${UPLOAD_ID}/signed`, async () =>
          HttpResponse.json({ url: null })
        )
      );
      const { api } = useApiStore.default();
      const progress = mockProgressTracker;

      expect(async () => {
        await getBlob(
          UPLOAD_ID,
          metadata.size,
          key,
          isBucketStorage,
          fileName,
          metadata.type,
          api,
          progress
        );
      }).rejects.toThrowError('BUCKET_URL_NOT_FOUND');

      expect(fetchSpy).toBeCalledWith(
        `${API_URL}/download/${UPLOAD_ID}/signed`,
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it(`should throw an error if the bucket url is null`, async () => {
      server.use(
        http.get(`${API_URL}/download/${UPLOAD_ID}/signed`, async () =>
          HttpResponse.error()
        )
      );
      const fetchSpy = vi.spyOn(global, 'fetch');
      const { api } = useApiStore.default();
      const progress = mockProgressTracker;

      expect(async () => {
        await getBlob(
          UPLOAD_ID,
          metadata.size,
          key,
          isBucketStorage,
          fileName,
          metadata.type,
          api,
          progress
        );
      }).rejects.toThrowError('BUCKET_URL_NOT_FOUND');

      expect(fetchSpy).toBeCalledWith(
        `${API_URL}/download/${UPLOAD_ID}/signed`,
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it(`should throw an error if the file cannot be downloaded`, async () => {
      const fetchSpy = vi.spyOn(global, 'fetch');
      // Spy on XMLHttpRequest's open method
      downloadMock.mockImplementation(() => {
        return Promise.reject('DOWNLOAD ERROR');
      });

      const { api } = useApiStore.default();
      const progress = mockProgressTracker;

      server.use(
        http.get(`${API_URL}/download/${UPLOAD_ID}/signed`, async () =>
          HttpResponse.json({ url: bucketUrl })
        ),
        http.get(bucketUrl, async () => HttpResponse.error())
      );

      expect(async () => {
        await getBlob(
          UPLOAD_ID,
          metadata.size,
          key,
          isBucketStorage,
          fileName,
          metadata.type,
          api,
          progress
        );
      }).rejects.toThrowError('DOWNLOAD ERROR');

      expect(fetchSpy).toBeCalledWith(
        `${API_URL}/download/${UPLOAD_ID}/signed`,
        expect.objectContaining({
          method: 'GET',
        })
      );
    });
  });

  describe(`sendBlob`, async () => {
    const SUCCESSFUL_UPLOAD_RESPONSE = {
      id: 1,
    };

    const restHandlers = [
      http.put(`${API_URL}/dummybucket`, async () =>
        HttpResponse.json(metadata)
      ),
      http.post(`${API_URL}/uploads/signed`, async () =>
        HttpResponse.json(metadata)
      ),
    ];

    // http
    const server = setupServer(...restHandlers);
    server.listen();

    afterAll(() => {
      server.close();
    });
    beforeEach(() => {
      setActivePinia(createPinia());
    });
    afterEach(() => {
      server.resetHandlers();
      server.close();
    });

    it(`should get a successful response after uploading`, async () => {
      const mockedApi = vi
        .spyOn(useApiStore, 'default')
        // @ts-ignore
        .mockReturnValue({
          // @ts-ignore
          api: { ...useApiStore.default().api },
        })
        .mockResolvedValueOnce({
          // @ts-ignore
          id: 1,
          url: `${API_URL}/dummybucket`,
        });

      const keychain = new Keychain();
      const key = await keychain.content.generateKey();
      const blob = new Blob([new Uint8Array(2)]);

      const result = await sendBlob(
        blob,
        key,
        mockedApi as any,
        mockProgressTracker
      );

      expect(result).toEqual(SUCCESSFUL_UPLOAD_RESPONSE.id);
    });

    it('should handle upload errors', async () => {
      server.use(
        http.put(`${API_URL}/dummybucket`, async () => HttpResponse.error())
      );

      const mockedApi = vi.spyOn(useApiStore, 'default');

      const keychain = new Keychain();
      const key = await keychain.content.generateKey();
      const blob = new Blob([new Uint8Array(2)]);

      await expect(
        sendBlob(
          blob,
          key,
          mockedApi as any,
          mockProgressTracker,
          isBucketStorage
        )
      ).rejects.toThrow();
    });
  });
});
