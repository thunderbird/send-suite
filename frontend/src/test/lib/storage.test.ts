import { Storage } from '@/lib/storage/index';
import { UserTier } from '@/types';
import { describe, expect, it } from 'vitest';


describe('User storage', () => {
  it('can store a user without error', async () => {
    const storage = new Storage();
    const userObj = {
      id: 12345,
      email: 'ned@ryerson.com',
      tier: UserTier.PRO,
    };
    expect(async () => {
      await storage.storeUser(userObj);
    }).not.toThrowError();
  });
  it('can load the same user', async () => {
    const storage = new Storage();
    const userObj = {
      id: 12345,
      email: 'ned@ryerson.com',
      tier: UserTier.PRO,
    };
    const storedUser = await storage.loadUser();
    expect(userObj).toEqual(storedUser);
  });
});

describe('Key storage', () => {
  it('can store keys', async () => {
    const storage = new Storage();
    const keys = { 100: 'abc', 102: 'abd', 104: 'abe' };
    expect(async () => {
      await storage.storeKeys(keys);
    }).not.toThrowError();
  });
  it('can retrieve keys', async () => {
    const storage = new Storage();
    const keys = { 100: 'abc', 102: 'abd', 104: 'abe' };
    await storage.storeKeys(keys);
    const storedKeys = await storage.loadKeys();
    expect(keys).toEqual(storedKeys);
  });
});
describe('Keypair storage', () => {
  it('can store keypairs', async () => {
    const storage = new Storage();
    const keys = {
      publicKey: 'abc123',
      privateKey: 'xyz789',
    };
    expect(async () => {
      await storage.storeKeypair(keys);
    }).not.toThrowError();
  });
  it('can retrieve keypairs', async () => {
    const storage = new Storage();
    const keys = {
      publicKey: 'abc123',
      privateKey: 'xyz789',
    };
    await storage.storeKeys(keys);
    const storedKeys = await storage.loadKeypair();
    expect(keys).toEqual(storedKeys);
  });
});
