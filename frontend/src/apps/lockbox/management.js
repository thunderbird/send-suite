import { initSentry } from '@/lib/sentry';
import posthogPlugin from '@/plugins/posthog';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import ManagementPage from './ManagementPage.vue';
import './style.css';
const pinia = createPinia();
const app = createApp(ManagementPage);

initSentry(app);

app.use(pinia);
app.use(posthogPlugin);
app.mount('#management-page');
