import { initSentry } from '@/lib/sentry';
import { createApp } from 'vue';
import ManagementPage from './ManagementPage.vue';
import { mountApp, setupApp } from './setup';

const app = createApp(ManagementPage);

initSentry(app);
setupApp(app);
mountApp(app, '#management-page');
