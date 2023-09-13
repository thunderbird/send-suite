<script setup>
import { ref, onMounted, inject, watch } from 'vue';

const api = inject('api');
const { user } = inject('user');

const folders = ref([]);

async function loadFolderList(root = null) {
  if (!user.value.id) {
    console.log(`no valid user id`);
    return;
  }
  const dirItems = await api.getAllFolders(user.value.id);
  if (!dirItems) {
    return;
  }
  console.log(dirItems);
  folders.value = dirItems;
}

onMounted(async () => {
  loadFolderList();
});

watch(user, async () => {
  loadFolderList();
});
</script>
<template>
  <h2>Folders</h2>
  <button
    class="inline-flex items-center justify-center rounded-lg border h-10 w-10 transition duration-500 ease-in-out text-gray-500 hover:bg-gray-300 focus:outline-none"
    @click="loadFolderList"
  >
    🔃
  </button>
  <ul>
    <li v-for="folder of folders">
      <a href="#" @click.prevent>
        {{ folder.name }}
      </a>
      <ul>
        <li v-for="file of folder.items">
          <a href="#" @click.prevent>
            {{ file.name }}
          </a>
        </li>
      </ul>
    </li>
  </ul>
</template>
