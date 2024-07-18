import { RouteRecordRaw, createRouter, createWebHistory } from 'vue-router';

import FolderView from '@/apps/lockbox/components/FolderView.vue';
import ProfileView from '@/apps/lockbox/components/ProfileView.vue';
import Received from '@/apps/lockbox/components/Received.vue';
import Sent from '@/apps/lockbox/components/Sent.vue';
import Lockbox from '@/apps/lockbox/pages/Web.vue';

import Recovery from '@/apps/common/Recovery.vue';
import Share from '@/apps/lockbox/pages/Share.vue';
import useApiStore from '@/stores/api-store';
import useUserStore from '@/stores/user-store';

export const routes: RouteRecordRaw[] = [
  {
    path: '/lockbox',
    component: Lockbox,
    children: [
      {
        path: '',
        component: FolderView,
        meta: {
          requiresAuth: true,
          allowListCheck: true,
          requiredPermissions: ['loginSuccess'],
        },
      },
      { path: 'profile', component: ProfileView },
      { path: 'sent', component: Sent },
      { path: 'received', component: Received },
      {
        path: 'folder/:id',
        component: FolderView,
        props: true,
        name: 'folder',
        meta: {
          requiresAuth: true,
          requiredPermissions: ['loginSuccess'],
        },
      },
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

router.beforeEach(async (to, from, next) => {
  const { user } = useUserStore();
  const { api } = useApiStore();
  const routeRequiresAuth = to.matched.some(
    (record) => record.meta.requiresAuth
  );
  const isLoggedIn = user.id === 0 ? 'shouldLogin' : 'loginSuccess';
  const requiresAllowListCheck = to.matched.some(
    (record) => record.meta.allowListCheck
  );
  console.log('requiresAllowListCheck', requiresAllowListCheck);
  console.log(user);

  if (routeRequiresAuth) {
    const requiredPermissions = to.meta?.requiredPermissions as string[];
    const hasPermission = requiredPermissions.every((permission) =>
      isLoggedIn.includes(permission)
    );

    if (!hasPermission) {
      // Redirect to profile so they can log in
      return next('/lockbox/profile');
    }
  }

  if (requiresAllowListCheck) {
    const isAllowed = await api.call<{ msg: string }>('lockbox/fxa/allowlist');

    if (isAllowed?.msg !== 'User in allow list') {
      return next('/lockbox/profile');
    }
    console.log('checking allow list');
  }

  next();
});

export default router;
