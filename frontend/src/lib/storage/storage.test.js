import { expect, describe, it } from 'vitest';
import { Storage } from './index';

describe('User storage', () => {
  it('can store a user without error', async () => {
    const storage = new Storage();
    const userObj = {
      id: 12345,
      email: 'ned@ryerson.com',
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
