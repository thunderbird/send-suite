<script setup>
import { ref, watch } from 'vue';
import useUserStore from '@/stores/user-store';
import useKeychainStore from '@/stores/keychain-store';
import useApiStore from '@/stores/api-store';

// move the following imports elsewhere
import { Util } from '@/lib/keychain';

const MSG_NOT_COMPLEX = 'Please enter a pass phrase with 10 or more different words';
const passphrase = ref('');
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
  console.log(`POSTing to backup`);
  console.log(resp);
  msg.value = 'Backup complete';
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
</script>

<template>
  <h1>Backup and Restore</h1>
  <textarea v-model="passphrase"></textarea>
  <p v-if="msg">{{ msg }}</p>
  <button @click.prevent="makeBackup">Create Backup</button>
</template>
