import { RouteRecordRaw, createRouter, createWebHistory } from 'vue-router';

import FolderView from '@/apps/lockbox/components/FolderView.vue';
import ProfileView from '@/apps/lockbox/components/ProfileView.vue';
import Received from '@/apps/lockbox/components/Received.vue';
import Sent from '@/apps/lockbox/components/Sent.vue';
import Lockbox from '@/apps/lockbox/pages/WebPage.vue';

import Recovery from '@/apps/common/Recovery.vue';
import Share from '@/apps/lockbox/pages/Share.vue';
import { restoreKeysUsingLocalStorage } from '@/lib/keychain';
import useApiStore from '@/stores/api-store';
import useKeychainStore from '@/stores/keychain-store';
import useUserStore from '@/stores/user-store';
import LoginPage from './LoginPage.vue';

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/lockbox',
  },
  {
    path: '/login',
    component: LoginPage,
    meta: { redirectOnValidSession: true },
  },
  {
    path: '/lockbox',
    component: Lockbox,
    children: [
      {
        path: '',
        component: FolderView,
        meta: {
          requiresSessionAndAuth: true,
        },
      },
      {
        path: 'profile',
        component: ProfileView,
        meta: {
          requiresSessionAndAuth: true,
        },
      },
      {
        path: 'sent',
        component: Sent,
        meta: {
          requiresSessionAndAuth: true,
        },
      },
      {
        path: 'received',
        component: Received,
        meta: {
          requiresSessionAndAuth: true,
        },
      },
      {
        path: 'folder/:id',
        component: FolderView,
        props: true,
        name: 'folder',
        meta: {
          requiresSessionAndAuth: true,
        },
      },
    ],
  },
  // Accept share link
  {
    path: '/share/:linkId',
    component: Share,
    meta: {
      requireFreshSession: true,
    },
  },

  // Backup and Recovery for keypair and keys
  { path: '/recovery', component: Recovery },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const { user } = useUserStore();
  const { keychain } = useKeychainStore();
  const { api } = useApiStore();
  //  requiresSession - means that even if the user has a session in local storage, it must be valid in the backend
  const requiresSession = to.matched.some(
    (record) => record.meta.requiresSession
  );
  // requiresAuth - means that the user must have a session in local storage
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  // requiresSessionAndAuth - means that the user must have a session in local storage and it must be valid in the backend
  const requiresSessionAndAuth = to.matched.some(
    (record) => record.meta.requiresSessionAndAuth
  );
  //  redirectOnValidSession - means that if the user has a session in local storage, they will be redirected to the lockbox page
  const redirectOnValidSession = to.matched.some(
    (record) => record.meta.redirectOnValidSession
  );
  const requireFreshSession = to.matched.some(
    (record) => record.meta.requireFreshSession
  );

  // Check local storage
  const hasLocalStorageSession = user?.id === 0 ? false : true;

  if (requiresAuth && !hasLocalStorageSession) {
    return next('/login');
  }

  const isSessionValid = await api.call('users/me');

  if (requiresSessionAndAuth) {
    if (!hasLocalStorageSession || !isSessionValid) {
      return next('/login');
    }
  }

  if (requiresSession && !isSessionValid) {
    return next('/login');
  }

  if (requireFreshSession) {
    if (hasLocalStorageSession && !isSessionValid) {
      return next('/login');
    }
  }

  if (redirectOnValidSession && hasLocalStorageSession && isSessionValid) {
    return next('/lockbox/profile');
  }

  await restoreKeysUsingLocalStorage(keychain, api);
  next();
});

export default router;
