<script setup>
import { ref, watch } from 'vue';
import useUserStore from '@/stores/user-store';
import useKeychainStore from '@/stores/keychain-store';
import useApiStore from '@/stores/api-store';

// move the following imports elsewhere
import { Util } from '@/lib/keychain';

const passphrase = ref('abc');
const { user } = useUserStore();
const { keychain } = useKeychainStore();
const { api } = useApiStore();

/*
ok, what do I need?
let's start with a static password.
then, let's get the keys and keypair
  */

async function doIt() {
  const keypair = await keychain.exportKeypair();
  const containerKeys = await keychain.exportKeys();

  // they should be strings
  if (typeof keypair.publicKey !== 'string') {
    throw Error(`whoops. that's not a string`);
  }
  if (typeof keypair.privateKey !== 'string') {
    throw Error(`whoops. that's not a string`);
  }
  // let's encrypt them with a password
  await createBackup(keypair.publicKey, keypair.privateKey, containerKeys, passphrase.value);
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

async function createBackup(publicKeyJwk, privateKeyJwk, containerKeys, password) {
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

  const resp = await api.createBackup(
    user.id,
    protectedContainerKeysStr,
    protectedKeypairStr,
    passwordWrappedKeyStr,
    saltStr
  );
  console.log(`POSTing to backup`);
  console.log(resp);
}
</script>

<template>
  <p>Hi I'm the backup and restore component</p>
  <button @click.prevent="doIt">do it</button>
</template>
