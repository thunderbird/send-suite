<script setup>
import { ref, watch } from 'vue';
import Btn from '@/lockbox/elements/Btn.vue';

import useUserStore from '@/stores/user-store';
import useKeychainStore from '@/stores/keychain-store';
import useApiStore from '@/stores/api-store';

// move the following imports elsewhere
import { Util } from '@/lib/keychain';

const MSG_NOT_COMPLEX = 'Please enter a pass phrase with 10 or more different words';
const MSG_INCORRECT_PASSPHRASE = 'Passphrase is incorrect';
const MSG_COULD_NOT_RETRIEVE = 'Could not retrieve backup from the server.';
const passphrase = ref('one two three four five six seven eight nine ten');
const msg = ref('');
const { user } = useUserStore();
const { keychain } = useKeychainStore();
const { api } = useApiStore();

async function makeBackup() {
  if (!passphraseIsComplex(passphrase.value)) {
    msg.value = MSG_NOT_COMPLEX;
    return;
  }

  msg.value = '';

  const keypair = await keychain.exportKeypair();
  const containerKeys = await keychain.exportKeys();

  // let's encrypt them with a password
  const { protectedContainerKeysStr, protectedKeypairStr, passwordWrappedKeyStr, saltStr } = await encryptAll(
    keypair.publicKey,
    keypair.privateKey,
    containerKeys,
    passphrase.value
  );
  const resp = await api.createBackup(
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

  const resp = await api.getBackup(user.id);
  if (!resp) {
    msg.value = MSG_COULD_NOT_RETRIEVE;
    return;
  }

  msg.value = '';

  const { backupContainerKeys, backupKeypair, backupKeystring, backupSalt } = resp;
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
    console.log(e);
    msg.value = MSG_INCORRECT_PASSPHRASE;
  }
}

function passphraseIsComplex(words) {
  const wordSet = new Set(words.split(' '));
  return wordSet.size >= 10;
}

async function encryptKeys(containerKeysObj, key, salt) {
  const obj = {};
  await Promise.all(
    Object.keys(containerKeysObj).map(async (k) => {
      const encrypted = await keychain.backup.encryptBackup(containerKeysObj[k], key, salt);
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
      const decrypted = await keychain.backup.decryptBackup(protectedContainerKeysObj[k], key, salt);
      obj[k] = decrypted;
      return true;
    })
  );

  return obj;
}

async function encryptAll(publicKeyJwk, privateKeyJwk, containerKeys, password) {
  const key = await keychain.generateBackupKey();
  const salt = Util.generateSalt();

  const protectedContainerKeys = await encryptKeys(containerKeys, key, salt);
  const protectedContainerKeysStr = JSON.stringify(protectedContainerKeys);

  const publicKeyCiphertext = await keychain.backup.encryptBackup(publicKeyJwk, key, salt);
  const privateKeyCiphertext = await keychain.backup.encryptBackup(privateKeyJwk, key, salt);

  const protectedKeypair = {
    publicKey: publicKeyCiphertext,
    privateKey: privateKeyCiphertext,
  };
  const protectedKeypairStr = JSON.stringify(protectedKeypair);

  const passwordWrappedKeyStr = await keychain.password.wrapContentKey(key, password, salt);
  const saltStr = Util.arrayBufferToBase64(salt);
  return {
    protectedContainerKeysStr,
    protectedKeypairStr,
    passwordWrappedKeyStr,
    saltStr,
  };
}

async function decryptAll(protectedContainerKeysStr, protectedKeypairStr, passwordWrappedKeyStr, saltStr, password) {
  const salt = Util.base64ToArrayBuffer(saltStr);
  console.log(`got salt`);
  console.log(salt);

  const key = await keychain.password.unwrapContentKey(passwordWrappedKeyStr, password, salt);
  console.log(`got key`);
  console.log(key);

  const protectedKeypair = JSON.parse(protectedKeypairStr);
  console.log(`got keypair`);
  console.log(protectedKeypair);
  const publicKeyCiphertext = protectedKeypair.publicKey;
  const privateKeyCiphertext = protectedKeypair.privateKey;

  const publicKeyJwk = await keychain.backup.decryptBackup(publicKeyCiphertext, key, salt);
  console.log(`got public key`);
  console.log(publicKeyJwk);
  const privateKeyJwk = await keychain.backup.decryptBackup(privateKeyCiphertext, key, salt);
  console.log(`got private key`);
  console.log(privateKeyJwk);

  const protectedContainerKeys = JSON.parse(protectedContainerKeysStr);
  const containerKeys = await decryptKeys(protectedContainerKeys, key, salt);
  console.log(containerKeys);

  return {
    publicKeyJwk,
    privateKeyJwk,
    containerKeys,
  };
}
</script>

<template>
  <div class="flex min-h-screen">
    <div class="flex flex-col gap-4 grow">
      <header
        class="w-full sticky top-0 flex items-center justify-between px-4 py-2 bg-white/90 border-b border-gray-300"
      >
        <h1>Backup and Restore</h1>
      </header>
      <div class="w-full flex flex-col gap-3 px-4">
        <textarea v-model="passphrase"></textarea>
        <p v-if="msg">{{ msg }}</p>
        <Btn primary @click.prevent="makeBackup">Backup</Btn>
        <Btn primary @click.prevent="restoreFromBackup">Restore</Btn>
      </div>
    </div>
  </div>
</template>
