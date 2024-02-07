import { Storage } from './storage';

// When running automated tests, use crypto module instead of `window.crypto`
import nodeCrypto from 'crypto';
let crypto = nodeCrypto;
try {
  crypto = window.crypto;
} catch (e) {
  // console.log(`using node crypto module`);
}

async function generateAesGcmKey() {
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
  async generateKey() {
    return await generateAesGcmKey();
  }
}

class Container {
  async generateContainerKey() {
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
  async wrapContentKey(key, wrappingKey) {
    const wrappedKey = await crypto.subtle.wrapKey('raw', key, wrappingKey, 'AES-KW');
    // Transferring buffer to string to ease the storage
    const wrappedKeyStr = Util.arrayBufferToBase64(wrappedKey);
    return wrappedKeyStr;
  }

  // Unwrap an AES-GCM (content) key
  async unwrapContentKey(wrappedKeyStr, wrappingKey) {
    const buf = Util.base64ToArrayBuffer(wrappedKeyStr);
    return await crypto.subtle.unwrapKey('raw', buf, wrappingKey, 'AES-KW', 'AES-GCM', true, ['encrypt', 'decrypt']);
  }
}

class Password {
  async _wrap(keyToWrap, password, salt) {
    // Derive key using the password and the salt.
    const keyMaterial = await getKeyMaterial(password);
    const wrappingKey = await getKey(keyMaterial, salt);

    const wrappedKey = await crypto.subtle.wrapKey('raw', keyToWrap, wrappingKey, 'AES-KW');
    // Transferring buffer to string to ease the storage
    const wrappedKeyStr = Util.arrayBufferToBase64(wrappedKey);

    return wrappedKeyStr;
  }
  async _unwrap(wrappedKeyStr, password, salt, algorithm, permissions) {
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

  async wrapContainerKey(keyToWrap, password, salt) {
    return await this._wrap(keyToWrap, password, salt);
  }

  async unwrapContainerKey(wrappedKeyStr, password, salt) {
    return await this._unwrap(wrappedKeyStr, password, salt, 'AES-KW', ['wrapKey', 'unwrapKey']);
  }
  async wrapContentKey(keyToWrap, password, salt) {
    return await this._wrap(keyToWrap, password, salt);
  }

  async unwrapContentKey(wrappedKeyStr, password, salt) {
    return await this._unwrap(wrappedKeyStr, password, salt, 'AES-GCM', ['encrypt', 'decrypt']);
  }
}

class Rsa {
  async generateKeyPair() {
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

  async getPublicKeyJwk() {
    if (!this.publicKey) {
      return null;
    }
    const jwk = await rsaToJwk(this.publicKey);
    return JSON.stringify(jwk);
    // return jwk;
  }

  async getPrivateKeyJwk() {
    if (!this.privateKey) {
      return null;
    }
    const jwk = await rsaToJwk(this.privateKey);
    return JSON.stringify(jwk);
  }

  async setPrivateKeyFromJwk(jwk) {
    this.privateKey = await jwkToRsa(jwk);
  }

  async setPublicKeyFromJwk(jwk) {
    this.publicKey = await jwkToRsa(jwk);
  }

  // Wraps an AES-KW (container) key
  // Returns a string version of key
  async wrapContainerKey(aesKey, publicKey) {
    const wrappedKey = await crypto.subtle.wrapKey('jwk', aesKey, publicKey, {
      // Wrapping details
      name: 'RSA-OAEP',
      hash: { name: 'SHA-256' },
    });

    // Transferring buffer to string to ease the storage
    const wrappedKeyStr = Util.arrayBufferToBase64(wrappedKey);

    return wrappedKeyStr;
  }

  // Unwraps an AES-KW (container) key
  async unwrapContainerKey(wrappedKeyStr, privateKey) {
    const unwrappedKey = await crypto.subtle.unwrapKey(
      'jwk', // The format of the key to be unwrapped
      Util.base64ToArrayBuffer(wrappedKeyStr), // The wrapped key
      privateKey, // RSA private key
      {
        // Unwrapping details
        name: 'RSA-OAEP',
        hash: { name: 'SHA-256' },
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
  createChallenge(length = 128) {
    return Util.arrayBufferToBase64(Util.generateSalt(128));
  }

  async generateKey() {
    return await generateAesGcmKey();
  }

  async encryptChallenge(challengePlaintext, key, salt) {
    const textEncoder = new TextEncoder();
    const arrayBuffer = textEncoder.encode(challengePlaintext);

    const ciphertextBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: salt }, key, arrayBuffer);

    return Util.arrayBufferToBase64(ciphertextBuffer);
  }

  async decryptChallenge(challengeCiphertext, key, salt) {
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
  async generateKey() {
    return await generateAesGcmKey();
  }

  async encryptBackup(plaintext, key, salt) {
    const textEncoder = new TextEncoder();
    const arrayBuffer = textEncoder.encode(plaintext);

    const ciphertextBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: salt }, key, arrayBuffer);

    return Util.arrayBufferToBase64(ciphertextBuffer);
  }

  async decryptBackup(ciphertext, key, salt) {
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
  constructor(storage) {
    this._init(storage);
  }

  _init(storage) {
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

  count() {
    return Object.keys(this._keys).length;
  }

  async add(id, key) {
    if (!this.rsa.publicKey) {
      throw Error('Missing public key, required for wrapping AES key');
    }

    const wrappedKeyStr = await this.rsa.wrapContainerKey(key, this.rsa.publicKey);
    this._keys[id] = wrappedKeyStr;
  }

  async get(id) {
    const wrappedKeyStr = this._keys[id];
    if (!wrappedKeyStr) {
      throw Error('Key does not exist');
    }
    const unwrappedKey = await this.rsa.unwrapContainerKey(wrappedKeyStr, this.rsa.privateKey);
    return unwrappedKey;
  }

  remove(id) {
    delete this._keys[id];
    // const index = `${prefix}${id}`;
    // this.storage.remove(index);
  }

  async newKeyForContainer(id) {
    const key = await this.container.generateContainerKey();
    console.log(`adding key for container id ${id}`);
    await this.add(id, key);
  }

  async exportKeypair() {
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

  async store() {
    // store public/private keys
    await this._storage.storeKeypair(await this.exportKeypair());

    // store other keys
    await this._storage.storeKeys(await this.exportKeys());
  }

  async importKeypair(keypair) {
    // load public/private keys
    if (!keypair) {
      keypair = await this._storage.loadKeypair();
    }

    return keypair;
  }

  async importKeys(keys) {
    if (!keys) {
      keys = await this._storage.loadKeys();
    }
    return keys;
  }

  async load(keypair, keys) {
    // load keypair jwk
    const { publicKey, privateKey } = await this.importKeypair(keypair);

    // set from jwk
    await this.rsa.setPrivateKeyFromJwk(privateKey);
    await this.rsa.setPublicKeyFromJwk(publicKey);

    // load other keys
    this.keys = await this.importKeys(keys);
  }

  async generateBackupKey() {
    return await generateAesGcmKey();
  }
}

export class Util {
  static generateSalt(size = 16) {
    let salt = crypto.getRandomValues(new Uint8Array(size));

    return salt;
  }

  static generateRandomPassword() {
    return this.arrayBufferToBase64(this.generateSalt(16));
  }

  static async compareKeys(k1, k2) {
    const originalAESBase64 = await exportKeyToBase64(k1);
    const unwrappedAESBase64 = await exportKeyToBase64(k2);
    return originalAESBase64 === unwrappedAESBase64;
  }

  static arrayBufferToBase64(arrayBuffer) {
    const byteArray = new Uint8Array(arrayBuffer);
    const byteString = String.fromCharCode(...byteArray);
    return btoa(encodeURIComponent(byteString));
  }

  static base64ToArrayBuffer(base64) {
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
function getKeyMaterial(password) {
  const enc = new TextEncoder();
  return crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits', 'deriveKey']);
}

/*
Given some key material and some random salt
derive an AES-KW key using PBKDF2.
*/
function getKey(keyMaterial, salt) {
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
async function getUnwrappingKey(password, salt) {
  // 1. get the key material (user-supplied password)
  const keyMaterial = await getKeyMaterial(password);
  // 2 initialize the salt parameter.
  // The salt must match the salt originally used to derive the key.
  // const saltBuffer = bytesToArrayBuffer(saltBytes);
  const saltBuffer = bytesToArrayBuffer(salt);

  // 3 derive the key from key material and salt
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
function bytesToArrayBuffer(bytes) {
  const bytesAsArrayBuffer = new ArrayBuffer(bytes.length);
  const bytesUint8 = new Uint8Array(bytesAsArrayBuffer);
  bytesUint8.set(bytes);
  return bytesAsArrayBuffer;
}

async function rsaToJwk(key) {
  return await crypto.subtle.exportKey('jwk', key);
}

async function jwkToRsa(jwk) {
  jwk = typeof jwk === 'string' ? JSON.parse(jwk) : jwk;
  return await crypto.subtle.importKey(
    'jwk',
    jwk,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    jwk.key_ops
  );
}

// Used for Util.compareKeys()
// ========================================================================
async function exportKeyToBase64(key) {
  // Export the key as 'raw'
  const keyBuffer = await crypto.subtle.exportKey('raw', key);
  // Convert the buffer to base64 for easy comparison
  const keyBase64 = Util.arrayBufferToBase64(keyBuffer);
  return keyBase64;
}
