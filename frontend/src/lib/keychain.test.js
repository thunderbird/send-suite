import { expect, describe, it } from 'vitest';
import { Keychain, Util } from './keychain';

describe('AES Key Generation', () => {
  const keychain = new Keychain();
  it('creates an AES key for uploads', async () => {
    const key = await keychain.content.generateKey();
    expect(key).toBeTruthy();
    expect(key.algorithm.name).toBe('AES-GCM');
    expect(key.algorithm.length).toBe(256);
  });
  it('creates an AES wrapping key for containers', async () => {
    const key = await keychain.container.generateContainerKey();
    expect(key).toBeTruthy();
    expect(key.algorithm.name).toBe('AES-KW');
    expect(key.algorithm.length).toBe(256);
  });
});

describe('Utility class', () => {
  const keychain = new Keychain();
  it('can determine that keys are the same', async () => {
    const key = await keychain.content.generateKey();
    const result = await Util.compareKeys(key, key);
    expect(result).toBeTruthy();
  });
  it('can determine that keys are different', async () => {
    const key = await keychain.content.generateKey();
    const key2 = await keychain.content.generateKey();
    const result = await Util.compareKeys(key, key2);
    expect(result).toBeFalsy();
  });
});

describe('AES Wrapping Keys', () => {
  const keychain = new Keychain();
  it('can wrap an AES key with a wrapping key', async () => {
    const key = await keychain.content.generateKey();
    const wrappingKey = await keychain.container.generateContainerKey();
    const wrappedKey = await keychain.container.wrapContentKey(
      key,
      wrappingKey
    );
    expect(wrappedKey).toBeTruthy();
    expect(wrappedKey.byteLength).toBe(40);
  });

  it('can unwrap an AES key with a wrapping key', async () => {
    const key = await keychain.content.generateKey();
    const wrappingKey = await keychain.container.generateContainerKey();
    const wrappedKey = await keychain.container.wrapContentKey(
      key,
      wrappingKey
    );
    const unwrappedKey = await keychain.container.unwrapContentKey(
      wrappedKey,
      wrappingKey
    );
    expect(unwrappedKey).toBeTruthy();
    expect(unwrappedKey.algorithm.name).toBe('AES-GCM');
    expect(unwrappedKey.algorithm.length).toBe(256);
    expect(await Util.compareKeys(key, unwrappedKey)).toBeTruthy();
  });
  it('can not unwrap an AES key with wrong wrapping key', async () => {
    const key = await keychain.content.generateKey();
    const wrappingKey = await keychain.container.generateContainerKey();
    const differentWrappingKey =
      await keychain.container.generateContainerKey();
    const wrappedKey = await keychain.container.wrapContentKey(
      key,
      wrappingKey
    );
    expect(async () => {
      await keychain.container.unwrapContentKey(
        wrappedKey,
        differentWrappingKey
      );
      await keychain.password.unwrapContainerKey(
        passwordWrappedKey,
        wrongPassword,
        salt
      );
    }).rejects.toThrowError();
  });
});

describe('Password protected wrapping keys', () => {
  const keychain = new Keychain();
  const salt = Util.generateSalt();
  const password = 'abc123';
  const wrongPassword = 'xyz456';

  it('can wrap a key with a password', async () => {
    const key = await keychain.container.generateContainerKey();
    const passwordWrappedKey = await keychain.password.wrapContainerKey(
      key,
      password,
      salt
    );
    expect(passwordWrappedKey).toBeTruthy();
  });
  it('can unwrap a key with correct password', async () => {
    const key = await keychain.container.generateContainerKey();
    const passwordWrappedKey = await keychain.password.wrapContainerKey(
      key,
      password,
      salt
    );
    const unwrappedKey = await keychain.password.unwrapContainerKey(
      passwordWrappedKey,
      password,
      salt
    );
    expect(key.algorithm.name).toBe('AES-KW');
    expect(unwrappedKey.algorithm.name).toBe('AES-KW');
    expect(unwrappedKey.algorithm.length).toBe(256);
    expect(await Util.compareKeys(key, unwrappedKey)).toBeTruthy();
  });
  it('can not unwrap a key with wrong password', async () => {
    const key = await keychain.container.generateContainerKey();
    const passwordWrappedKey = await keychain.password.wrapContainerKey(
      key,
      password,
      salt
    );
    expect(async () => {
      await keychain.password.unwrapContainerKey(
        passwordWrappedKey,
        wrongPassword,
        salt
      );
    }).rejects.toThrowError();
  });
});

describe('RSA Keypairs', () => {
  const keychain = new Keychain();
  it('can generate public and private keys', async () => {
    const { publicKey, privateKey } = await keychain.rsa.generateKeyPair();
    expect(publicKey).toBeTruthy();
    expect(privateKey).toBeTruthy();
  });
  it('can wrap a wrapping key with a public key', async () => {
    const { publicKey } = await keychain.rsa.generateKeyPair();
    const key = await keychain.container.generateContainerKey();
    const wrappedKeyStr = await keychain.rsa.wrapContainerKey(key, publicKey);
    expect(wrappedKeyStr).toBeTruthy();
    expect(typeof wrappedKeyStr).toEqual('string');
  });
  it('can unwrap a wrapping key with a private key', async () => {
    const { publicKey, privateKey } = await keychain.rsa.generateKeyPair();
    const key = await keychain.container.generateContainerKey();
    const wrappedKeyStr = await keychain.rsa.wrapContainerKey(key, publicKey);
    const unwrappedKey = await keychain.rsa.unwrapContainerKey(
      wrappedKeyStr,
      privateKey
    );
    expect(await Util.compareKeys(key, unwrappedKey)).toBeTruthy();
  });
  it('can not unwrap a wrapping key with wrong private key', async () => {
    const { publicKey } = await keychain.rsa.generateKeyPair();
    const key = await keychain.container.generateContainerKey();
    const wrappedKeyStr = await keychain.rsa.wrapContainerKey(key, publicKey);
    expect(async () => {
      const { privateKey: wrongPrivateKey } =
        await keychain.rsa.generateKeyPair();
      await keychain.rsa.unwrapContainerKey(wrappedKeyStr, wrongPrivateKey);
    }).rejects.toThrowError();
  });
});
