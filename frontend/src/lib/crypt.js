export async function generateRSAKeyPair() {
  return await window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );
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

export async function saveKeyToStorage(key) {
  // Export the key as JWK format
  const exportedKey = await window.crypto.subtle.exportKey('jwk', key);
  // Save the stringified version to localStorage
  window.localStorage.setItem('AESKey', JSON.stringify(exportedKey));
}

export async function loadKeyFromStorage() {
  const keyData = JSON.parse(window.localStorage.getItem('AESKey'));
  if (keyData) {
    return await window.crypto.subtle.importKey(
      'jwk',
      keyData,
      {
        //these are the algorithm options
        name: 'AES-GCM',
        length: 256,
      },
      true, //whether the key is extractable
      ['encrypt', 'decrypt'] //can be any combination of ["encrypt", "decrypt", "wrapKey", "unwrapKey"]
    );
  }
  return null;
}

// These are the ones I really want to use

async function wrapAESKey(aesKey, publicKey) {
  const wrappedKey = await window.crypto.subtle.wrapKey(
    'jwk', // The format of the key to be wrapped
    aesKey, // The key to be wrapped
    publicKey, // RSA public key
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

function storeWrappedAESKeyToLocalStorage(wrappedKeyStr) {
  window.localStorage.setItem('wrappedAESKey', wrappedKeyStr);
}

async function loadWrappedAESKeyFromLocalStorage() {
  let wrappedKeyStr = window.localStorage.getItem('wrappedAESKey');

  if (wrappedKeyStr) {
    return Uint8Array.from(wrappedKeyStr, (c) => c.charCodeAt(0)).buffer;
  }
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
