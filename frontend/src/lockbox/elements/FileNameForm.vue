<script setup>
import { ref, onMounted } from 'vue';
import Btn from '@/lockbox/elements/Btn.vue';

const emit = defineEmits(['renameComplete']);

import useFolderStore from '@/lockbox/stores/folder-store';

const folderStore = useFolderStore();

const selectedFileName = ref(folderStore.selectedFile.name);
const input = ref(null);

async function updateFileName() {
  const result = await folderStore.renameItem(
    folderStore.selectedFile.containerId,
    folderStore.selectedFile.id,
    selectedFileName.value
  );
  if (result) {
    emit('renameComplete');
  }
}

function resetForm() {
  selectedFileName.value = folderStore.selectedFile.name;
  emit('renameComplete');
}

onMounted(() => {
  input.value.focus();
  input.value.select();
});
</script>

<template>
  <form @submit.prevent="updateFileName">
    <input type="text" v-model="selectedFileName" ref="input" @keydown.esc="resetForm" />
    <div class="flex flex-row justify-end">
      <Btn @click="updateFileName">Rename</Btn>
    </div>
  </form>
</template>
