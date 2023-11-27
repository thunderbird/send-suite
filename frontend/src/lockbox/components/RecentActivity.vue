<script setup>
import { inject, ref } from 'vue';
import {
  IconRefresh,
  IconPlus,
  IconDots,
  IconDotsVertical,
  IconTag,
  IconFolder,
  IconFileText,
} from '@tabler/icons-vue';

function sameUpdatedAt(obj1, obj2) {
  const d1 = new Date(obj1.updatedAt);
  const d2 = new Date(obj2.updatedAt);

  const isSameDate = d1.getDay() === d2.getDay() && d1.getMonth() === d2.getMonth() && d1.getYear() === d2.getYear();
  return isSameDate;
}

function truncateName(name, length = 17) {
  if (name.length <= length) {
    return name;
  }
  const shortened = name.substring(0, length);
  return `${shortened}...`;
}

const { recentFolders, gotoRootFolder } = inject('folderManager');
</script>

<template>
  <section class="flex flex-col gap-2 p-2.5">
    <div class="flex justify-between items-center">
      <div class="font-semibold text-lg text-gray-900">Recent Activity</div>
    </div>
    <div class="flex flex-col gap-1 pl-3">
      <template v-for="folder in recentFolders">
        <div v-if="folder.items.length > 0" @click="gotoRootFolder(folder.id)" class="cursor-pointer">
          <div class="flex gap-1.5 items-center">
            <IconFolder class="w-5 h-5 !stroke-amber-800/50 fill-amber-800/20" />
            <span class="pb-1 text-gray-700">{{ folder.name }}</span>
          </div>
          <template v-for="file in folder.items">
            <div v-if="sameUpdatedAt(file, folder)" class="flex ml-1.5 gap-1.5 items-center">
              <IconFileText class="w-5 h-5 !stroke-gray-500 fill-gray-800/20" />
              <span class="pb-1 text-gray-700">{{ truncateName(file.name) }}</span>
            </div>
          </template>
        </div>
      </template>
    </div>
  </section>
</template>
