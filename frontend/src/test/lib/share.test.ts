import { expect, describe, it, vi } from 'vitest';
import Sharer from '@/lib/share';

import { User } from '@/lib/user';
import { ApiConnection } from '@/lib/api';
import { Keychain, Util } from '@/lib/keychain';

import { setupServer } from 'msw/node';
import { HttpResponse, http } from 'msw';

vi.mock('@/lib/user', () => {
  const User = vi.fn();
  return {
    User,
  };
});

vi.mock('@/lib/keychain', () => {
  const Keychain = vi.fn(() => ({
    newKeyForContainer: vi.fn(),
    store: vi.fn(),
    get: vi.fn().mockImplementation(() => 'abc123xyz'),
    container: {
      wrapContentKey: vi.fn().mockImplementation(() => `ghi789rst`),
      unwrapContentKey: vi.fn().mockImplementation(() => `def456uvw`),
    },
    password: {
      wrapContainerKey: vi.fn().mockImplementation(() => `ghi789rst`),
      wrapContentKey: vi.fn().mockImplementation(() => `def456uvw`),
    },
    challenge: {
      generateKey: vi.fn().mockImplementation(() => `ghi789rst`),
      createChallenge: vi.fn().mockImplementation(() => `def456uvw`),
      encryptChallenge: vi.fn().mockImplementation(() => `jkl123opq`),
    },
  }));

  const Util = {
    generateSalt: vi.fn(),
    arrayBufferToBase64: vi.fn(),
  };

  return {
    Keychain,
    Util,
  };
});

const API_URL = `${import.meta.env.VITE_SEND_SERVER_URL}/api`;

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
      const keychain = new Keychain();
      const api = new ApiConnection(API_URL);
      const user = new User();
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

    it(`Returns null if items.length is 0 and no containerId is provided`, async () => {
      const keychain = new Keychain();
      const api = new ApiConnection(API_URL);
      const user = new User();
      const sharer = new Sharer(user, keychain, api);

      const items = [];

      const result = await sharer.createShareOnlyContainer(items);
      expect(result).toBeNull();
    });

    it(`Returns null if invalid api argument is provided`, async () => {
      const api = new ApiConnection(API_URL);
      const user = new User();
      const keychain = new Keychain();
      const sharer = new Sharer(user, keychain, null);

      const items = [
        {
          id: 123,
          name: 'fake file',
        },
      ];

      const result = await sharer.createShareOnlyContainer(items);
      expect(result).toBeNull();
    });

    it(`Returns null if invalid keychain argument is provided`, async () => {
      const api = new ApiConnection(API_URL);
      const user = new User();
      const sharer = new Sharer(user, null, api);

      const items = [
        {
          id: 123,
          name: 'fake file',
        },
      ];

      const result = await sharer.createShareOnlyContainer(items);
      expect(result).toBeNull();
    });

    it(`Returns null if unable to create the share-only container`, async () => {
      //
      server.use(
        http.post(`${API_URL}/containers`, async () => HttpResponse.json({}))
      );
      const keychain = new Keychain();
      const api = new ApiConnection(API_URL);
      const user = new User();
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
      const handler = http.post(`${API_URL}/sharing`, async () =>
        HttpResponse.json({})
      );
      const server = setupServer(handler);
      server.listen();

      const keychain = new Keychain();
      const api = new ApiConnection(API_URL);
      const user = new User();
      const sharer = new Sharer(user, keychain, api);
      const result = await sharer.requestAccessLink(1, 'abc');

      expect(result).toBeNull();
      server.close();
    });
    it(`Returns a URL for the access link if successful`, async () => {
      const LINK_ID = 'abcdef123456';
      const url = `${import.meta.env.VITE_SEND_CLIENT_URL}/share/${LINK_ID}`;

      const handler = http.post(`${API_URL}/sharing`, async () =>
        HttpResponse.json({
          id: LINK_ID,
        })
      );
      const server = setupServer(handler);
      server.listen();

      const keychain = new Keychain();
      const api = new ApiConnection(API_URL);
      const user = new User();
      const sharer = new Sharer(user, keychain, api);
      const result = await sharer.requestAccessLink(1, 'abc');

      expect(result).toBe(url);
      server.close();
    });
  });
});
