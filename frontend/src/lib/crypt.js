const prefix = 'send-keychain/';
const pubPrefix = 'send-pub';
const privPrefix = 'send-priv';
export class Keychain {
  constructor(storage) {
    this.storage = storage;
    this.keys = {};
  }

  setKeyPair(publicKey, privateKey) {
    console.log(`only use this when first creating a user`);
    console.log(`don't forget to .store() to localStorage immediately`);

    this.privateKey = privateKey;
    this.publicKey = publicKey;
  }

  async generateKeyPair() {
    console.log(`only use this when first creating a user`);
    console.log(`don't forget to .store() to localStorage immediately`);

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
    // If you want to export your keys to handle them externally
    //const publicKey = await crypto.subtle.exportKey("spki", keyPair.publicKey);
    //const privateKey = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

    // return keyPair; // {publicKey, privateKey}
    this.publicKey = keyPair.publicKey;
    this.privateKey = keyPair.privateKey;
  }

  async createAndAddContainerKey(id) {
    if (!this.publicKey) {
      console.log(`no public key`);
      return;
    }
    if (!this.privateKey) {
      console.log(`no private key`);
      return;
    }

    const aesKey = await generateAESKey();
    this.add(id, aesKey);
  }

  async load() {
    if (!this.storage) {
      console.log(`no storage`);
      return;
    }

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

    // load this.keys individually
    this.keys = {};
    for (let k of this.storage.keys()) {
      if (k.startsWith(prefix)) {
        const id = k.split('/')[1];
        const val = this.storage.get(k);
        if (val) {
          this.keys[id] = val;
        }
      }
    }
  }

  async store() {
    if (!this.storage) {
      console.log(`no storage`);
      return;
    }

    const publicKeyJwk = await crypto.subtle.exportKey('jwk', this.publicKey);
    const privateKeyJwk = await crypto.subtle.exportKey('jwk', this.privateKey);

    this.storage.set(pubPrefix, publicKeyJwk);
    this.storage.set(privPrefix, privateKeyJwk);

    // store items from this.keys individually
    Object.keys(this.keys).forEach((id) => {
      const index = `${prefix}${id}`;
      this.storage.set(index, this.keys[id]);
    });
  }

  async add(id, key) {
    // wrap key using public key
    this.keys[id] = await wrapAESKey(key, this.publicKey);
  }

  async get(id) {
    // unwrap key using private key
    const wrappedKey = this.keys[id];
    if (!wrappedKey) {
      return null;
    }
    const buffer = Uint8Array.from(wrappedKey, (c) => c.charCodeAt(0)).buffer;
    return await unwrapAESKey(buffer, this.privateKey);
  }

  remove(id) {
    delete this.keys[id];
  }
}

// export async function generateRSAKeyPair() {
//   return await window.crypto.subtle.generateKey(
//     {
//       name: 'RSA-OAEP',
//       modulusLength: 4096,
//       publicExponent: new Uint8Array([1, 0, 1]),
//       hash: 'SHA-256',
//     },
//     true,
//     ['encrypt', 'decrypt']
//   );
// }

async function generateAESKey() {
  try {
    const key = await window.crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256, // can be  128, 192, or 256
      },
      true, // so we can export
      ['encrypt', 'decrypt']
    );
    console.log(`generating AES key`);
    console.log(key);
    return key;
  } catch (err) {
    console.error(err);
  }
}

// export async function saveKeyToStorage(key) {
//   // Export the key as JWK format
//   const exportedKey = await window.crypto.subtle.exportKey('jwk', key);
//   // Save the stringified version to localStorage
//   window.localStorage.setItem('AESKey', JSON.stringify(exportedKey));
// }

// export async function loadKeyFromStorage() {
//   const keyData = JSON.parse(window.localStorage.getItem('AESKey'));
//   if (keyData) {
//     return await window.crypto.subtle.importKey(
//       'jwk',
//       keyData,
//       {
//         //these are the algorithm options
//         name: 'AES-GCM',
//         length: 256,
//       },
//       true, //whether the key is extractable
//       ['encrypt', 'decrypt'] //can be any combination of ["encrypt", "decrypt", "wrapKey", "unwrapKey"]
//     );
//   }
//   return null;
// }

// These are the ones I really want to use

async function wrapAESKey(aesKey, publicKey) {
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
  const wrappedKeyStr = String.fromCharCode.apply(
    null,
    new Uint8Array(wrappedKey)
  );

  return wrappedKeyStr;
}

// function storeWrappedAESKeyToLocalStorage(wrappedKeyStr) {
//   window.localStorage.setItem('wrappedAESKey', wrappedKeyStr);
// }

// async function loadWrappedAESKeyFromLocalStorage() {
//   let wrappedKeyStr = window.localStorage.getItem('wrappedAESKey');

//   if (wrappedKeyStr) {
//     return Uint8Array.from(wrappedKeyStr, (c) => c.charCodeAt(0)).buffer;
//   }
// }

async function unwrapAESKey(wrappedAESKey, privateKey) {
  const unwrappedKey = await window.crypto.subtle.unwrapKey(
    'jwk', // The format of the key to be unwrapped
    wrappedAESKey, // The wrapped key
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

async function arrayBufferToBase64(buffer) {
  let binary = '';
  let bytes = new Uint8Array(buffer);
  let len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

async function exportKeyToBase64(key) {
  // Export the key as 'raw'
  const keyBuffer = await window.crypto.subtle.exportKey('raw', key);
  // Convert the buffer to base64 for easy comparison
  const keyBase64 = await arrayBufferToBase64(keyBuffer);
  return keyBase64;
}

async function compareKeys(k1, k2) {
  const originalAESBase64 = await exportKeyToBase64(k1);
  const unwrappedAESBase64 = await exportKeyToBase64(k2);
  return originalAESBase64 === unwrappedAESBase64;
}
