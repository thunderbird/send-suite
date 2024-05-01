import { JwkKeyPair, KeyStore } from '@/types';
import { Storage } from './storage';

// Bring in node crypto for use with automated tests.
// When running in the browser, we use window.crypto
import nodeCrypto from 'crypto';

// Using a polyfill because TypeScript doesn't think the
// Node.js version is callable, despite it having worked
// in manual and automated tests prior to changing from .js to .ts
import getRandomValues from 'get-random-values';

let crypto: Crypto | typeof nodeCrypto = nodeCrypto;

try {
  crypto = window.crypto;
} catch (e) {
  // fall back to nodeCrypto
}

async function generateAesGcmKey(): Promise<CryptoKey> {
  try {
    const key = await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true, // allow exporting keys
      ['encrypt', 'decrypt']
    );
    return key;
  } catch (err) {
    console.error(err);
  }
}

class Content {
  async generateKey(): Promise<CryptoKey> {
    return await generateAesGcmKey();
  }
}

class Container {
  async generateContainerKey(): Promise<CryptoKey> {
    try {
      const key = await crypto.subtle.generateKey(
        {
          name: 'AES-KW',
          length: 256,
        },
        true,
        ['wrapKey', 'unwrapKey']
      );
      return key;
    } catch (err) {
      console.error(err);
    }
  }

  // Wrap an AES-GCM (content) key
  async wrapContentKey(
    key: CryptoKey,
    wrappingKey: CryptoKey
  ): Promise<string> {
    const wrappedKey = await crypto.subtle.wrapKey(
      'raw',
      key,
      wrappingKey,
      'AES-KW'
    );
    // Convert buffer to string for easy storage
    const wrappedKeyStr = Util.arrayBufferToBase64(wrappedKey);
    return wrappedKeyStr;
  }

  // Unwrap an AES-GCM (content) key
  async unwrapContentKey(
    wrappedKeyStr: string,
    wrappingKey: CryptoKey
  ): Promise<CryptoKey> {
    const buf = Util.base64ToArrayBuffer(wrappedKeyStr);
    return await crypto.subtle.unwrapKey(
      'raw',
      buf,
      wrappingKey,
      'AES-KW',
      'AES-GCM',
      true,
      ['encrypt', 'decrypt']
    );
  }
}

class Password {
  async _wrap(
    keyToWrap: CryptoKey,
    password: string,
    salt: BufferSource
  ): Promise<string> {
    // Derive key using the password and the salt.
    const keyMaterial = await getKeyMaterial(password);
    const wrappingKey = await getKey(keyMaterial, salt);

    const wrappedKey = await crypto.subtle.wrapKey(
      'raw',
      keyToWrap,
      wrappingKey,
      'AES-KW'
    );
    // Transferring buffer to string to ease the storage
    const wrappedKeyStr = Util.arrayBufferToBase64(wrappedKey);

    return wrappedKeyStr;
  }
  async _unwrap(
    wrappedKeyStr: string,
    password: string,
    salt: BufferSource,
    algorithm: AlgorithmIdentifier,
    permissions: KeyUsage[]
  ) {
    // Derive key using the password and the salt.
    const unwrappingKey = await getUnwrappingKey(password, salt);
    return crypto.subtle.unwrapKey(
      'raw', // import format
      Util.base64ToArrayBuffer(wrappedKeyStr), // ArrayBuffer representing key to unwrap
      unwrappingKey, // CryptoKey representing key encryption key
      'AES-KW', // algorithm identifier for key encryption key
      algorithm, //, // algorithm identifier for key to unwrap
      true, // extractability of key to unwrap
      permissions // // key usages for key to unwrap
    );
  }

  async wrapContainerKey(
    keyToWrap: CryptoKey,
    password: string,
    salt: BufferSource
  ): Promise<string> {
    return await this._wrap(keyToWrap, password, salt);
  }

