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

  async createAndAddContainerKey(id) {
    // AES key is for encrypting/decrypting messages and files
    const aesKey = await generateAESKey();

    // RSA keypair is for encrypting/decrypting AES keys
    const keyPair = await generateRSAKeyPair();
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

    // Load User keys
    const publicKeyJwk = this.storage.get(pubPrefix);
    const privateKeyJwk = this.storage.get(privPrefix);

    this.publicKey = await jwkToRsa(publicKeyJwk);
    this.privateKey = await jwkToRsa(privateKeyJwk);

    // load this.keys individually
    this.keysets = {};
    for (let k of this.storage.keys()) {
      if (k.startsWith(prefix)) {
        const id = k.split('/')[1];
        const val = this.storage.get(k);
        if (val) {
          this.keysets[id] = val;
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
    Object.keys(this.keysets).forEach(async (id) => {
      const { aesKey, publicKey, privateKey } = this.keysets[id];
      let index;
      debugger;
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
  const wrappedKeyStr = String.fromCharCode.apply(
    null,
    new Uint8Array(wrappedKey)
  );

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

async function rsaToJwk(key) {
  return await crypto.subtle.exportKey('jwk', key);
}

async function jwkToRsa(jwk) {
  return await crypto.subtle.importKey(
    'jwk',
    jwk,
    {
      name: 'RSA-OAEP',
      hash: { name: 'SHA-256' },
    },
    true,
    ['wrapKey']
  );
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
