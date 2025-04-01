<script setup lang="ts"></script>
<template>
  <div
    class="flex flex-col items-center justify-center p-4 rounded-lg transition duration-500 ease-in-out text-white"
    role="status"
  >
    <div>
      <svg
        class="animate-spin h-5 w-5 text-white"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25 fill"
          cx="12"
          cy="12"
          r="10"
          stroke-width="4"
        ></circle>
        <path class="opacity-75 fill" d="M4 12a8 8 0 018-8V2.5"></path>
      </svg>
    </div>
  </div>
</template>

<style scoped>
.fill {
  fill: var(--colour-neutral-border);
  stroke: var(--colour-neutral-border-intense);
}
</style>