  async unwrapContainerKey(
    wrappedKeyStr: string,
    password: string,
    salt: BufferSource
  ): Promise<CryptoKey> {
    return await this._unwrap(wrappedKeyStr, password, salt, 'AES-KW', [
      'wrapKey',
      'unwrapKey',
    ]);
  }
  async wrapContentKey(
    keyToWrap: CryptoKey,
    password: string,
    salt: BufferSource
  ): Promise<string> {
    return await this._wrap(keyToWrap, password, salt);
  }

  async unwrapContentKey(
    wrappedKeyStr: string,
    password: string,
    salt: BufferSource
  ): Promise<CryptoKey> {
    return await this._unwrap(wrappedKeyStr, password, salt, 'AES-GCM', [
      'encrypt',
      'decrypt',
    ]);
  }
}

class Rsa {
  publicKey: CryptoKey;
  privateKey: CryptoKey;

  async generateKeyPair(): Promise<Record<string, CryptoKey>> {
    const { publicKey, privateKey } = await crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048, //can be 1024, 2048, or 4096
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256', //can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
      },
      true, //whether the key is extractable (i.e., can be used in exportKey)
      ['wrapKey', 'unwrapKey'] //can be any combination of "encrypt", "decrypt", "wrapKey", or "unwrapKey"
    );

    this.publicKey = publicKey;
    this.privateKey = privateKey;

    return { publicKey, privateKey };
  }

  async getPublicKeyJwk(): Promise<string> {
    if (!this.publicKey) {
      return null;
    }
    const jwk = await rsaToJsonWebKey(this.publicKey);
    return JSON.stringify(jwk);
  }

  async getPrivateKeyJwk(): Promise<string> {
    if (!this.privateKey) {
      return null;
    }
    const jwk = await rsaToJsonWebKey(this.privateKey);
    return JSON.stringify(jwk);
  }

  async setPrivateKeyFromJwk(jwk: string): Promise<void> {
    this.privateKey = await jwkToRsa(jwk);
  }

  async setPublicKeyFromJwk(jwk: string): Promise<void> {
    this.publicKey = await jwkToRsa(jwk);
  }

  // Wraps an AES-KW (container) key
  // Returns a string version of key
  async wrapContainerKey(
    aesKey: CryptoKey,
    publicKey: CryptoKey
  ): Promise<string> {
    const wrappedKey = await crypto.subtle.wrapKey('jwk', aesKey, publicKey, {
      // Wrapping details
      name: 'RSA-OAEP',
      // hash: { name: 'SHA-256' },
    });

    // Transferring buffer to string to ease the storage
    const wrappedKeyStr = Util.arrayBufferToBase64(wrappedKey);

    return wrappedKeyStr;
  }

  // Unwraps an AES-KW (container) key
  async unwrapContainerKey(
    wrappedKeyStr: string,
    privateKey: CryptoKey
  ): Promise<CryptoKey> {
    const unwrappedKey = await crypto.subtle.unwrapKey(
      'jwk', // The format of the key to be unwrapped
      Util.base64ToArrayBuffer(wrappedKeyStr), // The wrapped key
      privateKey, // RSA private key
      {
        // Unwrapping details
        name: 'RSA-OAEP',
        // hash: { name: 'SHA-256' },
      },
      {
        // The algorithm details of the key
        name: 'AES-KW',
        length: 256,
      },
      true, // Whether the key can be extracted
      ['wrapKey', 'unwrapKey'] // Usage of the key
    );

    return unwrappedKey;
  }
}

class Challenge {
  createChallenge(length = 128): string {
    return Util.arrayBufferToBase64(Util.generateSalt(128));
  }

  async generateKey(): Promise<CryptoKey> {
    return await generateAesGcmKey();
  }

