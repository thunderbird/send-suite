<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import Btn from '@/apps/lockbox/elements/Btn.vue';
import useFolderStore from '@/apps/lockbox/stores/folder-store';

const emit = defineEmits(['renameComplete']);

const folderStore = useFolderStore();

const selectedFolderName = ref(folderStore.selectedFolder.name);
const input = ref(null);

async function updateFolderName() {
  const result = await folderStore.renameFolder(
    folderStore.selectedFolder.id,
    selectedFolderName.value
  );
  if (result) {
    emit('renameComplete');
  }
}

function resetForm() {
  selectedFolderName.value = folderStore.selectedFolder.name;
  emit('renameComplete');
}

watch(
  () => folderStore.selectedFolder,
  () => {
    resetForm();
  }
);

onMounted(() => {
  input.value.focus();
  input.value.select();
});
</script>

<template>
  <section class="flex flex-col gap-3">
    <form @submit.prevent="updateFolderName">
      <label class="flex flex-col gap-2">
        <input
          class="!rounded-r-none"
          type="text"
          v-model="selectedFolderName"
          ref="input"
          @keydown.esc="resetForm"
        />
        <div class="flex flex-row justify-end">
          <Btn @click="updateFolderName">Rename</Btn>
        </div>
      </label>
    </form>
  </section>
</template>
