import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import { generateKeyPair } from './lib/crypt';

const keyPair = await generateKeyPair();
console.log(keyPair);

createApp(App).mount('#app');