  async encryptChallenge(
    challengePlaintext: string,
    key: CryptoKey,
    salt: BufferSource
  ) {
    const textEncoder = new TextEncoder();
    const arrayBuffer = textEncoder.encode(challengePlaintext);

    const ciphertextBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: salt },
      key,
      arrayBuffer
    );

    return Util.arrayBufferToBase64(ciphertextBuffer);
  }

  async decryptChallenge(
    challengeCiphertext: string,
    key: CryptoKey,
    salt: BufferSource
  ): Promise<string> {
    const arrayBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: salt },
      key,
      Util.base64ToArrayBuffer(challengeCiphertext)
    );
    const textDecoder = new TextDecoder();
    return textDecoder.decode(arrayBuffer);
  }
}

class Backup {
  async generateKey(): Promise<CryptoKey> {
    return await generateAesGcmKey();
  }

  async encryptBackup(
    plaintext: string,
    key: CryptoKey,
    salt: BufferSource
  ): Promise<string> {
    const textEncoder = new TextEncoder();
    const arrayBuffer = textEncoder.encode(plaintext);

    const ciphertextBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: salt },
      key,
      arrayBuffer
    );

    return Util.arrayBufferToBase64(ciphertextBuffer);
  }

  async decryptBackup(
    ciphertext: string,
    key: CryptoKey,
    salt: BufferSource
  ): Promise<string> {
    const arrayBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: salt },
      key,
      Util.base64ToArrayBuffer(ciphertext)
    );
    const textDecoder = new TextDecoder();
    return textDecoder.decode(arrayBuffer);
  }
}

// Should I rename this to KeyManager?
export class Keychain {
  content: Content;
  container: Container;
  password: Password;
  rsa: Rsa;
  challenge: Challenge;
  backup: Backup;
  _keys: KeyStore;
  private _storage: Storage;
  constructor(storage: Storage) {
    this._init(storage);
  }

  // A separate _init() allows us to scrub the current keychain
  // and start with a fresh one.
  _init(storage?: Storage) {
    this.content = new Content();
    this.container = new Container();
    this.password = new Password();
    this.rsa = new Rsa();
    this.challenge = new Challenge();
    this.backup = new Backup();

    this._keys = {};
    this._storage = storage ?? new Storage();
  }

  get keys() {
    return {
      ...this._keys,
    };
  }

  set keys(keyObj) {
    this._keys = keyObj;
  }

  count(): number {
    return Object.keys(this._keys).length;
  }

  async add(id: number, key: CryptoKey) {
    if (!this.rsa.publicKey) {
      throw Error('Missing public key, required for wrapping AES key');
    }

    const wrappedKeyStr = await this.rsa.wrapContainerKey(
      key,
      this.rsa.publicKey
    );
    this._keys[id] = wrappedKeyStr;
  }

  async get(id: number): Promise<CryptoKey> {
    const wrappedKeyStr = this._keys[id];
    if (!wrappedKeyStr) {
      throw Error('Key does not exist');
    }
    const unwrappedKey = await this.rsa.unwrapContainerKey(
      wrappedKeyStr,
      this.rsa.privateKey
    );
    return unwrappedKey;
  }

  remove(id: number): void {
    delete this._keys[id];
    // const index = `${prefix}${id}`;
    // this.storage.remove(index);
  }

  async newKeyForContainer(id: number): Promise<void> {
    const key = await this.container.generateContainerKey();
    console.log(`adding key for container id ${id}`);
    await this.add(id, key);
  }

  async exportKeypair(): Promise<JwkKeyPair> {
    // these need conversion to jwk (JSON strings)
    const keysObj = {
      publicKey: await this.rsa.getPublicKeyJwk(),
      privateKey: await this.rsa.getPrivateKeyJwk(),
    };

    return { ...keysObj };
  }

  async exportKeys() {
    return { ...this.keys };
  }

  async store(): Promise<void> {
    // store public/private keys
    await this._storage.storeKeypair(await this.exportKeypair());

    // store other keys
    await this._storage.storeKeys(await this.exportKeys());
  }

  async fallbackToStoredKeypair(keypair: JwkKeyPair) {
    // load public/private keys
    if (!keypair) {
      keypair = await this._storage.loadKeypair();
    }

    return keypair;
  }

