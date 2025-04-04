<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import init from '@/lib/init';

import useKeychainStore from '@/stores/keychain-store';
import useUserStore from '@/stores/user-store';

import ErrorUploading from '@/apps/send/components/ErrorUploading.vue';
import useFolderStore from '@/apps/send/stores/folder-store';
import useSharingStore from '@/apps/send/stores/sharing-store';

import ShieldIcon from '@/apps/common/ShieldIcon.vue';
import { EXTENSION_READY, SHARE_ABORTED, SHARE_COMPLETE } from '@/lib/const';
import { restoreKeysUsingLocalStorage } from '@/lib/keychain';
import useApiStore from '@/stores/api-store';
import { IconEye, IconEyeClosed } from '@tabler/icons-vue';
import ProgressBar from '../components/ProgressBar.vue';
import { default as Btn } from '../elements/BtnComponent.vue';
import { useStatusStore } from '../stores/status-store';

const userStore = useUserStore();
const { keychain } = useKeychainStore();
const { api } = useApiStore();
const { validators } = useStatusStore();

const folderStore = useFolderStore();
const sharingStore = useSharingStore();

const isUploading = ref(false);
const isError = ref(false);
const password = ref('');
const fileBlob = ref<Blob>(null);
const isAllowed = ref(true);
const message = ref('');
const passwordFieldType = ref<'password' | 'text'>('password');
const isPasswordProtected = ref(false);
const isPasswordVisible = computed(() => {
  return passwordFieldType.value === 'text';
});

// TODO: Make it so you can mix-and-match.
// i.e., you can convert attachment to tb send
// *and* you can choose existing files.
// Need to decide if you should be able to designate
// the location of the file from the tb send popup.
async function uploadAndShare() {
  try {
    isUploading.value = true;
    const itemObj = await folderStore.uploadItem(
      fileBlob.value,
      folderStore.defaultFolder.id,
      api
    );
    if (!itemObj) {
      uploadAborted();
      isError.value = true;
      isUploading.value = false;
      return;
    }
    fileBlob.value = null;
    const url = await sharingStore.shareItems([itemObj], password.value);
    if (!url) {
      shareAborted();
      isError.value = true;
      isUploading.value = false;
      return;
    }
    shareComplete(url);
    isUploading.value = false;
  } catch {
    isError.value = true;
    isUploading.value = false;
    return;
  }
}

function uploadAborted() {
  console.log('upload aborted for reasons');
}

function shareComplete(url) {
  console.log(`you should tell the user that it's done`);

  browser.runtime.sendMessage({
    type: SHARE_COMPLETE,
    url,
    aborted: false,
  });
  window.close();
}

function shareAborted() {
  console.log(`Could not finish creating share for tb send`);

  browser.runtime.sendMessage({
    type: SHARE_ABORTED,
    url: '',
    aborted: true,
  });
  window.close();
}

function togglePasswordVisibility() {
  passwordFieldType.value =
    passwordFieldType.value === 'password' ? 'text' : 'password';
}

function togglePasswordField() {
  isPasswordProtected.value = !isPasswordProtected.value;
}

onMounted(async () => {
  try {
    await restoreKeysUsingLocalStorage(keychain, api);
    await init(userStore, keychain, folderStore);
    console.log(`adding listener in Popup for runtime messages`);

    browser.runtime.onMessage.addListener(async (message) => {
      console.log(message);
      const { data } = message;
      fileBlob.value = data;
      console.log(`We set the fileBlob to:`);
      console.log(data);
    });
    browser.runtime.sendMessage({
      type: EXTENSION_READY,
    });
  } catch {
    console.log(
      `Cannot access browser.runtime, probably not running as an extension`
    );
  }
  // At the very end we have to validate that everything is in order for the upload to happen
  const { hasBackedUpKeys, isTokenValid } = await validators();

  if (!hasBackedUpKeys) {
    isAllowed.value = false;
    message.value = `Please make sure you have backed up or restored your keys. Go back to the compositon panel and follow the instructions`;
    return;
  }
  if (!isTokenValid) {
    isAllowed.value = false;
    message.value = `You're not logged in properly. Please go back to the compositon panel to log back in`;
    return;
  }
});
</script>

<template>
  <div v-if="isAllowed">
    <div v-if="isError">
      <ErrorUploading />
    </div>

    <div v-if="isUploading">
      <ProgressBar />
    </div>

    <form @submit.prevent="uploadAndShare">
      <div class="flex items-center gap-x-2">
        <input
          type="checkbox"
          :disabled="isUploading"
          @click="togglePasswordField"
        />
        <h3 class="font-semibold">Require password</h3>
      </div>

      <div v-if="isPasswordProtected" class="password">
        <input
          v-model="password"
          :type="passwordFieldType"
          :disabled="isUploading"
          class="w-full"
        />
        <button @click.prevent="togglePasswordVisibility">
          <IconEye v-if="!isPasswordVisible" />
          <IconEyeClosed v-if="isPasswordVisible" />
        </button>
      </div>

      <p class="mb-6">
        The recipient will need this password to access this file.
      </p>

      <div class="flex justify-center">
        <Btn primary class="max-w-md">
          <ShieldIcon />
          <input
            type="submit"
            value="Encrypt and Upload"
            :disabled="isUploading"
          />
        </Btn>
      </div>
    </form>
  </div>
  <div v-else>
    <p>{{ message }}</p>
  </div>
</template>

<style scoped>
h2 {
  font-size: 13px;
}
p {
  font-size: 10px;
  font-weight: 400;
}

form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 320px;
  margin-bottom: 2rem;
}

.password {
  position: relative;
}
.password button {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
}
</style>
