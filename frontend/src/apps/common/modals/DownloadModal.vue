<script setup lang="ts">
import { VueFinalModal } from 'vue-final-modal';
import CloseIcon from '../CloseIcon.vue';

defineProps<{
  title?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', modelValue: boolean): void;
}>();
</script>

<template>
  <VueFinalModal
    class="flex justify-center items-center"
    content-class="flex flex-col p-4 bg-white rounded border border-gray-100"
    @update:model-value="(val) => emit('update:modelValue', val)"
  >
    <div class="flex items-center h-10">
      <h1 v-if="title" class="text-2xl">
        {{ title }}
      </h1>
      <button class="ml-auto" @click="emit('update:modelValue', false)">
        <CloseIcon />
      </button>
    </div>
    <slot />
  </VueFinalModal>
</template>
