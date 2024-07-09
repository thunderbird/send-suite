import { initSentry } from '@/lib/sentry';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import Lockbox from './Lockbox.vue';
import router from './router';
import './style.css';
const pinia = createPinia();
const app = createApp(Lockbox);

initSentry(app);

app.use(pinia);
app.use(router);
app.mount('#app');
