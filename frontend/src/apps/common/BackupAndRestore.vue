<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import StatusBar from '@/apps/common/StatusBar.vue';
import useKeychainStore from '@/stores/keychain-store';

// move the following imports elsewhere
import { downloadTxt } from '@/lib/filesync';
import { backupKeys, restoreKeys } from '@/lib/keychain';
import { generatePassphrase } from '@/lib/passphrase';
import { trpc } from '@/lib/trpc';
import useApiStore from '@/stores/api-store';
import useUserStore from '@/stores/user-store';
import { useMutation } from '@tanstack/vue-query';
import { useExtensionStore } from '../send/stores/extension-store';
import { PHRASE_SIZE } from './constants';
import ExpandIcon from './ExpandIcon.vue';
import KeyRecovery from './KeyRecovery.vue';

const words = ref(generatePassphrase(PHRASE_SIZE));

const regeneratePassphrase = () => {
  words.value = generatePassphrase(PHRASE_SIZE);
};

const passphraseString = computed(() => {
  return words.value.join(' ');
});

const setPassphrase = (newPassphrase: string) => {
  let res = newPassphrase.replace(/\s+/g, '');
  console.log('newPassphrase', res);

  words.value = res.split('-');
};

const { api } = useApiStore();
const {
  getBackup,
  logOut,
  user: { email },
} = useUserStore();
const { keychain } = useKeychainStore();
const { configureExtension } = useExtensionStore();
const bigMessageDisplay = ref('');
const shouldRestore = ref(false);
const shouldBackup = ref(false);
const hasBackedUpKeys = ref<string>(null);
const shouldOverrideVisibility = ref(false);

const { mutate: resetKeys } = useMutation({
  mutationKey: ['resetKeys'],
  mutationFn: async () => {
    await trpc.resetKeys.mutate();
  },
  onSuccess: async () => {
    await logOut();
    window.location.reload();
  },
});

const userSetPassword = keychain.getPassphraseValue();

if (!!userSetPassword && userSetPassword !== passphraseString.value) {
  words.value = userSetPassword.split(' ');
}

function hideBackupRestore() {
  shouldRestore.value = false;
  shouldBackup.value = false;
}

onMounted(async () => {
  const keybackup = await getBackup();
  hasBackedUpKeys.value = keybackup?.backupKeypair;
  if (!hasBackedUpKeys.value) {
    shouldBackup.value = true;
    bigMessageDisplay.value =
      '⚠️ Please write down your backup keys and click "Encrypt and backup keys" ⚠️';
  } else {
    if (!keychain.getPassphraseValue()) {
      bigMessageDisplay.value = '⚠️ Please restore your keys from backup ⚠️';
      shouldRestore.value = true;
    }
  }
});

const toggleVisible = () => {
  shouldOverrideVisibility.value = !shouldOverrideVisibility.value;
};

const showKeyRecovery = computed(() => {
  return (
    shouldBackup.value ||
    shouldRestore.value ||
    !!shouldOverrideVisibility.value
  );
});

const downloadPassPhrase = async () => {
  await downloadTxt(
    words.value.join(' - '),
    `tb-send-passphrase-${email}-key.txt`
  );
};

async function makeBackup() {
  bigMessageDisplay.value = '';
  const userConfirmed = confirm(
    'Are you sure you want to backup your keys? You will not be able to change your passphrase after this.'
  );

  if (!userConfirmed) {
    return;
  }

  keychain.storePassPhrase(passphraseString.value);

  try {
    await backupKeys(keychain, api, bigMessageDisplay);
    await downloadPassPhrase();
    hideBackupRestore();
    configureExtension();
  } catch (e) {
    console.error('Error backing up keys', e);
  }
}

async function restoreFromBackup() {
  if (!confirm('Replace all your local keys with your backup?')) {
    return;
  }

  bigMessageDisplay.value = '';

  try {
    await restoreKeys(keychain, api, bigMessageDisplay, passphraseString.value);
    keychain.storePassPhrase(passphraseString.value);
    hideBackupRestore();
    configureExtension();
  } catch (e) {
    bigMessageDisplay.value = e;
  }
}
</script>

<template>
  <div class="container">
    <div class="content">
      <div v-if="!shouldBackup && !shouldRestore">
        <h3>You're all set. Happy sending!</h3>
      </div>
      <div :onclick="toggleVisible" class="toggle">
        <h3>Key Recovery</h3>
        <ExpandIcon :is-open="showKeyRecovery" />
      </div>
      <p v-if="bigMessageDisplay" style="font-size: larger">
        {{ bigMessageDisplay }}
      </p>
      <div v-if="showKeyRecovery">
        <main class="recovery-main">
          <key-recovery
            :make-backup="makeBackup"
            :restore-from-backup="restoreFromBackup"
            :should-backup="shouldBackup"
            :words="words"
            :should-restore="shouldRestore"
            :regenerate-passphrase="regeneratePassphrase"
            :set-passphrase="setPassphrase"
            :override-visibility="shouldOverrideVisibility"
            :download-passphrase="downloadPassPhrase"
            :reset-keys="resetKeys"
          />
        </main>
      </div>
    </div>
  </div>

  <StatusBar />
</template>

<style scoped>
h2 {
  font-size: 22px;
}
.toggle {
  display: inline-flex;
  height: 34px;
  padding: 1px 0px;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  border-radius: 6px;
  border: 1px solid var(--surface-border, #e4e4e7);
  cursor: pointer;
  gap: 1rem;
  padding: 1rem;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.recovery-main {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0 1rem;
}
</style>
