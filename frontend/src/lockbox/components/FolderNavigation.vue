<script setup>
import { IconRefresh, IconPlus, IconDots, IconDotsVertical, IconTag, IconFolder, IconFileText } from '@tabler/icons-vue';
import Btn from '@/lockbox/elements/Btn.vue';
import DragAndDropUpload from '@/lockbox/components/DragAndDropUpload.vue'

// for demonstration purposes only
const directory = [
  { type: 'folder', title: 'Folder Name' },
  { type: 'folder', title: 'Folder Name' },
  { type: 'file', title: 'Folder Name' },
  { type: 'folder', title: 'Folder Name' },
];
</script>

<template>
  <div class="flex flex-col gap-6 h-full">
    <!-- actions -->
    <header class="flex items-center justify-between pt-2 px-2.5">
      <Btn class="!px-1.5"><IconRefresh class="w-4 h-4" /></Btn>
      <Btn primary><IconPlus class="w-4 h-4" /> New Upload</Btn>
      <Btn class="!px-1.5"><IconDots class="w-4 h-4" /></Btn>
    </header>
    <!-- upload zone -->
    <section class="px-2.5">
      <DragAndDropUpload>
        <div class="
          h-36 flex justify-center items-center text-center font-bold text-lg text-gray-500
          border-4 border-dashed border-gray-300 rounded-lg
        ">
          Drag &amp; Drop<br />
          files here to upload
        </div>
      </DragAndDropUpload>
    </section>
    <!-- folder tree -->
    <section class="flex flex-col gap-2 p-2.5">
      <div class="flex justify-between items-center">
        <div class="font-semibold text-lg text-gray-900">Navigation</div>
        <Btn class="!px-1.5"><IconDotsVertical class="w-4 h-4" /></Btn>
      </div>
      <div class="flex flex-col gap-1 pl-3">
        <div v-for="f in directory">
          <div v-if="f.type == 'folder'" class="flex gap-1.5 items-center">
            <IconFolder class="w-5 h-5 !stroke-amber-800/50 fill-amber-800/20" />
            <span class="pb-1 text-gray-700">{{ f.title }}</span>
          </div>
          <div v-if="f.type == 'file'" class="flex gap-1.5 items-center">
            <IconFileText class="w-5 h-5 !stroke-gray-500 fill-gray-800/20" />
            <span class="pb-1 text-gray-700">{{ f.title }}</span>
          </div>
        </div>
      </div>
    </section>
    <!-- tags -->
    <section class="flex flex-col gap-2 p-2.5 border-t border-gray-300">
      <div class="flex justify-between items-center">
        <div class="font-semibold text-lg text-gray-900">Tags</div>
        <Btn class="!px-1.5"><IconDotsVertical class="w-4 h-4" /></Btn>
      </div>
      <div class="flex flex-col gap-1 pl-3">
        <div class="flex gap-2 items-center">
          <IconTag class="w-5 h-5 !stroke-red-500 fill-red-500/20" />
          <span class="text-gray-800 pb-1">Important</span>
        </div>
        <div class="flex gap-2 items-center">
          <IconTag class="w-5 h-5 !stroke-orange-600 fill-orange-600/20" />
          <span class="text-gray-800 pb-1">Work</span>
        </div>
        <div class="flex gap-2 items-center">
          <IconTag class="w-5 h-5 !stroke-green-600 fill-green-600/20" />
          <span class="text-gray-800 pb-1">Personal</span>
        </div>
        <div class="flex gap-2 items-center">
          <IconTag class="w-5 h-5 !stroke-blue-600 fill-blue-600/20" />
          <span class="text-gray-800 pb-1">Todo</span>
        </div>
        <div class="flex gap-2 items-center">
          <IconTag class="w-5 h-5 !stroke-fuchsia-600 fill-fuchsia-600/20" />
          <span class="text-gray-800 pb-1">Later</span>
        </div>
        <div class="flex gap-2 items-center">
          <IconTag class="w-5 h-5 !stroke-teal-600 fill-teal-600/20" />
          <span class="text-gray-800 pb-1">Upgrade</span>
        </div>
        <div class="flex gap-2 items-center">
          <IconTag class="w-5 h-5 !stroke-pink-600 fill-pink-600/20" />
          <span class="text-gray-800 pb-1">Party 🎉</span>
        </div>
      </div>
    </section>
  </div>
</template>
