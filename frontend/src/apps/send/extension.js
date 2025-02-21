import { initSentry } from '@/lib/sentry';
import { createApp } from 'vue';
import Extension from './ExtensionPage.vue';
import { mountApp, setupApp } from './setup';

const app = createApp(Extension);

initSentry(app);

setupApp(app);
mountApp(app, '#extension-page');
