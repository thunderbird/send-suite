import { expect, describe, it } from 'vitest';
import { Keychain } from './keychain';

describe('Key Generation', () => {
  const keychain = new Keychain();
  it('creates an AES key for uploads', async () => {
    const key = await keychain.upload.generateKey();
    expect(key).toBeTruthy();
    expect(key.algorithm.name).toBe('AES-GCM');
    expect(key.algorithm.length).toBe(256);
  });
  it('creates an AES wrapping key for containers', async () => {
    const key = await keychain.container.generateWrappingKey();
    expect(key).toBeTruthy();
    expect(key.algorithm.name).toBe('AES-KW');
    expect(key.algorithm.length).toBe(256);
  });
});

describe('Wrapping and unwrapping an AES key', () => {
  const keychain = new Keychain();
  it('can wrap an AES key with a wrapping key', async () => {
    const key = await keychain.upload.generateKey();
    const wrappingKey = await keychain.container.generateWrappingKey();
    const wrappedKey = await keychain.container.wrap(key, wrappingKey);
    expect(wrappedKey).toBeTruthy();
    expect(wrappedKey.byteLength).toBe(40);
  });
  it('can unwrap an AES key with a wrapping key', async () => {
    const key = await keychain.upload.generateKey();
    const wrappingKey = await keychain.container.generateWrappingKey();
    const wrappedKey = await keychain.container.wrap(key, wrappingKey);
    const unwrappedKey = await keychain.container.unwrap(
      wrappedKey,
      wrappingKey
    );
    expect(unwrappedKey).toBeTruthy();
    expect(Keychain.compareKeys(key, unwrappedKey)).toBeTruthy();
  });
});
