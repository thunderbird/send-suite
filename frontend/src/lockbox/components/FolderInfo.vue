<script setup>
import { inject, ref, computed, watchEffect} from 'vue';
import CreateAccessLink from '@/lockbox/components/CreateAccessLink.vue';
import FolderNameForm from '@/lockbox/elements/FolderNameForm.vue';
import Avatar from '@/lockbox/elements/Avatar.vue';
import Tag from '@/lockbox/elements/Tag.vue';
import Btn from '@/lockbox/elements/Btn.vue';
import { formatBytes } from '@/lib/utils'
import { IconDownload, IconShare } from '@tabler/icons-vue';

const { currentFolder } = inject('folderManager');
const { sharedByMe } = inject('sharingManager');

const recipients = computed(() => {
  const contacts = {};
  sharedByMe.value.filter((share) => (
    share.containerId === currentFolder.value.id
  )).forEach((share) => {
    console.log(`have a share`)
    share.invitations.forEach((invitation) => {
      contacts[invitation.recipientId] = invitation.recipient;
    });
  });
  return Object.values(contacts);
});


const showForm = ref(false);

watchEffect(
  () => {
    console.log(`🐓🐓🐓 ${currentFolder.value?.name}`)
    showForm.value = false
  }
)
</script>

<template>
  <div v-if="currentFolder" class="flex flex-col gap-6 h-full">
    <!-- info -->
    <header class="flex flex-col items-center gap-3 pt-6">
      <img src="@/assets/folder.svg" class="w-20 h-20" />
      <div class="font-semibold pt-4">
        <span
          v-if="!showForm"
          class="cursor-pointer"
          @click="showForm = true">
          {{ currentFolder.name }}
        </span>
        <FolderNameForm v-if="showForm" />
      </div>
      <div class="text-xs">{{ formatBytes(currentFolder.size) }}</div>
    </header>
    <!-- sharing config -->
    <CreateAccessLink
      :folderId="currentFolder.id"
    />
    <!-- people -->
    <section class="flex flex-col gap-2">
      <div class="font-semibold text-gray-600">Shared With</div>
      <div class="flex flex-wrap gap-1">
        <Avatar v-for="recipient in recipients" :key="recipient.id">
          {{ recipient.email.substring(0, 1) }}
        </Avatar>
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
      <label class="flex flex-col gap-1" v-if="currentFolder.createdAt">
        <span class="text-xs font-semibold text-gray-600">Created</span>
        <div class="text-xs">{{ currentFolder.createdAt }}</div>
      </label>
      <label class="flex flex-col gap-1" v-if="currentFolder.updatedAt">
        <span class="text-xs font-semibold text-gray-600">Modified</span>
        <div class="text-xs">{{ currentFolder.updatedAt }}</div>
      </label>
      <div class="flex justify-end gap-2">
        <Btn><IconDownload class="w-4 h-4" /></Btn>
        <Btn primary><IconShare class="w-4 h-4" /> Share</Btn>
      </div>
    </footer>
  </div>
</template>
