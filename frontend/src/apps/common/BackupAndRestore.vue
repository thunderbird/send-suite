<script setup lang="ts">
import Btn from '@/apps/lockbox/elements/Btn.vue';
import { computed, onMounted, ref } from 'vue';

import useKeychainStore from '@/stores/keychain-store';

// move the following imports elsewhere
import { backupKeys, restoreKeys } from '@/lib/keychain';
import logger from '@/logger';
import useApiStore from '@/stores/api-store';
import useUserStore from '@/stores/user-store';

const PHRASE_SIZE = 12;
const MIN_WORD_LENGTH = 5;
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
const bigMessageDisplay = ref('');
const shouldRestore = ref(false);
const shouldBackup = ref(false);
const hasBackedUpKeys = ref<string>(null);

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
      <header class="flex flex-col gap-4 px-4 py-4">
        <h1>Key Recovery</h1>
        <p v-if="bigMessageDisplay" style="font-size: x-large">
          {{ bigMessageDisplay }}
        </p>
        <p>
          Please make note of the following 12-word pass phrase. You will need
          it to restore your keys whenever you log into a new device. This
          guarantees that your files are encrypted on your device and your keys
          are never stored on our servers.
        </p>
      </header>
      <div class="w-full flex flex-col gap-3 px-4">
        <p>Enter your {{ PHRASE_SIZE }} word pass phrase:</p>
        <div>
          <input
            v-for="(n, index) in PHRASE_SIZE"
            :key="index"
            v-model="words[index]"
          />
        </div>

        <Btn v-if="shouldBackup" primary @click.prevent="makeBackup"
          >Encrypt and backup keys</Btn
        >
        <Btn v-if="shouldRestore" danger @click.prevent="restoreFromBackup"
          >Restore keys from backup</Btn
        >
      </div>
    </div>
  </div>
</template>
