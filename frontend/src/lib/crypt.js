// import { Buffer } from 'buffer';
import base64js from 'base64-js';

const prefix = 'send-keychain/';
const pubPrefix = 'send-pub';
const privPrefix = 'send-priv';

export class Keychain {
  constructor(storage) {
    this.storage = storage;
    this.keys = {};
    this._onloadArray = [];
  }

  status() {
    console.log(`
publicKey: ${this.publicKey}
privateKey: ${this.privateKey}`);
    this.showKeys();
  }
  showKeys() {
    const ids = Object.keys(this.keys);
    if (ids.length === 0) {
      console.log('no keys');
      return;
    }
    ids.forEach((id) => {
      Object.keys(this.keys).forEach((k) => {
        console.log(`\t${k}: ${this.keys[k]}`);
      });
    });
  }

  setUserKeyPair(publicKey, privateKey) {
    console.log(`only use this when first creating a user`);
    console.log(`don't forget to .store() to localStorage immediately`);

    this.privateKey = privateKey;
    this.publicKey = publicKey;
  }

  async generateUserKeyPair() {
    console.log(`only use this when first creating a user`);
    console.log(`don't forget to .store() to localStorage immediately`);

    const keyPair = await generateRSAKeyPair();
    this.publicKey = keyPair.publicKey;
    this.privateKey = keyPair.privateKey;
  }

  async createAndAddContainerKey(id) {
    // AES key is for encrypting/decrypting messages and files
    // in a container (i.e., a folder or conversation)
    const aesKey = await generateAESKey();

    await this.add(id, aesKey);
  }

  async addOnload(cb) {
    if (typeof cb === 'function') {
      this._onloadArray.push(cb);
    }
  }

  async load() {
    if (!this.storage) {
      console.log(`no storage`);
      return;
    }

    if (!this.storage.get(privPrefix)) {
      throw Error('No private key; cannot wrap other keys');
      return;
    }

    console.log('loading from localStorage');
    // Load User keys
    const publicKeyJwk = this.storage.get(pubPrefix);
    const privateKeyJwk = this.storage.get(privPrefix);

    this.publicKey = await crypto.subtle.importKey(
      'jwk',
      publicKeyJwk,
      {
        name: 'RSA-OAEP',
        hash: { name: 'SHA-256' },
      },
      true,
      ['wrapKey']
    );

    this.privateKey = await crypto.subtle.importKey(
      'jwk',
      privateKeyJwk,
      {
        name: 'RSA-OAEP',
        hash: { name: 'SHA-256' },
      },
      true,
      ['unwrapKey']
    );

    this.keys = {};

    for (let k of this.storage.keys()) {
      if (k.startsWith(prefix)) {
        const [_, id] = k.split('/');
        const val = this.storage.get(k);
        if (val) {
          // The key is already wrapped.
          // We set it as-is in this.keys[id]
          this.keys[id] = val;
        }
      }
    }

    console.log(`Running this._onloadArray callbacks`);
    this._onloadArray.forEach((fn) => fn());
  }

  async store() {
    if (!this.storage) {
      console.log(`no storage`);
      return;
    }

    if (!this.privateKey) {
      throw Error('No private key; cannot wrap other keys');
    }

    const publicKeyJwk = await rsaToJwk(this.publicKey);
    const privateKeyJwk = await rsaToJwk(this.privateKey);

    this.storage.set(pubPrefix, publicKeyJwk);
    this.storage.set(privPrefix, privateKeyJwk);

    // store items from this.keys individually
    Object.keys(this.keys).forEach(async (id) => {
      // Do not use `.get(id)` to keep the key wrapped.
      const key = this.keys[id];
      const index = `${prefix}${id}`;
      // Store the wrapped it as-is.
      this.storage.set(index, key);
    });
  }

  clear() {
    this.storage.remove(pubPrefix);
    this.storage.remove(privPrefix);
  }

  async add(id, key) {
    if (!this.publicKey) {
      throw Error('Missing public key, required for wrapping aes key');
    }

    this.keys[id] = await wrapAESKey(key, this.publicKey);
  }

