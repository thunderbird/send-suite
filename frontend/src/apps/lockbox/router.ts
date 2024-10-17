import { RouteRecordRaw, createRouter, createWebHistory } from 'vue-router';

import FolderView from '@/apps/lockbox/components/FolderView.vue';
import ProfileView from '@/apps/lockbox/components/ProfileView.vue';
import Received from '@/apps/lockbox/components/Received.vue';
import Sent from '@/apps/lockbox/components/Sent.vue';
import Lockbox from '@/apps/lockbox/pages/WebPage.vue';

import Recovery from '@/apps/common/Recovery.vue';
import Share from '@/apps/lockbox/pages/Share.vue';
import { matchMeta } from '@/lib/helpers';
import { restoreKeysUsingLocalStorage } from '@/lib/keychain';
import useApiStore from '@/stores/api-store';
import useKeychainStore from '@/stores/keychain-store';
import LoginPage from './LoginPage.vue';
import { useStatusStore } from './stores/status-store';

enum META_OPTIONS {
  redirectOnValidSession = 'redirectOnValidSession',
  requiresValidToken = 'requiresValidToken',
  autoRestoresKeys = 'autoRestoresKeys',
  requiresBackedUpKeys = 'requiresBackedUpKeys',
}

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/lockbox',
  },
  {
    path: '/login',
    component: LoginPage,
    meta: { [META_OPTIONS.redirectOnValidSession]: true },
  },
  {
    path: '/lockbox',
    component: Lockbox,
    children: [
      {
        path: '',
        component: FolderView,
        meta: {
          [META_OPTIONS.requiresValidToken]: true,
          [META_OPTIONS.autoRestoresKeys]: true,
          [META_OPTIONS.requiresBackedUpKeys]: true,
        },
      },
      {
        path: 'profile',
        component: ProfileView,
        meta: {
          [META_OPTIONS.requiresValidToken]: true,
          [META_OPTIONS.autoRestoresKeys]: true,
        },
      },
      {
        path: 'sent',
        component: Sent,
        meta: {
          [META_OPTIONS.requiresValidToken]: true,
        },
      },
      {
        path: 'received',
        component: Received,
        meta: {
          [META_OPTIONS.requiresValidToken]: true,
        },
      },
      {
        path: 'folder/:id',
        component: FolderView,
        props: true,
        name: 'folder',
        meta: {
          [META_OPTIONS.requiresValidToken]: true,
          [META_OPTIONS.autoRestoresKeys]: true,
          [META_OPTIONS.requiresBackedUpKeys]: true,
        },
      },
    ],
  },
  // Accept share link
  {
    path: '/share/:linkId',
    component: Share,
  },

  // Backup and Recovery for keypair and keys
  { path: '/recovery', component: Recovery },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const { keychain } = useKeychainStore();
  const { api } = useApiStore();
  const { validators } = useStatusStore();

  //  redirectOnValidSession - means that if the user has a session in local storage, they will be redirected to the lockbox page

  const redirectOnValidSession = matchMeta(to, 'redirectOnValidSession');
  const requiresValidToken = matchMeta(to, 'requiresValidToken');
  const autoRestoresKeys = matchMeta(to, 'autoRestoresKeys');
  const requiresBackedUpKeys = matchMeta(to, 'requiresBackedUpKeys');

  const { hasLocalStorageSession, isTokenValid, hasBackedUpKeys } =
    await validators();

  if (requiresValidToken && !isTokenValid) {
    return next('/login');
  }

  if (redirectOnValidSession && hasLocalStorageSession && isTokenValid) {
    return next('/lockbox/profile');
  }

  if (requiresBackedUpKeys && !hasBackedUpKeys) {
    next('/lockbox/profile');
    return;
  }

  if (autoRestoresKeys) {
    await restoreKeysUsingLocalStorage(keychain, api);
  }
  next();
});

export default router;
