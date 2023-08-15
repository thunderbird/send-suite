import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import {
  generateAESKey,
  loadKeyFromStorage,
  saveKeyToStorage,
} from './lib/crypt';
import { encryptStream, decryptStream } from './lib/ece';
import { blobStream } from './lib/streams';
import { streamToArrayBuffer } from './lib/utils';

// This is our folder key
let aesKey = await loadKeyFromStorage();
if (!aesKey) {
  console.log('no key, generating and storing');
  aesKey = await generateAESKey();
  saveKeyToStorage(aesKey);
} else {
  console.log(`I have the key already. gah. tina, eat your food.`);
}

// let exported = await window.crypto.subtle.exportKey('raw', aesKey);
// exported = new Uint8Array(exported);
// console.log(`have exported key: ${exported}`);

// const blob = new Blob(['hello there'], { type: 'text/plain' });
// blob.name = `${new Date().getTime()}.txt`;

// const stream = blobStream(blob);
// const encStream = encryptStream(stream, exported);
// console.log(`encrypted the blob stream`);
// const decStream = decryptStream(encStream, exported);
// console.log(`decrypted the blob stream`);
// // debugger;
// const plaintext = await streamToArrayBuffer(decStream, blob.size);
// console.log(plaintext);
createApp(App).mount('#app');
