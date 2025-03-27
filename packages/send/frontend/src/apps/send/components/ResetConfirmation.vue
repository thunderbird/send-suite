<script setup lang="ts">
import BtnComponent from '../elements/BtnComponent.vue';

const { closefn, confirm, text } = defineProps<{
  closefn: () => Promise<string>;
  confirm: () => void;
  text?: string;
}>();

const onConfirm = async () => {
  try {
    await confirm();
    closefn();
  } catch (e) {
    console.log(e);
  }
};
</script>

<template>
  <h1>
    {{ text }}
  </h1>
  <div class="mt-4">
    <p>
      Please make sure you want to reset your keys. This action will
      <strong class="text-red-600">delete all your uploads and folders</strong>.
    </p>
    <div class="space-x-4 mt-8">
      <BtnComponent danger @click="onConfirm">Yes</BtnComponent>
      <BtnComponent @click="closefn">No</BtnComponent>
    </div>
  </div>
</template>

<style scoped>
* {
  max-width: 400px;
}
</style>
