<script setup>
import { inject, ref } from 'vue';
import Avatar from '@/lockbox/elements/Avatar.vue';
import Tag from '@/lockbox/elements/Tag.vue';
import Btn from '@/lockbox/elements/Btn.vue';
import { IconDownload, IconShare, IconLink, IconEye, IconEyeOff } from '@tabler/icons-vue';

const { currentFolderId } = inject('folderManager');
const showPassword = ref(false);
</script>

<template>
  <div v-if="currentFolderId" class="flex flex-col gap-6 h-full">
    <!-- info -->
    <header class="flex flex-col items-center gap-3 pt-6">
      <img src="@/assets/folder.svg" class="w-20 h-20" />
      <div class="font-semibold pt-4">Folder Name ({{ currentFolderId }})</div>
      <div class="text-xs">1.37MB</div>
    </header>
    <!-- sharing config -->
    <section class="flex flex-col gap-3">
      <label class="flex flex-col gap-2">
        <span class="text-xs font-semibold text-gray-600">Share Link</span>
        <div class="flex">
          <input type="text" value="https://pro.thunderbird.com" class="!rounded-r-none" />
          <Btn primary class="!rounded-l-none !px-1.5"><IconLink class="w-4 h-4" /></Btn>
        </div>
      </label>
      <label class="flex flex-col gap-2">
        <span class="text-xs font-semibold text-gray-600">Link Expires</span>
        <select>
          <option>Never</option>
        </select>
      </label>
      <label class="flex flex-col gap-2 relative">
        <span class="text-xs font-semibold text-gray-600">Password</span>
        <input :type="showPassword ? 'text' : 'password'" value="abcdefg" />
        <button
          @click.prevent="showPassword = !showPassword"
          class="absolute right-3 bottom-2 select-none"
        >
          <IconEye v-if="showPassword" class="w-4 h-4" />
          <IconEyeOff v-else class="w-4 h-4" />
        </button>
      </label>
    </section>
    <!-- people -->
    <section class="flex flex-col gap-2">
      <div class="font-semibold text-gray-600">Shared With</div>
      <div class="flex flex-wrap gap-1">
        <Avatar v-for="p in 8" :key="p">N</Avatar>
      </div>
    </section>
    <!-- tags -->
    <section class="flex flex-col gap-2">
      <div class="font-semibold text-gray-600">Tags</div>
      <div class="flex flex-wrap gap-1">
        <Tag class="!bg-red-500">Important</Tag>
        <Tag class="!bg-orange-600">Work</Tag>
        <Tag class="!bg-blue-600">Todo</Tag>
        <Tag class="!bg-teal-600">Upgrade</Tag>
        <Tag class="!bg-pink-600">Party 🎉</Tag>
      </div>
    </section>
    <!-- meta -->
    <footer class="mt-auto flex flex-col gap-3">
      <label class="flex flex-col gap-1">
        <span class="text-xs font-semibold text-gray-600">Created</span>
        <div class="text-xs">7/10/23, 12:00 PM</div>
      </label>
      <label class="flex flex-col gap-1">
        <span class="text-xs font-semibold text-gray-600">Modified</span>
        <div class="text-xs">7/10/23, 12:00 PM</div>
      </label>
      <div class="flex justify-end gap-2">
        <Btn><IconDownload class="w-4 h-4" /></Btn>
        <Btn primary><IconShare class="w-4 h-4" /> Share</Btn>
      </div>
    </footer>
  </div>
</template>
