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
// const emit = defineEmits(['setCurrentFolderId']);
const props = defineProps({
  folderId: Number,
});

const api = inject('api');
const userRef = inject('userRef');
const { getGroupMembers } = inject('sharingManager');

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

const groupMembers = ref([]);
onMounted(loadGroupMembers);

async function loadGroupMembers() {
  const members = await getGroupMembers(props.folderId);
  // console.log(members);
  groupMembers.value = members;
}
async function removeMember(userId) {
  const success = await api.removeMemberFromContainer(userId, props.folderId);
  if (success) {
    loadGroupMembers();
  }
}
</script>

<template>
  <h1>this is the manage sharing thingy</h1>
  <!-- list each member, except me (or including me?) -->
  <ul>
    <template v-for="user of groupMembers">
      <li v-if="userRef.id !== user.user.id">
        {{ user.user.email }} {{ user.user.id }}
        <a href="#" @click.prevent="removeMember(user.user.id)">Remove</a>
      </li>
    </template>
  </ul>
  <!-- show option to remove them -->
  <!-- later: show permissions drop down -->

  <!-- show a form for adding a new member -->
  <!-- this should create an invitation -->

  <!-- maybe show pending invitations? -->
  <!-- with the ability to cancel it -->
</template>
