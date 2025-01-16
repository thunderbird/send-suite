import { initSentry } from '@/lib/sentry';
import { createApp } from 'vue';
import Lockbox from './LockboxPage.vue';
import router from './router';
import { mountApp, setupApp } from './setup';


const app = createApp(Lockbox);

initSentry(app);
app.use(router);
setupApp(app);
mountApp(app, '#app');