  async get(id) {
    // unwrap key using private key
    const wrappedKey = this.keys[id];
    if (!wrappedKey) {
      throw Error('Key does not exist');
      // return null;
    }

    return await unwrapAESKey(wrappedKey, this.privateKey);
  }

  async getUserPublicKeyJwk() {
    const publicKeyJwk = await rsaToJwk(this.publicKey);
    return publicKeyJwk;
  }

  async getAndWrapContainerKey(id, publicKey) {
    const aesKey = await this.get(id);
    return await wrapAESKey(aesKey, publicKey);
  }

  async unwrapAndStoreContainerKey(wrappedKey, containerId) {
    const aesKey = await unwrapAESKey(
      base64ToArrayBuffer(wrappedKey),
      this.privateKey
    );
    this.add(containerId, aesKey);
  }

  remove(id) {
    delete this.keys[id];
    const index = `${prefix}${id}`;
    this.storage.remove(index);
  }
}

export async function generateRSAKeyPair() {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048, //can be 1024, 2048, or 4096
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256', //can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
    },
    true, //whether the key is extractable (i.e., can be used in exportKey)
    ['wrapKey', 'unwrapKey'] //can be any combination of "encrypt", "decrypt", "wrapKey", or "unwrapKey"
  );

  return keyPair;
}

export async function generateAESKey() {
  try {
    const key = await window.crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256, // can be  128, 192, or 256
      },
      true, // so we can export
      ['encrypt', 'decrypt']
    );
    return key;
  } catch (err) {
    console.error(err);
  }
}

export async function wrapAESKey(aesKey, publicKey) {
  const wrappedKey = await window.crypto.subtle.wrapKey(
    'jwk',
    aesKey,
    publicKey,
    {
      // Wrapping details
      name: 'RSA-OAEP',
      hash: { name: 'SHA-256' },
    }
  );

  // Transferring buffer to string to ease the storage
  const wrappedKeyStr = arrayBufferToBase64(wrappedKey);

  return wrappedKeyStr;
}

export async function unwrapAESKey(wrappedAESKey, privateKey) {
  const unwrappedKey = await window.crypto.subtle.unwrapKey(
    'jwk', // The format of the key to be unwrapped
    base64ToArrayBuffer(wrappedAESKey), // The wrapped key
    privateKey, // RSA private key
    {
      // Unwrapping details
      name: 'RSA-OAEP',
      hash: { name: 'SHA-256' },
    },
    {
      // The algorithm details of the key
      name: 'AES-GCM',
      length: 256,
    },
    true, // Whether the key can be extracted
    ['encrypt', 'decrypt'] // Usage of the key
  );

  return unwrappedKey;
}

export async function rsaToJwk(key) {
  return await crypto.subtle.exportKey('jwk', key);
}

// // Encoding function
// export function arrayBufferToBase64(buf) {
//   var bufferInstance = Buffer.from(buf);
//   return bufferInstance.toString('base64');
// }

// // Decoding function
// export function base64ToArrayBuffer(base64Str) {
//   var bufferInstance = Buffer.from(base64Str, 'base64');
//   return Uint8Array.from(bufferInstance).buffer;
// }

// // Encoding function
// export function arrayBufferToBase64(arrayBuffer) {
//   // const byteArray = new Uint8Array(arrayBuffer);
//   // const byteString = String.fromCharCode(...byteArray);
//   // return btoa(encodeURIComponent(byteString));
//   return base64js.fromByteArray(arrayBuffer);
// }

// // Decoding function
// export function base64ToArrayBuffer(base64) {
//   // const byteString = decodeURIComponent(atob(base64));
//   // const byteArray = new Uint8Array(byteString.length);
//   // for (let i = 0; i < byteString.length; i++) {
//   //   byteArray[i] = byteString.charCodeAt(i);
//   // }
//   // return byteArray.buffer;
//   return base64js.toByteArray(base64);
// }

export function arrayBufferToBase64(arrayBuffer) {
  const byteArray = new Uint8Array(arrayBuffer);
  const byteString = String.fromCharCode(...byteArray);
  return btoa(encodeURIComponent(byteString));
}

