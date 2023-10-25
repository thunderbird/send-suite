<script setup>
/*
Given a folder that I own:
- get all the members, excluding me
- for each one, show a...dropdown?
- and an "Remove"

Dropdown should include:
- read-only
- edit (upload files, replace existing)
- admin (manage sharing)

Also show controls for inviting new members
Or creating an anonymous share (which creates a new container).
^^^^^ WAIT.
When does it create a new share?
Maybe I could create kinds of invitations:
  - pro-only (only pros can join)
  - member-only (anyone with account can join)
  - anonymous (creates a new share)
*/
import { inject, ref, onMounted } from 'vue';
import Sharer from '@/common/share';

const api = inject('api');
const keychainRef = inject('keychainRef');
const userRef = inject('userRef');
const { getSharesForFolder, getGroupMembers, removeGroupMember } =
  inject('sharingManager');

// const emit = defineEmits(['setCurrentFolderId']);
const props = defineProps({
  folderId: Number,
});
const sharer = new Sharer(userRef, keychainRef, api);
const newMember = ref(null);

/*
I'm going to need Core functions for
- creating new shares (don't I have this already?)
- adding members
  - will this be via Invitation?
- removing members
  - should I also track revocations?
- setting/updating permissions


What about transferring ownership?
*/

const shares = ref([]);
onMounted(getSharingInfo);

async function getSharingInfo() {
  const result = await getSharesForFolder(props.folderId);
  console.log(`🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉`);
  console.log(result);
  shares.value = result;
}
async function removeMember(userId) {
  const success = await removeGroupMember(userId, props.folderId);
  if (success) {
    getSharingInfo();
  }
}

async function inviteMember(userId) {
  const result = await sharer.shareContainerWithInvitation(
    props.folderId,
    userId
  );
  if (!result) {
    console.log(`Could not invite member`);
    return;
  }
  console.log(`🚀🚀🚀🚀🚀🚀🚀 invitation sent!`);
}

async function createAccessLink() {}
</script>

<template>
  <h1>Manage Sharing</h1>
  <label>
    User id:
    <input v-model="newMember" />
  </label>
  <button class="btn-primary" @click.prevent="inviteMember(newMember)">
    Invite Member
  </button>
  <ul>
    <!-- <template v-for="user of groupMembers">
      <li v-if="userRef.id !== user.user.id">
        {{ user.user.email }} {{ user.user.id }}
        <button class="btn-primary" @click.prevent="removeMember(user.user.id)">
          Remove
        </button>
      </li>
    </template> -->
  </ul>
  <!-- show a form for adding a new member -->
  <!-- this should create an invitation -->

  <!-- maybe show pending invitations? -->
  <!-- with the ability to cancel it -->

  <!-- later: show permissions drop down -->
</template>
