import { createApp } from 'vue';
import ManagementPage from '@/lockbox/ManagementPage.vue';
import { createPinia } from 'pinia';
const pinia = createPinia();
const app = createApp(ManagementPage);
app.use(pinia);
app.mount('#management-page');
