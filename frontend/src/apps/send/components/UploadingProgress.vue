<script setup lang="ts"></script>
<template>
  <div
    class="flex flex-col gap-2 items-center justify-center p-4 rounded-lg transition duration-500 ease-in-out text-white bg-blue-400 hover:bg-blue-300"
    role="status"
  >
    <p>Uploading...</p>
    <div>
      <svg
        class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        ></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V2.5"
        ></path>
      </svg>
    </div>

    <span class="sr-only">Uploading...</span>
  </div>
</template>
