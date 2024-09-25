<script setup lang="ts">
import Btn from '@/apps/lockbox/elements/Btn.vue';
import { computed, ref } from 'vue';

import useKeychainStore from '@/stores/keychain-store';

// move the following imports elsewhere
import { backupKeys, restoreKeys } from '@/lib/keychain';
import logger from '@/logger';
import useApiStore from '@/stores/api-store';

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

const msg = ref('');
const { api } = useApiStore();
const { keychain } = useKeychainStore();

if (!keychain.getPassphraseValue()) {
  msg.value = 'Please restore your keys from backup';
}

const userSetPassword = keychain.getPassphraseValue();
console.log(userSetPassword, 'setPassword');

if (!!userSetPassword && userSetPassword !== passphrase.value) {
  words.value = userSetPassword.split(' ');
}

async function makeBackup() {
  msg.value = '';
  logger.info(passphrase.value);

  if (!passphraseIsComplex(passphrase.value)) {
    msg.value = MSG_NOT_COMPLEX;
    return;
  }

  keychain.storePassPhrase(passphrase.value);

  await backupKeys(keychain, api, msg);

  // Save password to local storage
  msg.value = 'Backup complete';
}

async function restoreFromBackup() {
  if (!confirm('Replace all your local keys with your backup?')) {
    return;
  }

  msg.value = '';

  try {
    await restoreKeys(keychain, api, msg, passphrase.value);
    keychain.storePassPhrase(passphrase.value);
  } catch (e) {
    msg.value = e;
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
        <p>
          Need informative text telling the user that they need to type in a
          long passphrase. We'll use that passphrase to encrypt their backup.
          When logging into another device, they'll visit this page to "install"
          their keys onto the new device.
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
        <p v-if="msg">{{ msg }}</p>
        <Btn primary @click.prevent="makeBackup">Encrypt and backup keys</Btn>
        <Btn danger @click.prevent="restoreFromBackup"
          >Restore keys from backup</Btn
        >
      </div>
    </div>
  </div>
</template>
