import { createApp } from 'vue';
import Extension from './Extension.vue';
import { createPinia } from 'pinia';
const pinia = createPinia();
const app = createApp(Extension);
app.use(pinia);
app.mount('#extension-page');
