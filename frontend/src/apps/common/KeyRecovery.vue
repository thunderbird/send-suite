<script setup lang="ts">
import Btn from '@/apps/lockbox/elements/BtnComponent.vue';
import { ref } from 'vue';
import { PHRASE_SIZE } from './constants';

type Props = {
  makeBackup: () => void;
  restoreFromBackup: () => void;
  shouldBackup: boolean;
  words: string[];
  shouldRestore: boolean;
  shouldOverrideVisibility: boolean;
};
const {
  makeBackup,
  restoreFromBackup,
  shouldBackup,
  words: wordsProp,
  shouldRestore,
  shouldOverrideVisibility,
} = defineProps<Props>();

const words = ref(wordsProp);
</script>

<template>
  <p>
    Please make note of the following 12-word pass phrase. You will need it to
    restore your keys whenever you log into a new device. This guarantees that
    your files are encrypted on your device and your keys are never stored on
    our servers.
  </p>
  <p>Your {{ PHRASE_SIZE }} word pass phrase:</p>
  <div>
    <input
      v-for="(n, index) in PHRASE_SIZE"
      :key="index"
      v-model="words[index]"
    />
  </div>

  <Btn
    v-if="shouldBackup || shouldOverrideVisibility"
    primary
    @click.prevent="makeBackup"
    >Encrypt and backup keys</Btn
  >
  <Btn v-if="shouldRestore" primary @click.prevent="restoreFromBackup"
    >Restore keys from backup</Btn
  >
</template>
