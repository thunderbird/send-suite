<script setup>
import { ref, onMounted, inject, watch } from 'vue';
const emit = defineEmits(['setCurrentFolderId']);
const props = defineProps({
  folderPath: Array,
});

function loadFolder(id) {
  console.log(`you want to go to folder ${id}`);
  emit(`setCurrentFolderId`, id);
}

/*
So, could either store/manage the folder path
Or: I could derive it...
I mean, I've got all the folders.

Let's derive it.
I could also massage this sucker.
When I get all the folders for the user:
- I could loop through
- I could set a .parent for every folder that has a parentId

There's also the small matter of:
- does the API call return a tree? or an array?
- or do I need to keep calling the api for every child folder I descend into?

^^ I feel like I need to keep calling the API so that I can restrict access.

That means:
- I need for the API to accept an argument for the root folder id
- Then it needs to return:
  - that folder
  - any of its items
  - any folders that have it as the parent id

I need both kinds of functions:
- one that gets all the folders a user has been given access to
- one that gets the items and subfolders of a single folder

*/
</script>
<template>
  <ul>
    <li v-for="folder of props.folderPath">
      <a href="#" @click.prevent="loadFolder(folder.id)">
        {{ folder.name }}
      </a>
    </li>
  </ul>
</template>

<style scoped></style>
