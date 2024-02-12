import { createRouter, createWebHistory } from 'vue-router';

import Chat from '@/chat/views/Home.vue';
import EphemeralChat from '@/chat/views/EphemeralChat.vue';

import Lockbox from '@/lockbox/pages/Web.vue';
import Share from '@/lockbox/pages/Share.vue';

import Extension from '@/lockbox/Extension.vue';
import ManagementPage from '@/lockbox/ManagementPage.vue';

import Recovery from '@/Recovery.vue';
import Profile from '@/Profile.vue';

const routes = [
  // Chat
  { path: '/chat', component: Chat },
  { path: '/ephemeral', component: EphemeralChat },
  { path: '/ephemeral/:hash', component: EphemeralChat },
  // Lockbox

  //
  { path: '/lockbox/profile', component: Profile },
  { path: '/lockbox', component: Lockbox },
  { path: '/share/:linkId', component: Share },

  // Extension (for debugging)
  { path: '/extension', component: Extension },
  { path: '/mgmt', component: ManagementPage },

  // Backup and Recovery for keypair and keys
  { path: '/recovery', component: Recovery },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
