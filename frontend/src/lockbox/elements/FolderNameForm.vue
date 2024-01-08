<script setup>
import { inject, ref, onMounted } from 'vue';
import Btn from '@/lockbox/elements/Btn.vue';

const emit = defineEmits(['renameComplete']);

const { renameFolder, currentFolder } = inject('folderManager');

const currentFolderName = ref(currentFolder.value.name);
const input = ref(null);

async function updateFolderName() {
  console.log(`you want to change the name to ${currentFolderName.value}`);

  const result = await renameFolder(currentFolder.value.id, currentFolderName.value);
  if (result) {
    emit('renameComplete');
  }
}

onMounted(() => {
  input.value.focus();
  input.value.select();
});
</script>

<template>
  <form @submit.prevent="updateFolderName">
    <input type="text" v-model="currentFolderName" ref="input" />
    <div class="flex flex-row justify-end">
      <Btn @click="updateFolderName">Rename</Btn>
    </div>
  </form>
</template>
