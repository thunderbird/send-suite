<script setup>
import { ref, inject, watch, computed } from 'vue';
import CreateAccessLink from './CreateAccessLink.vue';
import Avatar from '../elements/Avatar.vue';

const {
  deleteFolder,
  setCurrentFile,
  currentFolderId,
  setCurrentFolderId,
  folders,
  getFolders,
} = inject('folderManager');

const { sharedByMe } = inject('sharingManager');

const folder = ref(null);
/*
- show ManageSharing component
- reuse(?) shared-with component
  - or leave it TBD for now
- tags aren't implemented yet
- download link is TBD
*/
const accessLink = ref(null);

const recipients = computed(() => {
  const contacts = {};
  sharedByMe.value.filter((share) => (
    share.containerId === currentFolderId.value
  )).forEach((share) => {
    console.log(`have a share`)
    share.invitations.forEach((invitation) => {
      contacts[invitation.recipientId] = invitation.recipient;
    });
  });
  return Object.values(contacts);
});

watch(currentFolderId, () => {
  folder.value = folders.value.find(f => {
    console.log(f.name)
    return f.id === currentFolderId.value
  });
  console.log(folder.value)
})
</script>

<template>
  <div
  v-if="currentFolderId"
  class="flex flex-col items-center w-full h-screen px-3">
    <div class="w-full flex flex-col items-center">
      <img class="w-4/5" src="/folder-icon.png" alt="Folder icon" />
      <h2 class="font-semibold pt-3">{{ folder.name }}</h2>
      <!-- <h3 class="pt-1">1.37 MB</h3> -->
    </div>
    <div class="w-full h-full mt-10">
      <div class="h-full flex flex-col justify-between">

        <!-- Top -->
        <div>
          <CreateAccessLink :folderId="currentFolderId" />
          <div class="w-full mb-3">
            <div class="font-bold mb-1 text-gray-600">
              Shared With
            </div>
            <Avatar v-for="recipient in recipients"
            :key="recipient.id"
            :title="'No name'"
            :subtitle="recipient.email"
            :initials="true"
            />
          </div>
          <!-- <div class="w-full">
            <div class="font-bold mb-1 text-gray-600">
              Tags
            </div>
          </div> -->
        </div>

        <!-- Bottom -->
        <div>
          <div class="mb-4">
            <div class="font-semibold text-gray-600">
              Created
            </div>
            <div>
              7/10/23, 12:00 PM
            </div>
          </div>
          <div class="mb-2">
            <div class="font-semibold text-gray-600">
              Modified
            </div>
            <div>
              7/10/23, 12:00 PM
            </div>
          </div>
          <div class="flex flex-row justify-end gap-3 mb-3">
            <a href="#" @click.prevent>DL</a>
            <a href="#" @click.prevent>Share</a>
          </div>
        </div>
      </div>
    </div>
  </div>

</template>