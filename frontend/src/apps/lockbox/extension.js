import { initSentry } from '@/lib/sentry';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import Extension from './ExtensionPage.vue';
const pinia = createPinia();
const app = createApp(Extension);

initSentry(app);

app.use(pinia);
app.mount('#extension-page');
