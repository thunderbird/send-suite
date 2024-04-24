import { expect, describe, it, vi } from 'vitest';
import Sharer from '@/lib/share';

import { User } from '@/lib/user';
import { ApiConnection } from '@/lib/api';
import { Keychain } from '@/lib/keychain';

import { setupServer } from 'msw/node';
import { HttpResponse, http } from 'msw';

vi.mock('@/lib/user', () => {
  const User = vi.fn();
  return {
    User,
  };
});

vi.mock('@/lib/keychain', () => {
  const Keychain = vi.fn();
  Keychain.prototype.newKeyForContainer = vi.fn();
  Keychain.prototype.store = vi.fn();
  Keychain.prototype.get = vi.fn().mockImplementation(() => 'abc123xyz');

  Keychain.prototype.container = {
    wrapContentKey: vi.fn().mockImplementation(() => `ghi789rst`),
    unwrapContentKey: vi.fn().mockImplementation(() => `def456uvw`),
  };

  Keychain.prototype.password = {
    wrapContainerKey: vi.fn().mockImplementation(() => `ghi789rst`),
    wrapContentKey: vi.fn().mockImplementation(() => `def456uvw`),
  };

  Keychain.prototype.challenge = {
    generateKey: vi.fn().mockImplementation(() => `ghi789rst`),
    createChallenge: vi.fn().mockImplementation(() => `def456uvw`),
    encryptChallenge: vi.fn().mockImplementation(() => `jkl123opq`),
  };

  const Util = vi.fn();
  Util.generateSalt = vi.fn();
  Util.arrayBufferToBase64 = vi.fn();
  return {
    Keychain,
    Util,
  };
});

const API_URL = 'https://localhost:8088/api';

describe(`Sharer`, () => {
  describe(`createShareOnlyContainer`, () => {
    const CONTAINER_ID = 2;

    const restHandlers = [
      http.post(`${API_URL}/containers`, async () =>
        HttpResponse.json({
          container: {
            id: CONTAINER_ID,
          },
        })
      ),
      http.post(`${API_URL}/containers/${CONTAINER_ID}/item`, async () =>
        HttpResponse.json({
          foo: {},
        })
      ),
    ];

    const server = setupServer(...restHandlers);
    // Start server before all tests
    beforeAll(() => server.listen());

    //  Close server after all tests
    afterAll(() => server.close());

    // Reset handlers after each test `important for test isolation`
    afterEach(() => server.resetHandlers());

    it(`Returns a containerId if successful`, async () => {
      const user = new User();
      const keychain = new Keychain();
      const api = new ApiConnection(API_URL);
      const sharer = new Sharer(user, keychain, api);

      const items = [
        {
          id: 123,
          name: 'fake file',
        },
      ];
      const result = await sharer.createShareOnlyContainer(items);
      expect(result).toBe(CONTAINER_ID);
    });

    it(`Returns undefined if items.length is 0 and no containerId is provided`, async () => {
      const user = new User();
      const keychain = new Keychain();
      const api = new ApiConnection(API_URL);
      const sharer = new Sharer(user, keychain, api);

      const items = [];

      const result = await sharer.createShareOnlyContainer(items);
      expect(result).toBeUndefined();
    });

    it(`Returns undefined if invalid api argument is provided`, async () => {
      const user = new User();
      const keychain = new Keychain();
      const sharer = new Sharer(user, keychain, {});

      const items = [
        {
          id: 123,
          name: 'fake file',
        },
      ];

      const result = await sharer.createShareOnlyContainer(items);
      expect(result).toBeUndefined();
    });

    it(`Returns undefined if invalid keychain argument is provided`, async () => {
      const user = new User();
      const api = new ApiConnection(API_URL);
      const sharer = new Sharer(user, {}, api);

      const items = [
        {
          id: 123,
          name: 'fake file',
        },
      ];

      const result = await sharer.createShareOnlyContainer(items);
      expect(result).toBeUndefined();
    });

    it(`Returns null if unable to create the share-only container`, async () => {
      //
      server.use(http.post(`${API_URL}/containers`, async () => HttpResponse.json({})));
      const user = new User();
      const keychain = new Keychain();
      const api = new ApiConnection(API_URL);
      const sharer = new Sharer(user, keychain, api);

      const items = [
        {
          id: 123,
          name: 'fake file',
        },
      ];

      const result = await sharer.createShareOnlyContainer(items);
      expect(result).toBeNull();
    });
  });
  describe(`requestAccessLink`, () => {
    it(`Returns null if unable to create a new share`, async () => {
      const handler = http.post(`${API_URL}/sharing`, async () => HttpResponse.json({}));
      const server = setupServer(handler);
      server.listen();

      const user = new User();
      const keychain = new Keychain();
      const api = new ApiConnection(API_URL);
      const sharer = new Sharer(user, keychain, api);
      const result = await sharer.requestAccessLink(1, 'abc');

      expect(result).toBeNull();
      server.close();
    });
    it(`Returns a URL for the access link if successful`, async () => {
      const LINK_ID = 'abcdef123456';
      const url = `${process.env.VITE_SEND_CLIENT_URL}/share/${LINK_ID}`;

      const handler = http.post(`${API_URL}/sharing`, async () =>
        HttpResponse.json({
          id: LINK_ID,
        })
      );
      const server = setupServer(handler);
      server.listen();

      const user = new User();
      const keychain = new Keychain();
      const api = new ApiConnection(API_URL);
      const sharer = new Sharer(user, keychain, api);
      const result = await sharer.requestAccessLink(1, 'abc');

      expect(result).toBe(url);
      server.close();
    });
  });
});
