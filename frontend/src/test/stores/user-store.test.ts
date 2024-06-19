import { Storage } from '@/lib/storage';
import useApiStore from '@/stores/api-store';
import useUserStore from '@/stores/user-store';
import { UserTier } from '@/types';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let userStore;

describe('User Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    userStore = useUserStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const email = 'test@example.com';
  const jwkPublicKey = 'publicKey';
  const publicKey = 'publicKey';

  describe('createUser', () => {
    it('should return null if the API call fails to create a user', async () => {
      const isEphemeral = false;
      const apiCallMock = vi
        .spyOn(useApiStore().api, 'call')
        .mockResolvedValue(null); // Simulating API failure

      const result = await userStore.createUser(
        email,
        jwkPublicKey,
        isEphemeral
      );

      expect(apiCallMock).toHaveBeenCalledWith(
        'users',
        {
          email,
          publicKey,
          tier: UserTier.PRO,
        },
        'POST'
      );
      expect(result).toBeNull();
    });

    it('should create a new user', async () => {
      const isEphemeral = false;

      const apiCallMock = vi
        .spyOn(useApiStore().api, 'call')
        .mockResolvedValueOnce({
          user: {
            id: 1,
            tier: 3,
          },
        });

      const result = await userStore.createUser(
        email,
        jwkPublicKey,
        isEphemeral
      );

      expect(apiCallMock).toHaveBeenCalledWith(
        'users',
        {
          email,
          tier: 3,
          publicKey,
        },
        'POST'
      );

      expect(result).toEqual({
        id: 1,
        tier: 3,
        email,
      });
    });

    it('should create a new ephimeral user', async () => {
      const isEphemeral = true;

      const apiCallMock = vi
        .spyOn(useApiStore().api, 'call')
        .mockResolvedValueOnce({
          user: {
            id: 1,
            tier: UserTier.EPHEMERAL,
          },
        });

      const result = await userStore.createUser(
        email,
        jwkPublicKey,
        isEphemeral
      );

      expect(apiCallMock).toHaveBeenCalledWith(
        'users',
        {
          email,
          publicKey,
          tier: UserTier.EPHEMERAL,
        },
        'POST'
      );

      expect(result).toEqual({
        id: 1,
        tier: UserTier.EPHEMERAL,
        email,
      });
    });

    it('should use the stored email if no email is provided', async () => {
      userStore.user.email = 'stored@example.com'; // Assume this is set from a previous action
      const loginResponse = {
        id: 4,
        tier: UserTier.FREE,
        email: userStore.user.email,
      };
      const apiCallMock = vi
        .spyOn(useApiStore().api, 'call')
        .mockResolvedValue(loginResponse);
      const consoleLogMock = vi.spyOn(console, 'log');

      const result = await userStore.login();

      expect(consoleLogMock).toHaveBeenCalledWith(
        `logging in as ${userStore.user.email}`
      );
      expect(apiCallMock).toHaveBeenCalledWith(
        'users/login',
        { email: userStore.user.email },
        'POST'
      );
      expect(userStore.user.id).toBe(loginResponse.id);
      expect(userStore.user.tier).toBe(loginResponse.tier);
      expect(userStore.user.email).toBe(loginResponse.email);
      expect(result).toEqual(loginResponse);
    });

    it('should return null if the API call fails', async () => {
      const loginEmail = 'fail@example.com';
      const apiCallMock = vi
        .spyOn(useApiStore().api, 'call')
        .mockResolvedValue(null); // Simulating API failure
      const consoleLogMock = vi.spyOn(console, 'log');

      const result = await userStore.login(loginEmail);

      expect(consoleLogMock).toHaveBeenCalledWith(
        `logging in as ${loginEmail}`
      );
      expect(apiCallMock).toHaveBeenCalledWith(
        'users/login',
        { email: loginEmail },
        'POST'
      );
      expect(result).toBeNull();
    });

  });

  describe('login', () => {
    it('should login with the provided email', async () => {
      const apiCallMock = vi
        .spyOn(useApiStore().api, 'call')
        .mockResolvedValueOnce({
          id: 1,
          tier: 3,
          email,
        });

      const result = await userStore.login(email);

      expect(apiCallMock).toHaveBeenCalledWith(
        'users/login',
        { email },
        'POST'
      );
      expect(result).toEqual({
        id: 1,
        tier: 3,
        email
      });
    });
  });

  describe('load', () => {
    it('should load user data from storage and populate the store', async () => {
      const storedUserData = {
        id: 2,
        tier: UserTier.FREE,
        email
      };
      const storageMock = vi
        .spyOn(Storage.prototype, 'loadUser')
        .mockResolvedValue(storedUserData);
      const consoleTableMock = vi.spyOn(console, 'table');

      const result = await userStore.load();

      expect(storageMock).toHaveBeenCalled();
      expect(consoleTableMock).toHaveBeenCalledWith({
        id: storedUserData.id,
        tier: storedUserData.tier,
        email: storedUserData.email,
      });
      expect(userStore.user.id).toBe(storedUserData.id);
      expect(userStore.user.tier).toBe(storedUserData.tier);
      expect(userStore.user.email).toBe(storedUserData.email);
      expect(result).toBe(true);
    });

    it('should return false and log an error if no user data is in storage', async () => {
      const storageMock = vi
        .spyOn(Storage.prototype, 'loadUser')
        .mockRejectedValue(new Error('Storage fetch failed'));
      const consoleLogMock = vi.spyOn(console, 'log');

      const result = await userStore.load();

      expect(storageMock).toHaveBeenCalled();
      expect(consoleLogMock).toHaveBeenCalledWith('No user in storage');
      expect(result).toBe(false);
    });
  });

  describe('store', () => {
    it('should store the user with new values', async () => {
      const newId = 2;
      const newTier = UserTier.PRO;
      const newEmail = 'new@example.com';
      const storageMock = vi.spyOn(Storage.prototype, 'storeUser');
      await userStore.store(newId, newTier, newEmail);
      expect(storageMock).toHaveBeenCalledWith({
        id: newId,
        tier: newTier,
        email: newEmail,
      });
    });

    it('should keep default values if not passed', async () => {
      const storageMock = vi.spyOn(Storage.prototype, 'storeUser');
      const result = await userStore.store(undefined, undefined, undefined);
      expect(result).toBeUndefined();
      expect(storageMock).not.toHaveBeenCalled();
    });

    it('should not store the user if id is not set', async () => {
      const newTier = UserTier.PRO;
      const newEmail = 'new@example.com';
      const storageMock = vi.spyOn(Storage.prototype, 'storeUser');
      await userStore.store(undefined, newTier, newEmail);
      expect(storageMock).not.toHaveBeenCalled();
    });
  });

  describe('populateFromSession', () => {
    it('should populate user store with user data from session', async () => {
      const userData = {
        user: {
          id: 1,
          email,
          tier: UserTier.PRO,
        },
      };
      const apiCallMock = vi
        .spyOn(useApiStore().api, 'call')
        .mockResolvedValueOnce(userData);

      const result = await userStore.populateFromSession();

      expect(apiCallMock).toHaveBeenCalledWith('users/me');
      expect(userStore.user.id).toBe(userData.user.id);
      expect(userStore.user.email).toBe(userData.user.email);
      expect(userStore.user.tier).toBe(userData.user.tier);
      expect(result).toBe(true);
    });

    it('should return false when no user data is retrieved', async () => {
      const apiCallMock = vi
        .spyOn(useApiStore().api, 'call')
        .mockResolvedValueOnce({}); // No user object in the response

      const result = await userStore.populateFromSession();

      expect(apiCallMock).toHaveBeenCalledWith('users/me');
      expect(result).toBe(false);
    });

    it('should return false when the API call fails to return a response', async () => {
      const apiCallMock = vi
        .spyOn(useApiStore().api, 'call')
        .mockResolvedValueOnce(null); // Simulate a null response scenario

      const result = await userStore.populateFromSession();

      expect(apiCallMock).toHaveBeenCalledWith('users/me');
      expect(result).toBe(false);
    });
  });

  describe('getPublicKey', () => {
    it('should retrieve a public key for a given user', async () => {
      const userId = 0; // Assuming the user ID is known for the test
      const apiCallMock = vi
        .spyOn(useApiStore().api, 'call')
        .mockResolvedValueOnce({ publicKey });

      const result = await userStore.getPublicKey(userId);

      expect(apiCallMock).toHaveBeenCalledWith(`users/publickey/${userId}`);
      expect(result).toBe(publicKey);
    });
  });

  describe('updatePublicKey', () => {
    it('should update the user public key and return the new key', async () => {
      const apiCallMock = vi
        .spyOn(useApiStore().api, 'call')
        .mockResolvedValueOnce({ update: { publicKey } });

      const result = await userStore.updatePublicKey(publicKey);

      expect(apiCallMock).toHaveBeenCalledWith(
        'users/publickey',
        { publicKey },
        'POST'
      );
      expect(result).toBe(publicKey);
    });
  });

  describe('getMozAccountAuthUrl', () => {
    it('should retrieve the authentication URL for Mozilla account', async () => {
      const authUrl = 'api/login';
      const apiCallMock = vi
        .spyOn(useApiStore().api, 'call')
        .mockResolvedValueOnce({ url: authUrl });

      const result = await userStore.getMozAccountAuthUrl();

      expect(apiCallMock).toHaveBeenCalledWith('lockbox/fxa/login');
      expect(result).toBe(authUrl);
    });
  });

  describe('createBackup', () => {
    it('should create a backup for the user and handle the data correctly', async () => {
      const userId = 1;
      const backupData = {
        keys: 'someKeys',
        keypair: 'someKeypair',
        keystring: 'someKeystring',
        salt: 'someSalt',
      };
      const apiCallMock = vi
        .spyOn(useApiStore().api, 'call')
        .mockResolvedValueOnce({ success: true });

      const result = await userStore.createBackup(
        userId,
        backupData.keys,
        backupData.keypair,
        backupData.keystring,
        backupData.salt
      );

      expect(apiCallMock).toHaveBeenCalledWith(
        `users/${userId}/backup`,
        backupData,
        'POST'
      );
      expect(result).toEqual({ success: true });
    });
  });

  describe('createBackup', () => {
    it('should create a backup for the user and handle the data correctly', async () => {
      const userId = 1;
      const backupData = {
        keys: 'someKeys',
        keypair: 'someKeypair',
        keystring: 'someKeystring',
        salt: 'someSalt',
      };
      const apiCallMock = vi
        .spyOn(useApiStore().api, 'call')
        .mockResolvedValueOnce({ success: true });

      const result = await userStore.createBackup(
        userId,
        backupData.keys,
        backupData.keypair,
        backupData.keystring,
        backupData.salt
      );

      expect(apiCallMock).toHaveBeenCalledWith(
        `users/${userId}/backup`,
        backupData,
        'POST'
      );
      expect(result).toEqual({ success: true });
    });
  });

  describe('getBackup', () => {
    it('should retrieve backup data for a specific user', async () => {
      const userId = 1;
      const backupData = {
        keys: 'someKeys',
        keypair: 'someKeypair',
        keystring: 'someKeystring',
        salt: 'someSalt',
      };
      const apiCallMock = vi
        .spyOn(useApiStore().api, 'call')
        .mockResolvedValueOnce(backupData);

      const result = await userStore.getBackup(userId);

      expect(apiCallMock).toHaveBeenCalledWith(`users/${userId}/backup`);
      expect(result).toEqual(backupData);
    });
  });
});
