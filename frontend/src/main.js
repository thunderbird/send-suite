import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import {
  generateAESKey,
  loadKeyFromStorage,
  saveKeyToStorage,
} from './lib/crypt';

// const keyPair = await generateKeyPair();
// console.log(keyPair);

let aesKey = await loadKeyFromStorage();
if (!aesKey) {
  console.log('no key, generating and storing');
  saveKeyToStorage(await generateAESKey());
}

createApp(App).mount('#app');
