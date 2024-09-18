<!-- eslint-disable vue/no-use-v-if-with-v-for -->
<script setup lang="ts">
import { DayJsKey } from '@/types';
import { inject, onMounted, watch } from 'vue';

import useFolderStore from '@/apps/lockbox/stores/folder-store';

import BreadCrumbs from '@/apps/lockbox/components/BreadCrumbs.vue';
import Btn from '@/apps/lockbox/elements/Btn.vue';
import FolderTableRowCell from '@/apps/lockbox/elements/FolderTableRowCell.vue';
import { IconDotsVertical, IconDownload, IconTrash } from '@tabler/icons-vue';
import { useDebounceFn } from '@vueuse/core';
import { useRoute, useRouter } from 'vue-router';

const folderStore = useFolderStore();

const dayjs = inject(DayJsKey);

const route = useRoute();
const router = useRouter();

const gotoRoute = useDebounceFn(() => {
  const id = Number(route.params.id);
  if (!!id) {
    folderStore.goToRootFolder(id);
    return;
  }
  folderStore.goToRootFolder(null);
}, 1);

onMounted(() => {
  gotoRoute();
});

watch(
  () => route.params.id,
  (newId, oldId) => {
    if (newId !== oldId) {
      gotoRoute();
    }
  }
);
</script>
<script lang="ts">
export default { props: { id: { type: String, default: 'null' } } };
</script>
<template>
  <div class="w-full flex flex-col gap-3">
    <h2 class="font-bold">Your Files</h2>
    <BreadCrumbs />
    <table class="w-full border-separate border-spacing-x-0 border-spacing-y-1">
      <thead>
        <tr>
          <th class="border-r border-b border-gray-300"></th>
          <th class="border-r border-b border-gray-300">Name</th>
          <th class="border-b border-gray-300"></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="folder in folderStore.visibleFolders"
          :key="folder.id"
          class="group cursor-pointer"
          @click="folderStore.setSelectedFolder(folder.id)"
          @dblclick="router.push({ name: 'folder', params: { id: folder.id } })"
        >
          <FolderTableRowCell
            :selected="folder.id === folderStore.selectedFolder?.id"
          >
            <img src="@/apps/lockbox/assets/folder.svg" class="w-8 h-8" />
          </FolderTableRowCell>
          <FolderTableRowCell
            :selected="folder.id === folderStore.selectedFolder?.id"
          >
            <div>{{ folder.name }}</div>
            <div class="text-sm">
              Last modified {{ dayjs().to(dayjs(folder.updatedAt)) }}
            </div>
          </FolderTableRowCell>
          <FolderTableRowCell
            :selected="folder.id === folderStore.selectedFolder?.id"
          >
            <div class="flex justify-between">
              <div
                class="flex gap-2 opacity-0 group-hover:!opacity-100 transition-opacity"
                :class="{
                  '!opacity-100': folder.id === folderStore.selectedFolder?.id,
                }"
              >
                <Btn danger @click="folderStore.deleteFolder(folder.id)">
                  <IconTrash class="w-4 h-4" />
                </Btn>
              </div>
              <Btn class="ml-auto">
                <IconDotsVertical class="w-4 h-4" />
              </Btn>
            </div>
          </FolderTableRowCell>
        </tr>
        <tr
          v-for="item in folderStore.rootFolder.items"
          v-if="folderStore.rootFolder"
          :key="item.id"
          class="group cursor-pointer"
          @click="folderStore.setSelectedFile(item.id)"
        >
          <FolderTableRowCell>
            <div class="flex justify-end">
              <img src="@/apps/lockbox/assets/file.svg" class="w-8 h-8" />
            </div>
          </FolderTableRowCell>
          <FolderTableRowCell>
            <div>{{ item.name }}</div>
            <div class="text-sm">
              Last modified {{ dayjs().to(dayjs(item.updatedAt)) }}
            </div>
          </FolderTableRowCell>
          <FolderTableRowCell>
            <div class="flex justify-between">
              <div
                class="flex gap-2 opacity-0 group-hover:!opacity-100 transition-opacity"
              >
                <Btn
                  secondary
                  @click="
                    folderStore.downloadContent(
                      item.uploadId,
                      item.containerId,
                      item.wrappedKey,
                      item.name
                    )
                  "
                >
                  <IconDownload class="w-4 h-4" />
                </Btn>
                <Btn
                  danger
                  @click="
                    folderStore.deleteItem(item.id, folderStore.rootFolder.id)
                  "
                >
                  <IconTrash class="w-4 h-4" />
                </Btn>
              </div>
              <Btn class="ml-auto">
                <IconDotsVertical class="w-4 h-4" />
              </Btn>
            </div>
          </FolderTableRowCell>
        </tr>
      </tbody>
    </table>
  </div>
</template>
