<script setup lang="ts">
import ButtonComponent from '@/apps/lockbox/elements/BtnComponent.vue';
import posthog from 'posthog-js';
import { computed, ref } from 'vue';
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

const showOverride = computed(() => {
  return posthog.isFeatureEnabled('overwrite_keys') && shouldOverrideVisibility;
});

const words = ref(wordsProp);
</script>

<template>
  <p>
    Please make note of the following {{ PHRASE_SIZE }}-word pass phrase. You
    will need it to restore your keys whenever you log into a new device. This
    guarantees that your files are encrypted on your device and your keys are
    never stored on our servers.
  </p>
  <p>Your {{ PHRASE_SIZE }} word pass phrase:</p>
  <div>
    <input
      v-for="(_, index) in PHRASE_SIZE"
      :key="index"
      v-model="words[index]"
    />
  </div>

  <button-component v-if="shouldBackup" primary @click.prevent="makeBackup"
    >Encrypt and backup keys</button-component
  >
  <button-component
    v-if="shouldRestore"
    primary
    @click.prevent="restoreFromBackup"
    >Restore keys from backup</button-component
  >
  <button-component
    v-if="showOverride"
    :danger="true"
    @click.prevent="makeBackup"
    >Overwrite Keys and Backup</button-component
  >
</template>
