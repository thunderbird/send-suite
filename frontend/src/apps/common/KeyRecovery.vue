<script setup lang="ts">
import ButtonComponent from '@/apps/send/elements/BtnComponent.vue';
import { CopyIcon } from '@thunderbirdops/services-ui';
import { useClipboard } from '@vueuse/core';
import { computed, ref } from 'vue';
import DownloadIcon from './DownloadIcon.vue';

type Props = {
  makeBackup: () => void;
  restoreFromBackup: () => void;
  shouldBackup: boolean;
  words: string[];
  shouldRestore: boolean;
  regeneratePassphrase: () => void;
  setPassphrase: (newPassphrase: string) => void;
  overrideVisibility: boolean;
  downloadPassphrase: () => void;
};
const {
  makeBackup,
  restoreFromBackup,
  shouldBackup,
  words: wordsProp,
  shouldRestore,
  setPassphrase,
} = defineProps<Props>();

const words = computed(() => wordsProp);
const userSetPassword = ref('');
const { copy } = useClipboard();

const onCopy = (text: string) => {
  copy(text);
};

const submit = () => {
  setPassphrase(userSetPassword.value);
  restoreFromBackup();
};
</script>

<template>
  <p>
    The following key is used to restore your profile whenever you log into a
    new device. This guarantees that your files are encrypted on your device and
    your key is never stored on our servers. Please copy and/or download this
    key to a safe location for use later.
  </p>

  <div v-if="shouldBackup" class="container">
    <select value="Memorable passphrase">
      <option value="Memorable passphrase" selected>
        Memorable passphrase
      </option>
      <option
        disabled
        aria-details="not available during beta"
        aria-disabled="true"
        value="Random passphrase"
      >
        Random passphrase (unavailable during beta)
      </option>
    </select>
    <button-component primary @click.prevent="regeneratePassphrase"
      >Generate</button-component
    >
  </div>

  <div v-if="shouldBackup || overrideVisibility" class="container">
    <input class="w-full" type="text" :value="words.join(' - ')" disabled />
    <div class="flex button_box">
      <button @click.prevent="onCopy(words.join(' - '))">
        <CopyIcon />
      </button>
      <button @click.prevent="downloadPassphrase()">
        <DownloadIcon />
      </button>
    </div>
  </div>

  <div v-if="shouldRestore" class="flex">
    <input v-model="userSetPassword" class="w-full" type="text" />
  </div>

  <button-component v-if="shouldBackup" primary @click.prevent="makeBackup"
    >Encrypt and backup keys</button-component
  >
  <button-component v-if="shouldRestore" primary @click.prevent="submit"
    >Restore keys from backup</button-component
  >
</template>

<style scoped>
.container {
  display: grid;
  grid-template-columns: 3fr 1fr;
  gap: 0.5rem;
}
.button_box button {
  width: 31px;
}
</style>
