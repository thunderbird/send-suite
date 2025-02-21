import { initSentry } from '@/lib/sentry';
import { createApp } from 'vue';
import Send from './SendPage.vue';
import router from './router';
import { mountApp, setupApp } from './setup';

const app = createApp(Send);

initSentry(app);
app.use(router);
setupApp(app);
mountApp(app, '#app');
