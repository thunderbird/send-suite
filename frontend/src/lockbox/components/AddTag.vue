<script setup>
import { ref, inject } from 'vue';
import TagLabel from '@/lockbox/elements/TagLabel.vue';
import { TagColors } from '@/lockbox/const';
import Btn from '@/lockbox/elements/Btn.vue';

const props = defineProps({
  type: String,
  id: Number,
});

const { addTagForContainer, addTagForItem } = inject('tagManager');

const name = ref('');
const color = ref('');

// Also show a list of existing tags?
async function addTag() {
  console.log(`you want to add the tag ${name.value} with color ${color.value}`);
  if (props.type === 'container') {
    addTagForContainer(props.id, name.value, color.value);
  } else if (props.type === 'item') {
    addTagForItem(props.id, name.value, color.value);
  }
}
</script>

<template>
  <form @submit.prevent="addTag">
    <input type="text" v-model="name" ref="input" placeholder="new tag name" />
    <div v-for="c in Object.keys(TagColors)" class="flex flex-row gap-1">
      <TagLabel :color="c" @click="color = c">
        {{ c }}
      </TagLabel>
    </div>
    <div class="flex flex-row justify-end">
      <Btn>Add Tag for id {{ props.id }}</Btn>
    </div>
  </form>
</template>
