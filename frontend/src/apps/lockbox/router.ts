import { RouteRecordRaw, createRouter, createWebHistory } from 'vue-router';

import Lockbox from '@/apps/lockbox/pages/Web.vue';
import FolderView from '@/apps/lockbox/components/FolderView.vue';
import Profile from '@/apps/lockbox/components/Profile.vue';
import Sent from '@/apps/lockbox/components/Sent.vue';
import Received from '@/apps/lockbox/components/Received.vue';

import Share from '@/apps/lockbox/pages/Share.vue';
import Recovery from '@/apps/common/Recovery.vue';

const routes: RouteRecordRaw[] = [
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
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
