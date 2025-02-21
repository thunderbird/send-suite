import { RouteRecordRaw, createRouter, createWebHistory } from 'vue-router';

import FolderView from '@/apps/send/components/FolderView.vue';
import ProfileView from '@/apps/send/components/ProfileView.vue';
import Received from '@/apps/send/components/Received.vue';
import Sent from '@/apps/send/components/Sent.vue';
import Send from '@/apps/send/pages/WebPage.vue';

import Share from '@/apps/send/pages/SharePage.vue';
import { matchMeta } from '@/lib/helpers';
import { restoreKeysUsingLocalStorage } from '@/lib/keychain';
import useApiStore from '@/stores/api-store';
import useKeychainStore from '@/stores/keychain-store';

import { IS_DEV } from '@/lib/clientConfig';
import { getCanRetry } from '@/lib/validations';
import NotFoundPage from '../common/NotFoundPage.vue';
import ExtensionPage from './ExtensionPage.vue';
import LoginPage from './LoginPage.vue';
import LockedPage from './pages/LockedPage.vue';
import { useStatusStore } from './stores/status-store';

enum META_OPTIONS {
  redirectOnValidSession = 'redirectOnValidSession',
  requiresValidToken = 'requiresValidToken',
  autoRestoresKeys = 'autoRestoresKeys',
  requiresBackedUpKeys = 'requiresBackedUpKeys',
  requiresRetryCountCheck = 'requiresRetryCountCheck',
}

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/send',
  },
  {
    path: '/login',
    component: LoginPage,
    meta: { [META_OPTIONS.redirectOnValidSession]: true },
  },
  {
    path: '/send',
    component: Send,
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
    meta: { [META_OPTIONS.requiresRetryCountCheck]: true },
  },
  {
    path: '/locked/:linkId',
    component: LockedPage,
  },

  /* 
  TESTING ONLY
  These routes are only available in development mode and are used to render the extension.
  Intended only to be used for testing. 
   */
  {
    path: '/extension',
    children: IS_DEV ? [{ path: 'popup', component: ExtensionPage }] : [],
  },
  // Catch all non defined routes
  {
    path: '/:pathMatch(.*)*',
    component: NotFoundPage,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const { keychain } = useKeychainStore();
  const { api } = useApiStore();
  const { validators } = useStatusStore();

  //  redirectOnValidSession - means that if the user has a session in local storage, they will be redirected to the Send page

  const redirectOnValidSession = matchMeta(
    to,
    META_OPTIONS.redirectOnValidSession
  );
  const requiresValidToken = matchMeta(to, META_OPTIONS.requiresValidToken);
  const autoRestoresKeys = matchMeta(to, META_OPTIONS.autoRestoresKeys);
  const requiresBackedUpKeys = matchMeta(to, META_OPTIONS.requiresBackedUpKeys);
  const requiresRetryCountCheck = matchMeta(
    to,
    META_OPTIONS.requiresRetryCountCheck
  );

  const { hasLocalStorageSession, isTokenValid, hasBackedUpKeys } =
    await validators();

  if (requiresValidToken && !isTokenValid) {
    return next('/login');
  }

  if (redirectOnValidSession && hasLocalStorageSession && isTokenValid) {
    return next('/send/profile');
  }

  if (requiresBackedUpKeys && !hasBackedUpKeys) {
    next('/send/profile');
    return;
  }

  if (autoRestoresKeys) {
    try {
      await restoreKeysUsingLocalStorage(keychain, api);
    } catch (error) {
      console.error('Error restoring keys', error);
    }
  }

  // If a file has exceeded the maximum number of retries, it will be locked.
  // We redirect the user to the locked page.
  if (requiresRetryCountCheck) {
    const canRetry = await getCanRetry(to.params.linkId as string);
    if (!canRetry) {
      next(`/locked/${to.params.linkId}/`);
    }
  }
  next();
});

export default router;
