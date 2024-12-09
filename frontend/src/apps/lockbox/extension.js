import '@/lib/logger';
import { initSentry } from '@/lib/sentry';
import posthogPlugin from '@/plugins/posthog';
import { VueQueryPlugin } from '@tanstack/vue-query';
import { createPinia } from 'pinia';
import { createApp } from 'vue';

import Extension from './ExtensionPage.vue';
import './style.css';
const pinia = createPinia();
const app = createApp(Extension);

initSentry(app);

app.use(VueQueryPlugin);
app.use(pinia);
app.use(posthogPlugin);
app.mount('#extension-page');
