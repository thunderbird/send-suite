import { Buffer } from 'buffer';

const prefix = 'send-keychain/';
const pubPrefix = 'send-pub';
const privPrefix = 'send-priv';
export class Keychain {
  constructor(storage) {
    this.storage = storage;
    this.keys = {};
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

    this.add(id, {
      aesKey,
    });
  }

  async load() {
    if (!this.storage) {
      console.log(`no storage`);
      return;
    }

    if (!this.storage.get(privPrefix)) {
      console.log(`no private key`);
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

    // the aesKey must be unwrapped with the private key
    // we'll do the public and private keys first
    // UPDATE: not caring about public/private keys for containers
    for (let k of this.storage.keys()) {
      if (k.startsWith(prefix)) {
        const [_, id, type] = k.split('/');
        const val = this.storage.get(k);
        if (val) {
          if (!this.keys[id]) {
            this.keys[id] = {};
          }
          switch (type) {
            // case 'privateKey':
            //   this.keysets[id][type] = await crypto.subtle.importKey(
            //     'jwk',
            //     val,
            //     {
            //       name: 'RSA-OAEP',
            //       hash: { name: 'SHA-256' },
            //     },
            //     true,
            //     ['unwrapKey']
            //   );
            //   break;
            // case 'publicKey':
            //   this.keysets[id][type] = await crypto.subtle.importKey(
            //     'jwk',
            //     val,
            //     {
            //       name: 'RSA-OAEP',
            //       hash: { name: 'SHA-256' },
            //     },
            //     true,
            //     ['wrapKey']
            //   );
            //   break;
            case 'aesKey':
              // I need to do this after doing the privatekey
              // Update: no I don't. just using personal private key

              this.keys[id][type] = await unwrapAESKey(val, this.privateKey);
              break;
            default:
              break;
          }
        }
      }
    }

    // TODO: find a smarter way to do the aesKey after the private key
    // for (let k of this.storage.keys()) {
    //   if (k.startsWith(prefix)) {
    //     const [_, id, type] = k.split('/');
    //     const val = this.storage.get(k);
    //     if (val && type === 'aesKey') {
    //       if (!this.keysets[id]['privateKey']) {
    //         console.log(`👿 no private key for this aes key? ${id}`);
    //         continue;
    //       }
    //       this.keysets[id][type] = await unwrapAESKey(
    //         base64ToArrayBuffer(val),
    //         this.keysets[id]['privateKey']
    //       );
    //     }
    //   }
    // }
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
    Object.keys(this.keys).forEach(async (id) => {
      const { aesKey } = this.keys[id];
      // const { aesKey, publicKey, privateKey } = this.keysets[id];
      let index;
      // if (privateKey) {
      //   index = `${prefix}${id}/privateKey`;
      //   this.storage.set(index, await rsaToJwk(privateKey));
      // }
      // if (publicKey) {
      //   index = `${prefix}${id}/publicKey`;
      //   this.storage.set(index, await rsaToJwk(publicKey));
      // }
      if (aesKey) {
        index = `${prefix}${id}/aesKey`;
        this.storage.set(index, await wrapAESKey(aesKey, this.publicKey));
      }
    });
  }

  async add(id, key) {
    if (!this.publicKey) {
      throw Error('Missing public key, required for wrapping aes key');
    }
    // this.keys[id] = keyset;
    // wrap key using public key
    this.keys[id] = await wrapAESKey(key, this.publicKey);
  }

  async get(id) {
    // unwrap key using private key
    const wrappedKey = this.keys[id];
    if (!wrappedKey) {
      throw Error('Key does not exist');
      // return null;
    }
    // const buffer = Uint8Array.from(wrappedKey, (c) => c.charCodeAt(0)).buffer;
    // console.log(`here's the buffer`);
    // console.log(buffer);
    return await unwrapAESKey(wrappedKey, this.privateKey);
  }

  async getUserPublicKeyJwk() {
    const publicKeyJwk = await rsaToJwk(this.publicKey);
    return publicKeyJwk;
  }

  async getAndWrapContainerKey(id, publicKey) {
    const { aesKey } = await this.get(id);
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
  const wrappedKeyStr = bufferToBase64(wrappedKey);

  return wrappedKeyStr;
}

export async function unwrapAESKey(wrappedAESKey, privateKey) {
  console.log(
    `does a wrapped key always need to be base64 to array buffer converted?`
  );
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

// Encoding function
export function bufferToBase64(buf) {
  var bufferInstance = Buffer.from(buf);
  return bufferInstance.toString('base64');
}

// Decoding function
export function base64ToArrayBuffer(base64Str) {
  var bufferInstance = Buffer.from(base64Str, 'base64');
  return Uint8Array.from(bufferInstance).buffer;
}

export async function exportKeyToBase64(key) {
  // Export the key as 'raw'
  const keyBuffer = await window.crypto.subtle.exportKey('raw', key);
  // Convert the buffer to base64 for easy comparison
  const keyBase64 = await bufferToBase64(keyBuffer);
  return keyBase64;
}

export async function compareKeys(k1, k2) {
  const originalAESBase64 = await exportKeyToBase64(k1);
  const unwrappedAESBase64 = await exportKeyToBase64(k2);
  return originalAESBase64 === unwrappedAESBase64;
}
