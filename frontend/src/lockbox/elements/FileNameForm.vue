<script setup>
import { inject, ref, onMounted } from 'vue';
import Btn from '@/lockbox/elements/Btn.vue';

const emit = defineEmits(['renameComplete']);

const { renameItem, currentFile } = inject('folderManager');

const currentFileName = ref(currentFile.value.name);
const input = ref(null);

async function updateFileName() {
  console.log(`you want to change the name to ${currentFileName.value}`);

  const result = await renameItem(currentFile.value.containerId, currentFile.value.id, currentFileName.value);
  if (result) {
    emit('renameComplete');
  }
}

onMounted(() => {
  input.value.focus();
});
</script>

<template>
  <form @submit.prevent="updateFileName">
    <input type="text" v-model="currentFileName" ref="input" />
    <div class="flex flex-row justify-end">
      <Btn @click="updateFileName">Rename</Btn>
    </div>
  </form>
</template>
