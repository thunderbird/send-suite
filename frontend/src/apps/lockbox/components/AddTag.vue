<script setup lang="ts">
import { TagColors } from '@/apps/lockbox/const';
import Btn from '@/apps/lockbox/elements/BtnComponent.vue';
import TagLabel from '@/apps/lockbox/elements/TagLabel.vue';
import { ref } from 'vue';

const props = defineProps({
  type: String,
  id: Number,
});

// TODO: re-implement these as part of a tag-store
// once it is time to revisit tags.
// const { addTagForContainer, addTagForItem } = inject('tagManager');

const name = ref('');
const color = ref('');

// Also show a list of existing tags?
async function addTag() {
  console.log(
    `you want to add the tag ${name.value} with color ${color.value}`
  );
  if (props.type === 'container') {
    // addTagForContainer(props.id, name.value, color.value);
  } else if (props.type === 'item') {
    // addTagForItem(props.id, name.value, color.value);
  }
}
</script>

<template>
  <form @submit.prevent="addTag">
    <input ref="input" v-model="name" type="text" placeholder="new tag name" />
    <div
      v-for="c in Object.keys(TagColors)"
      :key="c"
      class="flex flex-row gap-1"
    >
      <TagLabel :color="c" @click="color = c">
        {{ c }}
      </TagLabel>
    </div>
    <div class="flex flex-row justify-end">
      <Btn>Add Tag for id {{ props.id }}</Btn>
    </div>
  </form>
</template>
