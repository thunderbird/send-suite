import { createRouter, createWebHistory } from 'vue-router';

import Chat from '@/chat/views/Home.vue';
import EphemeralChat from '@/chat/views/EphemeralChat.vue';

import Extension from '@/lockbox/Extension.vue';
import ManagementPage from '@/lockbox/ManagementPage.vue';

import Lockbox from '@/lockbox/pages/Web.vue';
import FolderView from '@/lockbox/components/FolderView.vue';
import Profile from '@/Profile.vue';
import Shared from '@/lockbox/components/Shared.vue';
import Received from '@/lockbox/components/Received.vue';

import Share from '@/lockbox/pages/Share.vue';
import Recovery from '@/Recovery.vue';

const routes = [
  // Chat
  { path: '/chat', component: Chat },
  { path: '/ephemeral', component: EphemeralChat },
  { path: '/ephemeral/:hash', component: EphemeralChat },

  // Extension (for debugging)
  { path: '/extension', component: Extension },
  { path: '/mgmt', component: ManagementPage },

  // Lockbox
  {
    path: '/lockbox',
    component: Lockbox,
    children: [
      { path: '', component: FolderView },
      { path: 'profile', component: Profile },
      { path: 'sent', component: Shared },
      { path: 'received', component: Received },
    ],
  },

  // Accept share link
  { path: '/share/:linkId', component: Share },

  // Backup and Recovery for keypair and keys
  { path: '/recovery', component: Recovery },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
