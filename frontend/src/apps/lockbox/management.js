import '@/lib/logger';
import { initSentry } from '@/lib/sentry';
import posthogPlugin from '@/plugins/posthog';
import { VueQueryPlugin } from '@tanstack/vue-query';
import '@thunderbirdops/services-ui/style.css';
import FloatingVue from 'floating-vue';
import 'floating-vue/dist/style.css';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import ManagementPage from './ManagementPage.vue';
import './style.css';
const pinia = createPinia();
const app = createApp(ManagementPage);

initSentry(app);

app.use(VueQueryPlugin);
app.use(pinia);
app.use(posthogPlugin);
app.use(FloatingVue);
app.mount('#management-page');