// Decoding function
export function base64ToArrayBuffer(base64) {
  const byteString = decodeURIComponent(atob(base64));
  const byteArray = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    byteArray[i] = byteString.charCodeAt(i);
  }
  return byteArray.buffer;
}

function bytesToArrayBuffer(bytes) {
  const bytesAsArrayBuffer = new ArrayBuffer(bytes.length);
  const bytesUint8 = new Uint8Array(bytesAsArrayBuffer);
  bytesUint8.set(bytes);
  return bytesAsArrayBuffer;
}

export async function exportKeyToBase64(key) {
  // Export the key as 'raw'
  const keyBuffer = await window.crypto.subtle.exportKey('raw', key);
  // Convert the buffer to base64 for easy comparison
  const keyBase64 = arrayBufferToBase64(keyBuffer);
  return keyBase64;
}

export async function compareKeys(k1, k2) {
  const originalAESBase64 = await exportKeyToBase64(k1);
  const unwrappedAESBase64 = await exportKeyToBase64(k2);
  return originalAESBase64 === unwrappedAESBase64;
}

export function generateSalt(size = 16) {
  // const saltBuffer = window.crypto.getRandomValues(new Uint8Array(length));
  // // Convert the salt ArrayBuffer to Base64.
  // return arrayBufferToBase64(saltBuffer);
  let salt = window.crypto.getRandomValues(new Uint8Array(size));

  return salt;
}

/*
Get some key material to use as input to the deriveKey method.
The key material is a password supplied by the user.
*/
function getKeyMaterial(password) {
  const enc = new TextEncoder();
  return window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
}

/*
Given some key material and some random salt
derive an AES-KW key using PBKDF2.
*/
function getKey(keyMaterial, salt) {
  return window.crypto.subtle.deriveKey(
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
  return window.crypto.subtle.deriveKey(
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
Wrap the given key.
*/
export async function passwordWrapAESKey(keyToWrap, password, salt) {
  // get the key encryption key
  const keyMaterial = await getKeyMaterial(password);
  // let salt = window.crypto.getRandomValues(new Uint8Array(16));
  const wrappingKey = await getKey(keyMaterial, salt);

  return window.crypto.subtle.wrapKey('raw', keyToWrap, wrappingKey, 'AES-KW');
}

export async function passwordUnwrapAESKey(wrappedKey, password, salt) {
  // 1. get the unwrapping key
  const unwrappingKey = await getUnwrappingKey(password, salt);
  // 2. initialize the wrapped key
  // const wrappedKeyBuffer = base64ToArrayBuffer(wrappedKey);
  // const wrappedKeyBuffer = bytesToArrayBuffer(wrappedKey);

  // 3. unwrap the key
  return window.crypto.subtle.unwrapKey(
    'raw', // import format
    wrappedKey, // ArrayBuffer representing key to unwrap
    unwrappingKey, // CryptoKey representing key encryption key
    'AES-KW', // algorithm identifier for key encryption key
    'AES-GCM', // algorithm identifier for key to unwrap
    true, // extractability of key to unwrap
    ['encrypt', 'decrypt'] // key usages for key to unwrap
  );
}

export async function aesEncryptChallenge(challengePlaintext, key, iv) {
  const textEncoder = new TextEncoder();
  const arrayBuffer = textEncoder.encode(challengePlaintext);

  return await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    arrayBuffer
  );
}
export async function aesDecryptChallenge(challengeCiphertext, key, iv) {
  const arrayBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    challengeCiphertext
  );
  const textDecoder = new TextDecoder();
  return textDecoder.decode(arrayBuffer);
  // return arrayBuffer;
}

/*
Generate an encrypt/decrypt secret key,
then wrap it.
*/
// window.crypto.subtle
//   .generateKey(
//     {
//       name: "AES-GCM",
//       length: 256,
//     },
//     true,
//     ["encrypt", "decrypt"],
//   )
//   .then((secretKey) => wrapCryptoKey(secretKey))
//   .then((wrappedKey) => console.log(wrappedKey));
