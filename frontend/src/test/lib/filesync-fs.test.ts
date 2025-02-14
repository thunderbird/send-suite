/* eslint-disable @typescript-eslint/no-explicit-any */
import * as filesync from '@/lib/filesync';
import { describe, expect, it, vi } from 'vitest';

import { Keychain } from '@/lib/keychain';
import {
  arrayBufferToReadableStream,
  readableStreamToArrayBuffer,
} from '@/lib/streams';
import * as utils from '@/lib/utils';

import { WebSocket } from 'mock-socket';
import WS from 'vitest-websocket-mock';

import { encryptStream } from '@/lib/ece';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { mockProgressTracker } from './helpers';

const { getBlob, sendBlob } = filesync;

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

    it(`should download and decrypt the upload`, async () => {
      const progress = mockProgressTracker;
      // const _saveFileMock = vi.spyOn(ff, '_saveFile');
      const result = await getBlob(
        UPLOAD_ID,
        metadata.size,
        key,
        false,
        fileName,
        metadata.type,
        vi.fn() as any,
        progress
      );
      // expect(_saveFileMock).toBeCalled();
      expect(result).toBe(undefined);
    });

    it(`should download and decrypt the upload with no key`, async () => {
      const progress = mockProgressTracker;
      // const _saveFileMock = vi.spyOn(ff, '_saveFile');
      const result = await getBlob(
        UPLOAD_ID,
        metadata.size,
        undefined,
        false,
        fileName,
        metadata.type,
        vi.fn() as any,
        progress
      );
      // expect(_saveFileMock).toBeCalled();
      expect(result).toBe(undefined);
    });
  });

  describe(`sendBlob`, () => {
    const SUCCESSFUL_UPLOAD_RESPONSE = {
      id: 'abcd1234',
    };
    const MOCK_WS_SERVER_URL = `ws://localhost:8765`;

    let server: WS;
    let client: WebSocket;

    beforeEach(async () => {
      server = new WS(MOCK_WS_SERVER_URL);
      client = new WebSocket(MOCK_WS_SERVER_URL);
      await server.connected; // only run tests after connecting
    });

    afterEach(() => {
      server.close();
    });

    it(`should get a sucessful response after uploading`, async () => {
      const mockListenForResponse = vi.spyOn(utils, 'listenForResponse');

      // When uploading, we expect two responses from the WebSocket server.
      mockListenForResponse
        .mockResolvedValueOnce(SUCCESSFUL_UPLOAD_RESPONSE)
        .mockResolvedValueOnce({ ...SUCCESSFUL_UPLOAD_RESPONSE, ok: true });

      const mockAsyncInitWebSocket = vi.spyOn(utils, 'asyncInitWebSocket');
      // Resolve to the already-connected client.
      mockAsyncInitWebSocket.mockResolvedValue(client);

      const keychain = new Keychain();
      const key = await keychain.content.generateKey();
      const blob = new Blob(['abc123']);
      // const progressTracker = vi.fn();

      const result = await sendBlob(
        blob,
        key,
        vi.fn() as any,
        mockProgressTracker,
        false
      );
      expect(result).toEqual(SUCCESSFUL_UPLOAD_RESPONSE.id);
      // expect(progressTracker).toBeCalled();
    });

    it(`should get a sucessful response after uploading when response is array`, async () => {
      const mockListenForResponse = vi.spyOn(utils, 'listenForResponse');
      const SUCCESSFUL_UPLOAD_RESPONSE = [
        {
          id: 'abcd1234',
        },
      ];

      // When uploading, we expect two responses from the WebSocket server.
      mockListenForResponse
        .mockResolvedValueOnce([SUCCESSFUL_UPLOAD_RESPONSE])
        .mockResolvedValueOnce(SUCCESSFUL_UPLOAD_RESPONSE);

      const mockAsyncInitWebSocket = vi.spyOn(utils, 'asyncInitWebSocket');
      // Resolve to the already-connected client.
      mockAsyncInitWebSocket.mockResolvedValue(client);

      const keychain = new Keychain();
      const key = await keychain.content.generateKey();
      const blob = new Blob(['abc123']);
      // const progressTracker = vi.fn();

      const result = await sendBlob(
        blob,
        key,
        vi.fn() as any,
        mockProgressTracker,
        false
      );
      expect(result).toEqual(SUCCESSFUL_UPLOAD_RESPONSE.at(0).id);
    });
  });
});
