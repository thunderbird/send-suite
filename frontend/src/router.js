import { createRouter, createWebHistory } from 'vue-router';

import Lockbox from '@/lockbox/pages/Web.vue';
import FolderView from '@/lockbox/components/FolderView.vue';
import Profile from '@/Profile.vue';
import Sent from '@/lockbox/components/Sent.vue';
import Received from '@/lockbox/components/Received.vue';

import Share from '@/lockbox/pages/Share.vue';
import Recovery from '@/Recovery.vue';

import Extension from '@/lockbox/Extension.vue';
import ManagementPage from '@/lockbox/ManagementPage.vue';

const routes = [
  // Lockbox
  {
    path: '/lockbox',
    component: Lockbox,
    children: [
      { path: '', component: FolderView },
      { path: 'profile', component: Profile },
      { path: 'sent', component: Sent },
      { path: 'received', component: Received },
    ],
  },

  // Accept share link
  { path: '/share/:linkId', component: Share },

  // Backup and Recovery for keypair and keys
  { path: '/recovery', component: Recovery },

  // Extension (for debugging outside of TB)
  { path: '/extension', component: Extension },
  { path: '/mgmt', component: ManagementPage },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
