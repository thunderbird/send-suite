import { createRouter, createWebHistory } from 'vue-router';
import Chat from '@/chat/views/Home.vue';
import Lockbox from '@/lockbox/views/Home.vue';
import EphemeralChat from '@/chat/views/EphemeralChat.vue';

const routes = [
  { path: '/chat', component: Chat },
  { path: '/lockbox', component: Lockbox },
  { path: '/ephemeral', component: EphemeralChat },
  { path: '/ephemeral/:hash', component: EphemeralChat },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
