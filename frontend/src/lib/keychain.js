//
import crypto from 'crypto';

class Upload {
  async generateKey() {
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
}

class Container {
  async generateWrappingKey() {
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

  async wrap(key, wrappingKey) {
    return await crypto.subtle.wrapKey('raw', key, wrappingKey, 'AES-KW');
  }

  async unwrap(wrappedKey, wrappingKey) {
    return await crypto.subtle.unwrapKey(
      'raw',
      wrappedKey,
      wrappingKey,
      'AES-KW',
      'AES-GCM',
      true,
      ['encrypt', 'decrypt']
    );
  }
}

class Password {
  /*
Wrap the given key.
*/
  async wrap(keyToWrap, password, salt) {
    // get the key encryption key
    const keyMaterial = await getKeyMaterial(password);
    const wrappingKey = await getKey(keyMaterial, salt);

    return crypto.subtle.wrapKey('raw', keyToWrap, wrappingKey, 'AES-KW');
  }

  async unwrap(wrappedKey, password, salt) {
    // 1. get the unwrapping key
    const unwrappingKey = await getUnwrappingKey(password, salt);
    // 2. initialize the wrapped key
    // const wrappedKeyBuffer = base64ToArrayBuffer(wrappedKey);
    // const wrappedKeyBuffer = bytesToArrayBuffer(wrappedKey);

    // 3. unwrap the key
    return crypto.subtle.unwrapKey(
      'raw', // import format
      wrappedKey, // ArrayBuffer representing key to unwrap
      unwrappingKey, // CryptoKey representing key encryption key
      'AES-KW', // algorithm identifier for key encryption key
      'AES-GCM', // algorithm identifier for key to unwrap
      true, // extractability of key to unwrap
      ['encrypt', 'decrypt'] // key usages for key to unwrap
    );
  }
}

class Rsa {
  async generateKeyPair() {
    const keyPair = await crypto.subtle.generateKey(
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

  // Returns a string version of key
  async wrapKey(aesKey, publicKey) {
    const wrappedKey = await crypto.subtle.wrapKey('jwk', aesKey, publicKey, {
      // Wrapping details
      name: 'RSA-OAEP',
      hash: { name: 'SHA-256' },
    });

    // Transferring buffer to string to ease the storage
    const wrappedKeyStr = arrayBufferToBase64(wrappedKey);

    return wrappedKeyStr;
  }

  async unwrapKey(wrappedKeyStr, privateKey) {
    const unwrappedKey = await crypto.subtle.unwrapKey(
      'jwk', // The format of the key to be unwrapped
      base64ToArrayBuffer(wrappedKeyStr), // The wrapped key
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

// Should I rename this to KeyManager?
export class Keychain {
  constructor() {
    // also, I feel like "Upload" isn't a good name
    // b/c though it's called an 'upload'...it's a StoredItem or something...
    this.upload = new Upload();
    this.container = new Container();
    this.password = new Password();
    this.rsa = new Rsa();
  }
}

export class Util {
  static generateSalt(size = 16) {
    let salt = crypto.getRandomValues(new Uint8Array(size));

    return salt;
  }

  static async compareKeys(k1, k2) {
    const originalAESBase64 = await exportKeyToBase64(k1);
    const unwrappedAESBase64 = await exportKeyToBase64(k2);
    return originalAESBase64 === unwrappedAESBase64;
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
  return crypto.subtle.importKey(
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

function arrayBufferToBase64(arrayBuffer) {
  const byteArray = new Uint8Array(arrayBuffer);
  const byteString = String.fromCharCode(...byteArray);
  return btoa(encodeURIComponent(byteString));
}

export function base64ToArrayBuffer(base64) {
  const byteString = decodeURIComponent(atob(base64));
  const byteArray = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    byteArray[i] = byteString.charCodeAt(i);
  }
  return byteArray.buffer;
}

// Used for Util.compareKeys()
// ========================================================================
async function exportKeyToBase64(key) {
  // Export the key as 'raw'
  const keyBuffer = await crypto.subtle.exportKey('raw', key);
  // Convert the buffer to base64 for easy comparison
  const keyBase64 = arrayBufferToBase64(keyBuffer);
  return keyBase64;
}
