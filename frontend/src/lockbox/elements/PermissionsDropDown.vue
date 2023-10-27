<script setup>
import { ref } from 'vue';
import { PermissionsTable, PermissionsMap } from '@/lib/permissions';

const props = defineProps({
  currentPermission: Number,
});

const emit = defineEmits(['setPermission']);

const selected = ref(props.currentPermission);

function setPermission(event) {
  emit('setPermission', event.target.value);
}
</script>

<template>
  <select v-model="selected" @change="setPermission">
    <option v-for="p of Object.values(PermissionsMap)" :value="p" :key="p">
      {{ PermissionsTable[p] }}
    </option>
  </select>
</template>
