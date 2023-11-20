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

const { recentFolders, getRecentActivity, gotoRootFolder } = inject('folderManager');
</script>

<template>
  <section class="flex flex-col gap-2 p-2.5">
    <div class="flex justify-between items-center">
      <div class="font-semibold text-lg text-gray-900">Recent Activity</div>
    </div>
    <div class="flex flex-col gap-1 pl-3">
      <div v-for="f in recentFolders" @click="gotoRootFolder(f.id)" class="cursor-pointer">
        <div class="flex gap-1.5 items-center">
          <IconFolder class="w-5 h-5 !stroke-amber-800/50 fill-amber-800/20" />
          <span class="pb-1 text-gray-700">{{ f.name }} {{ f.id }}</span>
        </div>
        <!-- <div v-if="f.type == 'file'" class="flex gap-1.5 items-center">
            <IconFileText class="w-5 h-5 !stroke-gray-500 fill-gray-800/20" />
            <span class="pb-1 text-gray-700">{{ f.title }}</span>
          </div> -->
      </div>
    </div>
  </section>
</template>
