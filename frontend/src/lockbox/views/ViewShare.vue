<script setup>
import { ref, onMounted, inject } from 'vue';
import { useRoute } from 'vue-router';
const route = useRoute();
const { getSharedFolder } = inject('sharingManager');

const folder = ref(null);
const containerId = ref(null);

onMounted(async () => {
  console.log(`ViewShare ready to get folder for hash`);
  // Using route.params.hash, get the folder contents
  const { share } = await getSharedFolder(route.params.hash);
  folder.value = share.container;
  containerId.value = share.container.id;
});
</script>
<template>
  <h1>tbd</h1>
  <p>containerId: {{ containerId }}</p>
  <ul class="file-list" v-if="folder">
    <li v-for="file of folder.items">
      <a href="#" @click.prevent="">
        {{ file.name }}
      </a>
    </li>
  </ul>
</template>
