import { expect, describe, it } from 'vitest';
import { Keychain, Util } from './keychain';

describe('AES Key Generation', () => {
  const keychain = new Keychain();
  it('creates an AES key for uploads', async () => {
    const key = await keychain.content.generateKey();
    expect(key).toBeTruthy();
    expect(key.algorithm.name).toBe('AES-GCM');
    for (let p of key.usages) {
      expect(['encrypt', 'decrypt'].includes(p));
    }
    expect(key.algorithm.length).toBe(256);
  });
  it('creates an AES wrapping key for containers', async () => {
    const key = await keychain.container.generateContainerKey();
    expect(key).toBeTruthy();
    expect(key.algorithm.name).toBe('AES-KW');
    for (let p of key.usages) {
      expect(['wrap', 'unwrap'].includes(p));
    }
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
    for (let p of unwrappedKey.usages) {
      expect(['encrypt', 'decrypt'].includes(p));
    }
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
    }).rejects.toThrowError();
  });
});

describe('Password protected keys', () => {
  const keychain = new Keychain();
  const salt = Util.generateSalt();
  const password = 'abc123';
  const wrongPassword = 'xyz456';

  it('can wrap a container key with a password', async () => {
    const key = await keychain.container.generateContainerKey();
    const passwordWrappedKeyStr = await keychain.password.wrapContainerKey(
      key,
      password,
      salt
    );
    expect(passwordWrappedKeyStr).toBeTruthy();
    expect(typeof passwordWrappedKeyStr).toEqual('string');
  });
  it('can unwrap a container key with correct password', async () => {
    const key = await keychain.container.generateContainerKey();
    const passwordWrappedKeyStr = await keychain.password.wrapContainerKey(
      key,
      password,
      salt
    );
    const unwrappedKey = await keychain.password.unwrapContainerKey(
      passwordWrappedKeyStr,
      password,
      salt
    );
    expect(key.algorithm.name).toBe('AES-KW');
    expect(unwrappedKey.algorithm.name).toBe('AES-KW');
    for (let p of unwrappedKey.usages) {
      expect(['wrap', 'unwrap'].includes(p));
    }
    expect(unwrappedKey.algorithm.length).toBe(256);
    expect(await Util.compareKeys(key, unwrappedKey)).toBeTruthy();
  });
  it('can not unwrap a container key with wrong password', async () => {
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
  it('can wrap a content key with a password', async () => {
    const key = await keychain.content.generateKey();
    const salt = Util.generateSalt();
    const passwordWrappedKeyStr = await keychain.password.wrapContentKey(
      key,
      password,
      salt
    );
    expect(passwordWrappedKeyStr).toBeTruthy();
    expect(typeof passwordWrappedKeyStr).toEqual('string');
  });
  it('can unwrap a content key with correct password', async () => {
    const key = await keychain.content.generateKey();
    const salt = Util.generateSalt();
    const passwordWrappedKeyStr = await keychain.password.wrapContentKey(
      key,
      password,
      salt
    );
    const unwrappedKey = await keychain.password.unwrapContentKey(
      passwordWrappedKeyStr,
      password,
      salt
    );
    expect(key.algorithm.name).toBe('AES-GCM');
    expect(unwrappedKey.algorithm.name).toBe('AES-GCM');
    for (let p of unwrappedKey.usages) {
      expect(['encrypt', 'decrypt'].includes(p));
    }
    expect(unwrappedKey.algorithm.length).toBe(256);
    expect(await Util.compareKeys(key, unwrappedKey)).toBeTruthy();
  });
  it('can not unwrap a content key with wrong password', async () => {
    const key = await keychain.content.generateKey();
    const salt = Util.generateSalt();
    const passwordWrappedKeyStr = await keychain.password.wrapContentKey(
      key,
      password,
      salt
    );
    expect(async () => {
      await keychain.password.unwrapContentKey(
        passwordWrappedKeyStr,
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
  it('can unwrap a container key with a private key', async () => {
    const { publicKey, privateKey } = await keychain.rsa.generateKeyPair();
    const key = await keychain.container.generateContainerKey();
    const wrappedKeyStr = await keychain.rsa.wrapContainerKey(key, publicKey);
    const unwrappedKey = await keychain.rsa.unwrapContainerKey(
      wrappedKeyStr,
      privateKey
    );
    expect(await Util.compareKeys(key, unwrappedKey)).toBeTruthy();
    for (let p of unwrappedKey.usages) {
      expect(['wrap', 'unwrap'].includes(p));
    }
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

describe('Keychain methods', async () => {
  it('can add a key to the keychain', async () => {
    const keychain = new Keychain();
    // Keys are stored internally in keychain.rsa.{ publicKey, privateKey }
    await keychain.rsa.generateKeyPair();
    const id = 1;
    const key = await keychain.container.generateContainerKey();
    await keychain.add(id, key);
    expect(Object.keys(keychain._keys).length).toEqual(1);
  });
  it('can add multiple keys to the keychain', async () => {
    const keychain = new Keychain();
    // Keys are stored internally in keychain.rsa.{ publicKey, privateKey }
    await keychain.rsa.generateKeyPair();
    const howMany = 10;
    const range = Array.from(Array(howMany).keys());
    await Promise.all(
      range.map(async (_, i) => {
        let key = await keychain.container.generateContainerKey();
        return keychain.add(i, key);
      })
    );

    expect(Object.keys(keychain._keys).length).toEqual(howMany);
  });
  it('can get same key from the keychain', async () => {
    const keychain = new Keychain();
    // Keys are stored internally in keychain.rsa.{ publicKey, privateKey }
    await keychain.rsa.generateKeyPair();
    const id = 1;
    const key = await keychain.container.generateContainerKey();
    await keychain.add(id, key);
    const sameKey = await keychain.get(id);
    expect(await Util.compareKeys(key, sameKey)).toBeTruthy();
  });
});

describe('Challenge text', async () => {
  const keychain = new Keychain();
  it('can create unique challenge text', () => {
    const challenge = keychain.challenge.createChallenge();
    const challenge2 = keychain.challenge.createChallenge();
    expect(typeof challenge).toBe('string');
    expect(typeof challenge2).toBe('string');
    expect(challenge).not.toEqual(challenge2);
  });

  it('can create a challenge key', async () => {
    const key = await keychain.challenge.generateKey();
    expect(key).toBeTruthy();
    expect(key.algorithm.name).toBe('AES-GCM');
    expect(key.algorithm.length).toBe(256);
  });
  it('can encrypt the challenge text, given a challenge key', async () => {
    const challenge = keychain.challenge.createChallenge();
    const key = await keychain.challenge.generateKey();
    const salt = Util.generateSalt();
    const ciphertext = await keychain.challenge.encryptChallenge(
      challenge,
      key,
      salt
    );
    expect(typeof ciphertext).toBe('string');
    expect(ciphertext.length).toBeGreaterThan(0);
  });
  it('can decrypt the challenge text using the same challenge key', async () => {
    const challenge = keychain.challenge.createChallenge();
    const key = await keychain.challenge.generateKey();
    const salt = Util.generateSalt();
    const ciphertext = await keychain.challenge.encryptChallenge(
      challenge,
      key,
      salt
    );
    const plaintext = await keychain.challenge.decryptChallenge(
      ciphertext,
      key,
      salt
    );
    expect(challenge).toEqual(plaintext);
  });
  it('can not decrypt the challenge text using the wrong challenge key', async () => {
    const challenge = keychain.challenge.createChallenge();
    const key = await keychain.challenge.generateKey();
    const salt = Util.generateSalt();
    const ciphertext = await keychain.challenge.encryptChallenge(
      challenge,
      key,
      salt
    );
    const wrongKey = await keychain.challenge.generateKey();
    expect(async () => {
      await keychain.challenge.decryptChallenge(ciphertext, wrongKey, salt);
    }).rejects.toThrowError();
  });
});
