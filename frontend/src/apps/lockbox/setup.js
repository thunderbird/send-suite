import '@/lib/logger';
import posthogPlugin from '@/plugins/posthog';
import { VueQueryPlugin } from '@tanstack/vue-query';
import '@thunderbirdops/services-ui/style.css';
import FloatingVue from 'floating-vue';
import 'floating-vue/dist/style.css';
import { createPinia } from 'pinia';
import { createVfm } from 'vue-final-modal';
import 'vue-final-modal/style.css';
import './style.css';

export function setupApp(app) {
  const pinia = createPinia();
  app.use(VueQueryPlugin);
  app.use(pinia);
  app.use(FloatingVue);
  app.use(posthogPlugin);
}
export function mountApp(app, nodeName) {
  const vfm = createVfm();
  app.use(vfm).mount(nodeName);
}
