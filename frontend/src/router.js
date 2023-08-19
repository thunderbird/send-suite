import { createRouter, createWebHistory } from 'vue-router';
import Home from './views/Home.vue';
import EphemeralChat from './views/EphemeralChat.vue';

const routes = [
  { path: '/', component: Home },
  { path: '/ephemeral', component: EphemeralChat },
  { path: '/ephemeral/:hash', component: EphemeralChat },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
