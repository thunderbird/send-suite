import { initSentry } from '@/lib/sentry';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import ManagementPage from './ManagementPage.vue';
const pinia = createPinia();
const app = createApp(ManagementPage);

initSentry(app);

app.use(pinia);
app.mount('#management-page');
