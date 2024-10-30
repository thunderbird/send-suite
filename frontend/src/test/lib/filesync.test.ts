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
import useUserStore, { UserStore } from '@/stores/user-store';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';

const API_URL = `${import.meta.env.VITE_SEND_SERVER_URL}/api`;
const UPLOAD_ID = `abcdefg1234567`;

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

const textEncoder = new TextEncoder();
const plaintextUint8Array = textEncoder.encode(fileContents);
const plaintextStream = arrayBufferToReadableStream(plaintextUint8Array);
const encryptedStream = encryptStream(plaintextStream, key);
const encryptedArrayBuffer = await readableStreamToArrayBuffer(encryptedStream);

vi.mock('@/lib/helpers', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/utils')>();

  const _download = vi.fn().mockImplementation(() => {
    return new Blob([encryptedArrayBuffer]);
  });

  return {
    ...original,
    _download,
  };
});
// ===================================================

describe(`Filesync`, () => {
  describe(`getBlob`, async () => {
    const restHandlers = [
      http.get(`${API_URL}/uploads/${UPLOAD_ID}/metadata`, async () =>
        HttpResponse.json(metadata)
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let userStore: UserStore;

    beforeEach(() => {
      setActivePinia(createPinia());
      userStore = useUserStore();
    });

    it(`should download and decrypt the upload`, async () => {
      const isMessage = true;
      const result = await getBlob(
        UPLOAD_ID,
        metadata.size,
        key,
        isMessage,
        fileName,
        metadata.type
      );
      expect(result).toBe(fileContents);
    });
  });

  describe(`sendBlob`, () => {
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

    afterEach(() => {
      server.close();
    });

    it(`should get a sucessful response after uploading`, async () => {
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
      const blob = new Blob(['abc123']);
      const progressTracker = vi.fn();

      const result = await sendBlob(
        blob,
        key,
        mockedApi as any,
        progressTracker
      );

      expect(result).toEqual(SUCCESSFUL_UPLOAD_RESPONSE.id);
      expect(progressTracker).toBeCalled();
    });
  });
});
