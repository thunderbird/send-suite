<script setup lang="ts">
import ButtonComponent from '@/apps/send/elements/BtnComponent.vue';
import useMetricsStore from '@/stores/metrics';
import { CopyIcon } from '@thunderbirdops/services-ui';
import { useClipboard } from '@vueuse/core';
import { computed, ref } from 'vue';
import { useModal, useModalSlot } from 'vue-final-modal';
import ResetConfirmation from '../send/components/ResetConfirmation.vue';
import { useConfigStore } from '../send/stores/config-store';
import DownloadIcon from './DownloadIcon.vue';
import ResetModal from './modals/ResetModal.vue';

type Props = {
  makeBackup: () => void;
  resetKeys: () => void;
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
  resetKeys,
  restoreFromBackup,
  shouldBackup,
  words: wordsProp,
  shouldRestore,
  setPassphrase,
} = defineProps<Props>();

const { open, close: closefn } = useModal({
  component: ResetModal,
  attrs: {
    title: 'Reset keys?',
  },
  slots: {
    default: useModalSlot({
      component: ResetConfirmation,
      attrs: {
        closefn: () => closefn(),
        confirm: resetKeys,
      },
    }),
  },
});

const { metrics } = useMetricsStore();

const userSetPassword = ref('');
const words = computed(() => wordsProp);

const { copy } = useClipboard();
const { isProd } = useConfigStore();

const onCopy = (text: string) => {
  copy(text);
};

const submit = () => {
  metrics.capture('send.restore_keys_attempt', { type: 'attempt' });
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

  <button-component
    data-testid="encrypt-keys-button"
    v-if="shouldBackup"
    primary
    @click.prevent="makeBackup"
    >Encrypt and backup keys</button-component
  >
  <button-component v-if="shouldRestore" primary @click.prevent="submit"
    >Restore keys from backup</button-component
  >

  <div v-if="overrideVisibility" class="mt-4">
    <p>
      <strong>Note:</strong> If you lose this key, you will not be able to
      access your files. We do not store your key on our servers and cannot
      recover it for you.
    </p>
    <p>
      If you lost your key, you can reset it by clicking the button below. This
      will generate a new key and you will lose access to any files you created
      before this.
    </p>
    <button-component v-if="!isProd" danger class="mt-4" @click.prevent="open"
      >Reset keys and lose access to previously created files</button-component
    >
  </div>
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
