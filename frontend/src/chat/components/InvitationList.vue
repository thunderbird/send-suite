<script setup>
import { ref, inject, onMounted } from 'vue';

const { user } = inject('user');
const api = inject('api');
const keychain = inject('keychain');
const message = ref('');

const invitations = ref([]);

async function getInvitations() {
  invitations.value = await api.getInvitations(user.value.id);
}

async function acceptInvitation(invitation) {
  console.log(`accepting invitation ${invitation.id}`);
  console.log(invitation);
  const { wrappedKey } = invitation;

  // store the key
  await keychain.unwrapAndStoreContainerKey(wrappedKey, invitation.containerId);
  keychain.store();

  // and then send the api.acceptInvitation
  const resp = await api.acceptInvitation(
    invitation.id,
    invitation.containerId
  );
  if (resp) {
    message.value = 'Invitation accepted';
    getInvitations();
  }
}

function dismiss() {
  message.value = '';
}

onMounted(() => {
  getInvitations();
});
</script>

<template>
  <div v-if="message">
    <h2>{{ message }}</h2>
    <a href="#" @click="dismiss">dismiss</a>
  </div>
  <p>invitations here</p>
  <button
    class="h-7 font-semibold text-sm whitespace-nowrap border rounded-md hover:shadow-md px-2 transition-all ease-in-out inline-flex items-center justify-center gap-1 text-gray-500 dark:text-gray-800 dark:hover:text-gray-200 border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
    @click="getInvitations"
  >
    Check for invitations
  </button>
  <ul>
    <li v-for="invite of invitations">
      <a href="#" @click.prevent="acceptInvitation(invite)">
        official invitation from {{ invite.senderId }}
      </a>
    </li>
  </ul>
</template>
