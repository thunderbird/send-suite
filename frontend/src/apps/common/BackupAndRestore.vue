<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import StatusBar from '@/apps/common/StatusBar.vue';
import useKeychainStore from '@/stores/keychain-store';

// move the following imports elsewhere
import { backupKeys, restoreKeys } from '@/lib/keychain';
import logger from '@/logger';
import useApiStore from '@/stores/api-store';
import useUserStore from '@/stores/user-store';
import { useExtensionStore } from '../lockbox/stores/extension-store';
import { MIN_WORD_LENGTH, PHRASE_SIZE } from './constants';
import ExpandIcon from './ExpandIcon.vue';
import KeyRecovery from './KeyRecovery.vue';

const MSG_NOT_COMPLEX = `Please enter ${PHRASE_SIZE} different words. Each word must be at least ${MIN_WORD_LENGTH} letters long.`;
const words = ref([
  'aaaaa',
  'bbbbb',
  'ccccc',
  'ddddd',
  'eeeee',
  'fffff',
  'ggggg',
  'hhhhh',
  'iiiii',
  'jjjjj',
  'kkkkk',
  'lllll',
]);
const passphrase = computed(() => {
  return words.value.join(' ');
});

const { api } = useApiStore();
const { getBackup } = useUserStore();
const { keychain } = useKeychainStore();
const { configureExtension } = useExtensionStore();
const bigMessageDisplay = ref('');
const shouldRestore = ref(false);
const shouldBackup = ref(false);
const hasBackedUpKeys = ref<string>(null);
const shouldOverrideVisibility = ref(false);

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

const userSetPassword = keychain.getPassphraseValue();

if (!!userSetPassword && userSetPassword !== passphrase.value) {
  words.value = userSetPassword.split(' ');
}

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

async function makeBackup() {
  bigMessageDisplay.value = '';
  logger.info(passphrase.value);

  if (!passphraseIsComplex(passphrase.value)) {
    bigMessageDisplay.value = MSG_NOT_COMPLEX;
    return;
  }

  keychain.storePassPhrase(passphrase.value);

  try {
    await backupKeys(keychain, api, bigMessageDisplay);
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
    await restoreKeys(keychain, api, bigMessageDisplay, passphrase.value);
    keychain.storePassPhrase(passphrase.value);
    hideBackupRestore();
    configureExtension();
  } catch (e) {
    bigMessageDisplay.value = e;
  }
}

function passphraseIsComplex(phrase) {
  const wordArr = phrase.split(' ');
  const wordSet = new Set(wordArr);
  const wordsAreLong = wordArr.every((word) => word.length >= MIN_WORD_LENGTH);
  const wordsAreUnique = wordSet.size >= PHRASE_SIZE;
  return wordsAreLong && wordsAreUnique;
}
</script>

<template>
  <div class="flex">
    <div class="flex flex-col gap-4">
      <div v-if="!shouldBackup && !shouldRestore">
        <h3>You're all set. Happy sending!</h3>
      </div>
      <header class="flex gap-4 py-4" :onclick="toggleVisible">
        <h3>Key Recovery</h3>
        <ExpandIcon :is-open="showKeyRecovery" />
      </header>
      <p v-if="bigMessageDisplay" style="font-size: larger">
        {{ bigMessageDisplay }}
      </p>
      <div v-if="showKeyRecovery">
        <main class="w-full flex flex-col gap-3 px-4">
          <key-recovery
            :make-backup="makeBackup"
            :restore-from-backup="restoreFromBackup"
            :should-backup="shouldBackup"
            :words="words"
            :should-restore="shouldRestore"
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
header {
  display: inline-flex;
  height: 34px;
  padding: 1px 0px;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  border-radius: 6px;
  border: 1px solid var(--surface-border, #e4e4e7);
  cursor: pointer;
}
</style>
