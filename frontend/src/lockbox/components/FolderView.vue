<script setup>
import { ref, onMounted, inject, watch } from 'vue';
import { download } from '@/lib/filesync';

const emit = defineEmits(['setFolderId']);
const props = defineProps({
  // folders: Array,
  folderId: Number,
});

function loadFolder(id) {
  console.log(`you want to go to folder ${id}`);
  emit(`setFolderId`, id);
}

const api = inject('api');
const user = inject('user');

const folders = ref([]);

const downloadKeyMap = {};

async function loadFolderList(root = null) {
  if (!user.id) {
    console.log(`no valid user id`);
    return;
  }
  const dirItems = await api.getAllFolders(user.id);
  console.log(dirItems);
  if (!dirItems) {
    return;
  }

  console.log(dirItems);
  folders.value = dirItems;
}

async function downloadContent(id, folderId, wrappedKey, filename) {
  if (!id) {
    console.log(`no id`);
    return;
  }
  if (!folderId) {
    console.log(`no id`);
    return;
  }

  let wrappingKey;
  try {
    wrappingKey = await keychain.get(folderId);
  } catch (e) {
    console.log(`cannot unwrap content key - no key for folder`);
    return;
  }

  const { size, type } = await api.getUploadMetadata(id);
  if (!size) {
    console.log(`no size`);
    return;
  }

  const contentKey = await keychain.container.unwrapContentKey(
    wrappedKey,
    wrappingKey
  );

  await download(id, size, contentKey, false, filename, type);
}

onMounted(async () => {
  loadFolderList();
});

// watch(user, async () => {
//   loadFolderList();
// });
</script>
<template>
  <h2>Folders</h2>
  <button class="btn-primary" @click="loadFolderList">🔃</button>
  <ul>
    <li v-for="folder of folders">
      <a href="#" @click.prevent="loadFolder(folder.id)">
        {{ folder.name }}
      </a>

      <ul>
        <li v-for="file of folder.items">
          <a
            href="#"
            @click.prevent="
              downloadContent(
                file.uploadId,
                folder.id,
                file.wrappedKey,
                file.name
              )
            "
          >
            {{ file.name }}
          </a>
        </li>
      </ul>
    </li>
  </ul>
</template>
