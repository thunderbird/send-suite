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

export class Keychain {
  constructor() {
    this.upload = new Upload();
    this.container = new Container();
  }

  static async compareKeys(k1, k2) {
    const originalAESBase64 = await exportKeyToBase64(k1);
    const unwrappedAESBase64 = await exportKeyToBase64(k2);
    return originalAESBase64 === unwrappedAESBase64;
  }
}

function arrayBufferToBase64(arrayBuffer) {
  const byteArray = new Uint8Array(arrayBuffer);
  const byteString = String.fromCharCode(...byteArray);
  return btoa(encodeURIComponent(byteString));
}

async function exportKeyToBase64(key) {
  // Export the key as 'raw'
  const keyBuffer = await crypto.subtle.exportKey('raw', key);
  // Convert the buffer to base64 for easy comparison
  const keyBase64 = arrayBufferToBase64(keyBuffer);
  return keyBase64;
}
