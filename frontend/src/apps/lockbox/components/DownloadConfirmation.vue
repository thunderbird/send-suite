<script setup lang="ts">
import { defineProps, ref } from 'vue';
import BtnComponent from '../elements/BtnComponent.vue';
import ProgressBar from './ProgressBar.vue';

const { closefn, confirm, text } = defineProps<{
  closefn: () => Promise<string>;
  confirm: () => Promise<boolean>;
  text?: string;
}>();

const isDownloading = ref(false);

const onConfirm = async () => {
  isDownloading.value = true;
  await confirm();
  isDownloading.value = false;
  closefn();
};
</script>

<template>
  <div v-if="isDownloading">
    <ProgressBar />
  </div>
  <div v-else>
    <p>
      {{ text }}
    </p>
    <div class="flex justify-center space-x-4 mt-8">
      <BtnComponent primary @click="onConfirm">Yes</BtnComponent>
      <BtnComponent @click="closefn">No</BtnComponent>
    </div>
  </div>
</template>
