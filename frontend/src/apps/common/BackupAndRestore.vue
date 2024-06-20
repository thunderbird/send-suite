<script setup lang="ts">
import Btn from '@/apps/lockbox/elements/Btn.vue';
import { computed, ref } from 'vue';

import useApiStore from '@/stores/api-store';
import useKeychainStore from '@/stores/keychain-store';
import useUserStore from '@/stores/user-store';

// move the following imports elsewhere
import { Util } from '@/lib/keychain';
import logger from '@/logger';

const PHRASE_SIZE = 12;
const MIN_WORD_LENGTH = 5;
const MSG_NOT_COMPLEX = `Please enter ${PHRASE_SIZE} different words. Each word must be at least ${MIN_WORD_LENGTH} letters long.`;
const MSG_INCORRECT_PASSPHRASE = 'Passphrase is incorrect';
const MSG_COULD_NOT_RETRIEVE = 'Could not retrieve backup from the server.';
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
const { user, createBackup, getBackup } = useUserStore();
const { keychain } = useKeychainStore();
useApiStore();

async function makeBackup() {
  msg.value = '';
  logger.info(passphrase.value);
  logger.info(passphrase.value);

  if (!passphraseIsComplex(passphrase.value)) {
    msg.value = MSG_NOT_COMPLEX;
    return;
  }

  const keypair = await keychain.exportKeypair();
  const containerKeys = await keychain.exportKeys();

  // let's encrypt them with a password
  const {
    protectedContainerKeysStr,
    protectedKeypairStr,
    passwordWrappedKeyStr,
    saltStr,
  } = await encryptAll(
    keypair.publicKey,
    keypair.privateKey,
    containerKeys,
    passphrase.value
  );
  /* 
    We should try/catch this
   */
  await createBackup(
    user.id,
    protectedContainerKeysStr,
    protectedKeypairStr,
    passwordWrappedKeyStr,
    saltStr
  );

  msg.value = 'Backup complete';
}

async function restoreFromBackup() {
  if (!confirm('Replace all your local keys with your backup?')) {
    return;
  }

  const resp = await getBackup(user.id);
  if (!resp) {
    msg.value = MSG_COULD_NOT_RETRIEVE;
    return;
  }

  msg.value = '';

  const { backupContainerKeys, backupKeypair, backupKeystring, backupSalt } =
    resp;
  try {
    const { publicKeyJwk, privateKeyJwk, containerKeys } = await decryptAll(
      backupContainerKeys,
      backupKeypair,
      backupKeystring,
      backupSalt,
      passphrase.value
    );

    const keypair = {
      publicKey: publicKeyJwk,
      privateKey: privateKeyJwk,
    };

    await keychain.load(keypair, containerKeys);
    await keychain.store();

    msg.value = 'Restore complete';
  } catch (e) {
    logger.info(e);
    msg.value = MSG_INCORRECT_PASSPHRASE;
  }
}

function passphraseIsComplex(phrase) {
  const wordArr = phrase.split(' ');
  const wordSet = new Set(wordArr);
  const wordsAreLong = wordArr.every((word) => word.length >= MIN_WORD_LENGTH);
  const wordsAreUnique = wordSet.size >= PHRASE_SIZE;
  return wordsAreLong && wordsAreUnique;
}

async function encryptKeys(containerKeysObj, key, salt) {
  const obj = {};
  await Promise.all(
    Object.keys(containerKeysObj).map(async (k) => {
      const encrypted = await keychain.backup.encryptBackup(
        containerKeysObj[k],
        key,
        salt
      );
      obj[k] = encrypted;
      return true;
    })
  );
  return obj;
}

async function decryptKeys(protectedContainerKeysObj, key, salt) {
  const obj = {};
  await Promise.all(
    Object.keys(protectedContainerKeysObj).map(async (k) => {
      const decrypted = await keychain.backup.decryptBackup(
        protectedContainerKeysObj[k],
        key,
        salt
      );
      obj[k] = decrypted;
      return true;
    })
  );

  return obj;
}

async function encryptAll(
  publicKeyJwk,
  privateKeyJwk,
  containerKeys,
  password
) {
  const key = await keychain.generateBackupKey();
  const salt = Util.generateSalt();

  const protectedContainerKeys = await encryptKeys(containerKeys, key, salt);
  const protectedContainerKeysStr = JSON.stringify(protectedContainerKeys);

  const publicKeyCiphertext = await keychain.backup.encryptBackup(
    publicKeyJwk,
    key,
    salt
  );
  const privateKeyCiphertext = await keychain.backup.encryptBackup(
    privateKeyJwk,
    key,
    salt
  );

  const protectedKeypair = {
    publicKey: publicKeyCiphertext,
    privateKey: privateKeyCiphertext,
  };
  const protectedKeypairStr = JSON.stringify(protectedKeypair);

  const passwordWrappedKeyStr = await keychain.password.wrapContentKey(
    key,
    password,
    salt
  );
  const saltStr = Util.arrayBufferToBase64(salt);
  return {
    protectedContainerKeysStr,
    protectedKeypairStr,
    passwordWrappedKeyStr,
    saltStr,
  };
}

async function decryptAll(
  protectedContainerKeysStr: string,
  protectedKeypairStr: string,
  passwordWrappedKeyStr: string,
  saltStr: string,
  password: string
) {
  const salt = Util.base64ToArrayBuffer(saltStr);
  logger.info(`got salt`);
  logger.info(salt);

  const key = await keychain.password.unwrapContentKey(
    passwordWrappedKeyStr,
    password,
    salt
  );
  logger.info(`got key`);
  logger.info(key);

  const protectedKeypair = JSON.parse(protectedKeypairStr);
  logger.info(`got keypair`);
  logger.info(protectedKeypair);
  const publicKeyCiphertext = protectedKeypair.publicKey;
  const privateKeyCiphertext = protectedKeypair.privateKey;

  const publicKeyJwk = await keychain.backup.decryptBackup(
    publicKeyCiphertext,
    key,
    salt
  );
  logger.info(`got public key`);
  logger.info(publicKeyJwk);
  const privateKeyJwk = await keychain.backup.decryptBackup(
    privateKeyCiphertext,
    key,
    salt
  );
  logger.info(`got private key`);
  logger.info(privateKeyJwk);

  const protectedContainerKeys = JSON.parse(protectedContainerKeysStr);
  const containerKeys = await decryptKeys(protectedContainerKeys, key, salt);
  logger.info(containerKeys);

  return {
    publicKeyJwk,
    privateKeyJwk,
    containerKeys,
  };
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
