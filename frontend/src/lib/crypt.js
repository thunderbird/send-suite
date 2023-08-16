import { Buffer } from 'buffer';

const prefix = 'send-keychain/';
const pubPrefix = 'send-pub';
const privPrefix = 'send-priv';
export class Keychain {
  constructor(storage) {
    this.storage = storage;
    this.keysets = {};
  }

  showKeys() {
    Object.keys(this.keysets).forEach((id) => {
      const keyset = this.keysets[id];
      console.log(id);
      Object.keys(keyset).forEach((kname) => {
        console.log(`\t${kname}: ${keyset[kname]}`);
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

  async createAndAddContainerKey(id, keyPair) {
    // AES key is for encrypting/decrypting messages and files
    const aesKey = await generateAESKey();

    // RSA keypair is for encrypting/decrypting AES keys
    // const keyPair = await generateRSAKeyPair();
    this.add(id, {
      aesKey,
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
    });
  }

  async load() {
    if (!this.storage) {
      console.log(`no storage`);
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

    this.keysets = {};
    // the aesKey must be unwrapped with the private key
    // we'll do the public and private keys first
    for (let k of this.storage.keys()) {
      if (k.startsWith(prefix)) {
        const [_, id, type] = k.split('/');
        const val = this.storage.get(k);
        if (val) {
          if (!this.keysets[id]) {
            this.keysets[id] = {};
          }
          switch (type) {
            case 'privateKey':
              this.keysets[id][type] = await crypto.subtle.importKey(
                'jwk',
                val,
                {
                  name: 'RSA-OAEP',
                  hash: { name: 'SHA-256' },
                },
                true,
                ['unwrapKey']
              );
              break;
            case 'publicKey':
              this.keysets[id][type] = await crypto.subtle.importKey(
                'jwk',
                val,
                {
                  name: 'RSA-OAEP',
                  hash: { name: 'SHA-256' },
                },
                true,
                ['wrapKey']
              );
              break;
            // case 'aesKey':
            //   // I need to do this after doing the privatekey
            //   this.keysets[id][type] = await unwrapAESKey(val);
            //   break;
            default:
              break;
          }
        }
      }
    }

    // TODO: find a smarter way to do the aesKey after the private key
    for (let k of this.storage.keys()) {
      if (k.startsWith(prefix)) {
        const [_, id, type] = k.split('/');
        const val = this.storage.get(k);
        if (val && type === 'aesKey') {
          if (!this.keysets[id]['privateKey']) {
            console.log(`👿 no private key for this aes key? ${id}`);
            continue;
          }
          this.keysets[id][type] = await unwrapAESKey(
            base64ToArrayBuffer(val),
            this.keysets[id]['privateKey']
          );
        }
      }
    }
  }

  async store() {
    if (!this.storage) {
      console.log(`no storage`);
      return;
    }

    const publicKeyJwk = await rsaToJwk(this.publicKey);
    const privateKeyJwk = await rsaToJwk(this.privateKey);

    this.storage.set(pubPrefix, publicKeyJwk);
    this.storage.set(privPrefix, privateKeyJwk);

    // store items from this.keys individually
    Object.keys(this.keysets).forEach(async (id) => {
      const { aesKey, publicKey, privateKey } = this.keysets[id];
      let index;
      index = `${prefix}${id}/privateKey`;
      this.storage.set(index, await rsaToJwk(privateKey));
      index = `${prefix}${id}/publicKey`;
      this.storage.set(index, await rsaToJwk(publicKey));
      index = `${prefix}${id}/aesKey`;
      this.storage.set(index, await wrapAESKey(aesKey, publicKey));
    });
  }

  async add(id, keyset) {
    this.keysets[id] = keyset;
    // // wrap key using public key
    // this.keys[id] = await wrapAESKey(key, this.publicKey);
  }

  async get(id) {
    // Returns: {
    //   aesKey,
    //   publicKey,
    //   privateKey,
    // }
    return this.keysets[id];

    // unwrap key using private key
    // const wrappedKey = this.keys[id];
    // if (!wrappedKey) {
    //   return null;
    // }
    // const buffer = Uint8Array.from(wrappedKey, (c) => c.charCodeAt(0)).buffer;
    // return await unwrapAESKey(buffer, this.privateKey);
  }

  remove(id) {
    delete this.keysets[id];
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
    console.log(`generating AES key`);
    console.log(key);
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
  const wrappedKeyStr = bufferToBase64(wrappedKey);

  return wrappedKeyStr;
}

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

export async function rsaToJwk(key) {
  return await crypto.subtle.exportKey('jwk', key);
}

function arrayBufferToBase64(buffer) {
  let binary = '';
  let bytes = new Uint8Array(buffer);
  let len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Encoding function
function bufferToBase64(buf) {
  var bufferInstance = Buffer.from(buf);
  return bufferInstance.toString('base64');
}

// Decoding function
function base64ToArrayBuffer(base64Str) {
  var bufferInstance = Buffer.from(base64Str, 'base64');
  return Uint8Array.from(bufferInstance).buffer;
}
// function bufferToBase64(buffer) {
//   let array = new Uint8Array(buffer);
//   let str = new TextDecoder().decode(array);
//   return btoa(str);
// }

// function base64ToArrayBuffer(base64) {
//   let str = atob(base64);
//   let array = new TextEncoder().encode(str);
//   return array.buffer;
// }
// function base64ToArrayBuffer(base64) {
//   var binaryString = decodeURIComponent(
//     atob(base64)
//       .split('')
//       .map(function (c) {
//         return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
//       })
//       .join('')
//   );

//   var len = binaryString.length;
//   var bytes = new Uint8Array(len);
//   for (var i = 0; i < len; i++) {
//     bytes[i] = binaryString.charCodeAt(i);
//   }
//   return bytes.buffer;
// }

async function exportKeyToBase64(key) {
  // Export the key as 'raw'
  const keyBuffer = await window.crypto.subtle.exportKey('raw', key);
  // Convert the buffer to base64 for easy comparison
  const keyBase64 = await bufferToBase64(keyBuffer);
  return keyBase64;
}

async function compareKeys(k1, k2) {
  const originalAESBase64 = await exportKeyToBase64(k1);
  const unwrappedAESBase64 = await exportKeyToBase64(k2);
  return originalAESBase64 === unwrappedAESBase64;
}
