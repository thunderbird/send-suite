import { createRouter, createWebHistory } from 'vue-router';

import Chat from '@/chat/views/Home.vue';
import EphemeralChat from '@/chat/views/EphemeralChat.vue';

import Lockbox from '@/lockbox/pages/Web.vue';
import Share from '@/lockbox/pages/Share.vue';

import Extension from '@/lockbox/Extension.vue';

const routes = [
  // Chat
  { path: '/chat', component: Chat },
  { path: '/ephemeral', component: EphemeralChat },
  { path: '/ephemeral/:hash', component: EphemeralChat },
  // Lockbox
  { path: '/lockbox', component: Lockbox },
  { path: '/share/:linkId', component: Share },

  // Extension (for debugging)
  { path: '/extension', component: Extension },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
