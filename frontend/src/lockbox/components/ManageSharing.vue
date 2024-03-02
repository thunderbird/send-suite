<script setup>
/*
Given a folder that I own:
- get all the members, excluding me
- for each one, show a...dropdown?
- and an "Remove"

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
import CreateAccessLink from './CreateAccessLink.vue';
import PermissionsDropDown from '../elements/PermissionsDropDown.vue';
import useApiStore from '@/stores/api-store';
import useKeychainStore from '@/stores/keychain-store';

const { api } = useApiStore();
const { keychain } = useKeychainStore();
const { user } = useUserStore();

const {
  sharedByMe,
  getSharesForFolder,
  getGroupMembers,
  removeInvitationAndGroupMembership,
  updateInvitationPermissions,
  updateAccessLinkPermissions,
  getFoldersSharedByMe,
} = inject('sharingManager');

const props = defineProps({
  folderId: Number,
});
const sharer = new Sharer(user, keychain, api);
const newMember = ref(null);

/*
I'm going to need Core functions for
- creating new shares (don't I have this already?)
- adding members
  - will this be via Invitation?
- removing members
  - should I also track revocations?
- setting/updating permissions

*/

const shares = ref([]);
onMounted(getSharingInfo);

async function getSharingInfo() {
  await getFoldersSharedByMe();
  // ☝️☝️☝️ updates the sharing info
  // sourced by getSharesForFolder
  // TODO: consolidate, possibly add
  // a `refresh` flag to getSharesForFolder()
  const result = await getSharesForFolder(props.folderId);
  shares.value = result;
  console.log(result.length);
  console.log(`Just updated 🤡🤡🤡🤡🤡🤡🤡`);
}

async function removeMember(invitationId) {
  const success = await removeInvitationAndGroupMembership(props.folderId, invitationId);
  if (success) {
    await getSharingInfo();
  }
}

async function removeLink(accessLinkId) {
  const success = await callApi(`sharing/${accessLinkId}`, {}, 'DELETE');
  if (success) {
    await getSharingInfo();
  }
}

async function inviteMember(email) {
  const result = await sharer.shareContainerWithInvitation(props.folderId, email);
  if (!result) {
    console.log(`Could not invite member`);
    return;
  }
  console.log(`🚀🚀🚀🚀🚀🚀🚀 invitation sent!`);
  newMember.value = '';
  await getSharingInfo();
}

async function createAccessLinkComplete(url) {
  console.log(`Created access link ${url}`);
  alert(`
  (This should be a modal)

  If you did not enter a password, make sure to copy it now.
  You will not be able to view the full, valid URL again.

  ${url}
  `);
  await getSharingInfo();
}
function createAccessLinkError() {
  console.log(`Could not create access link`);
}

const INVITATION = 'invitation';
const ACCESSLINK = 'accessLink';
async function setPermission(type, containerId, id, permission) {
  if (type === INVITATION) {
    updateInvitationPermissions(containerId, id, permission);
  } else if (type === ACCESSLINK) {
    updateAccessLinkPermissions(containerId, id, permission);
  }
}
</script>

<template>
  <h1>Manage Sharing</h1>
  <label>
    member email:
    <input v-model="newMember" />
  </label>
  <button class="btn-primary" @click.prevent="inviteMember(newMember)">Invite Member</button>
  <br />
  <br />
  <hr />
  <br />
  <CreateAccessLink
    :containerId="folderId"
    @createAccessLinkComplete="createAccessLinkComplete"
    @createAccessLinkError="createAccessLinkError"
  />
  <ul v-for="share of shares">
    <li>
      Invitations:
      <ul>
        <li v-for="invitation of share.invitations" :key="invitation.id">
          id: {{ invitation.id }}<br />
          {{ invitation.recipient.email }}<br />
          <PermissionsDropDown
            :currentPermission="invitation.permission"
            @setPermission="(p) => setPermission(INVITATION, folderId, invitation.id, p)"
          />
          <button class="btn-primary" @click.prevent="removeMember(invitation.id)">⛔</button>
        </li>
      </ul>
    </li>
    <li>
      <br />
      <hr />
      <br />
    </li>
    <li>
      Links:
      <ul>
        <li v-for="accessLink of share.accessLinks" :key="accessLink.id">
          <a :href="'http://localhost:5173/share/' + accessLink.id">Access Link</a><br />
          <PermissionsDropDown
            :currentPermission="accessLink.permission"
            @setPermission="(p) => setPermission(ACCESSLINK, folderId, accessLink.id, p)"
          />
          <button class="btn-primary" @click.prevent="removeLink(accessLink.id)">⛔</button>
        </li>
      </ul>
    </li>
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

<style scoped>
li > ul {
  margin-left: 2rem;
}

li > ul > li {
  list-style: disc;
}
</style>
