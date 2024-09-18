import { initSentry } from '@/lib/sentry';
import posthogPlugin from '@/plugins/posthog';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import Extension from './ExtensionPage.vue';
const pinia = createPinia();
const app = createApp(Extension);

initSentry(app);

app.use(pinia);
app.use(posthogPlugin);
app.mount('#extension-page');
