<script setup lang="ts">
import ErrorGeneric from '@/apps/common/errors/ErrorGeneric.vue';
import { ref } from 'vue';
import BtnComponent from '../elements/BtnComponent.vue';
import ProgressBar from './ProgressBar.vue';

const { closefn, confirm, text } = defineProps<{
  closefn: () => Promise<string>;
  confirm: () => Promise<boolean>;
  text?: string;
}>();

const isDownloading = ref(false);
const isError = ref<string>();

const onConfirm = async () => {
  isDownloading.value = true;
  try {
    await confirm();
    closefn();
  } catch (e) {
    console.log(e);
    isError.value = e;
  } finally {
    isDownloading.value = false;
  }
};
</script>

<template>
  <div v-if="isError">
    <ErrorGeneric :error-message="isError" />
  </div>
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
