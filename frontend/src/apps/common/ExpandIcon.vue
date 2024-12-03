<script setup lang="ts">
type Props = {
  isOpen: boolean;
};
const { isOpen } = defineProps<Props>();
</script>

<template>
  <svg
    width="16"
    height="17"
    viewBox="0 0 16 17"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    :transform="isOpen ? `rotate(90 8 8.5)` : undefined"
  >
    <path
      d="M5.99993 4C5.86733 4.00001 5.74016 4.0527 5.64641 4.14648C5.4512 4.34173 5.4512 4.65827 5.64641 4.85352L9.29291 8.5L5.64641 12.1465C5.4512 12.3417 5.4512 12.6583 5.64641 12.8535C5.84166 13.0487 6.1582 13.0487 6.35345 12.8535L10.3535 8.85352C10.5486 8.65826 10.5486 8.34175 10.3535 8.14648L6.35345 4.14648C6.25975 4.05268 6.13253 4.00001 5.99993 4Z"
      fill="#1A202C"
    />
  </svg>
</template>