  async fallbackToStoredKeys(keys: Record<number, string>) {
    if (!keys) {
      keys = await this._storage.loadKeys();
    }
    return keys;
  }

  async load(
    keypairStr?: JwkKeyPair,
    keys?: Record<number, string>
  ): Promise<boolean> {
    try {
      // load keypair jwk
      const { publicKey, privateKey } = await this.fallbackToStoredKeypair(
        keypairStr
      );

      // set from jwk
      await this.rsa.setPrivateKeyFromJwk(privateKey);
      await this.rsa.setPublicKeyFromJwk(publicKey);

      // load other keys
      this.keys = await this.fallbackToStoredKeys(keys);
      return true;
    } catch (e) {
      console.log(`No keychain in storage`);
      return false;
    }
  }

  async generateBackupKey(): Promise<CryptoKey> {
    return await generateAesGcmKey();
  }
}

export class Util {
  static generateSalt(size = 16): Uint8Array {
    const salt = getRandomValues(new Uint8Array(size));

    return salt;
  }

  static generateRandomPassword(size = 16): string {
    return this.arrayBufferToBase64(this.generateSalt(size));
  }

  static async compareKeys(k1: CryptoKey, k2: CryptoKey): Promise<boolean> {
    const originalAESBase64 = await exportKeyToBase64(k1);
    const unwrappedAESBase64 = await exportKeyToBase64(k2);
    return originalAESBase64 === unwrappedAESBase64;
  }

  static arrayBufferToBase64(arrayBuffer: ArrayBuffer | Uint8Array): string {
    const byteArray = new Uint8Array(arrayBuffer);
    const byteString = String.fromCharCode(...byteArray);
    return btoa(encodeURIComponent(byteString));
  }

  static base64ToArrayBuffer(base64: string): ArrayBufferLike {
    const byteString = decodeURIComponent(atob(base64));
    const byteArray = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      byteArray[i] = byteString.charCodeAt(i);
    }
    return byteArray.buffer;
  }
}

// Utility functions for working with password-based keys
// ========================================================================
/*
Get some key material to use as input to the deriveKey method.
The key material is a password supplied by the user.
*/
function getKeyMaterial(password: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
}

/*
Given some key material and a random salt,
derive an AES-KW key using PBKDF2.
*/
function getKey(
  keyMaterial: CryptoKey,
  salt: BufferSource
): Promise<CryptoKey> {
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-KW', length: 256 },
    true,
    ['wrapKey', 'unwrapKey']
  );
}

/*
Derive an AES-KW key using PBKDF2.
*/
async function getUnwrappingKey(
  password: string,
  salt: BufferSource
): Promise<CryptoKey> {
  // get the key material (user-supplied password)
  const keyMaterial = await getKeyMaterial(password);

  // derive the key from key material and salt
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-KW', length: 256 },
    true,
    ['wrapKey', 'unwrapKey']
  );
}

// Conversion functions
// ========================================================================
async function rsaToJsonWebKey(key: CryptoKey): Promise<JsonWebKey> {
  return await crypto.subtle.exportKey('jwk', key);
}

function toJsonWebKey(jwk: string | JsonWebKey): JsonWebKey {
  if (typeof jwk === 'string') {
    return JSON.parse(jwk);
  }
  return jwk;
}

async function jwkToRsa(jwk: string | JsonWebKey) {
  jwk = toJsonWebKey(jwk);
  return await crypto.subtle.importKey(
    'jwk',
    jwk,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    (jwk.key_ops || []) as KeyUsage[]
  );
}

// Used for Util.compareKeys()
// ========================================================================
async function exportKeyToBase64(key: CryptoKey): Promise<string> {
  // Export the key as 'raw'
  const keyBuffer = await crypto.subtle.exportKey('raw', key);
  // Convert the buffer to base64 for easy comparison
  const keyBase64 = Util.arrayBufferToBase64(keyBuffer);
  return keyBase64;
}
