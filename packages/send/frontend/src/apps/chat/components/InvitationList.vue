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
  <button class="btn-primary" @click="getInvitations">
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
