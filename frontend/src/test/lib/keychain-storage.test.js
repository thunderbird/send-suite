import { expect, describe, it } from 'vitest';
import { Keychain, Util } from '@/lib/keychain';

describe('RSA key storage', () => {
  it('Can store public/private keys', async () => {
    const keychain = new Keychain();
    await keychain.rsa.generateKeyPair();
    expect(async () => {
      await keychain.store();
    }).not.toThrowError();
  });
  it('Can load public/private keys', async () => {
    let keychain = new Keychain();
    await keychain.rsa.generateKeyPair();
    expect(keychain.rsa.publicKey).toBeTruthy();
    expect(keychain.rsa.privateKey).toBeTruthy();

    // store
    await keychain.store();

    // init a new keychain, load keys
    keychain = new Keychain();
    await keychain.load();
    expect(keychain.rsa.publicKey).toBeTruthy();
    expect(keychain.rsa.privateKey).toBeTruthy();
  });
  it('Preserves the integrity of the keys for unwrapping', async () => {
    let keychain = new Keychain();
    // generate a keypair
    const { publicKey } = await keychain.rsa.generateKeyPair();

    // store
    await keychain.store();
    // init a new keychain, load keys
    keychain = new Keychain();
    await keychain.load();

    // wrap a container key, using the original key
    const key = await keychain.container.generateContainerKey();
    const wrappedKeyStr = await keychain.rsa.wrapContainerKey(key, publicKey);

    // unwrap container key, using the loaded key
    const unwrappedKey = await keychain.rsa.unwrapContainerKey(wrappedKeyStr, keychain.rsa.privateKey);
    expect(await Util.compareKeys(key, unwrappedKey)).toBeTruthy();
  });
  it('Preserves the integrity of the keys for wrapping', async () => {
    let keychain = new Keychain();
    // generate a keypair
    const { privateKey } = await keychain.rsa.generateKeyPair();

    // store
    await keychain.store();
    // init a new keychain, load keys
    keychain = new Keychain();
    await keychain.load();

    // wrap a container key using the loaded key
    const key = await keychain.container.generateContainerKey();
    const wrappedKeyStr = await keychain.rsa.wrapContainerKey(key, keychain.rsa.publicKey);
    // unwrap container key using original key
    const unwrappedKey = await keychain.rsa.unwrapContainerKey(wrappedKeyStr, privateKey);
    expect(await Util.compareKeys(key, unwrappedKey)).toBeTruthy();
  });
});

describe('Container keys', () => {
  it('Can store and load container keys', async () => {
    let keychain = new Keychain();
    await keychain.rsa.generateKeyPair();
    const howMany = 3;
    const indexToCheck = Math.floor(Math.random() * howMany);
    for (let i = 0; i < howMany; i++) {
      await keychain.add(i, await keychain.container.generateContainerKey());
    }
    // get the 0th key before we reinitialize the keychain
    const key = await keychain.get(indexToCheck);
    await keychain.store();

    // intantiate new keychain, load keys from storage
    keychain = new Keychain();
    await keychain.load();

    expect(keychain.count()).toBe(howMany);
    const storedKey = await keychain.get(indexToCheck);
    expect(await Util.compareKeys(key, storedKey)).toBeTruthy();
  });
});
