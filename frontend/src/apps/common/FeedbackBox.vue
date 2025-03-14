<script setup lang="ts">
import OpenerIcon from './OpenerIcon.vue';
</script>

<template>
  <section class="mx-4 mb-4" data-testid="feedback-box">
    <p class="text">
      Please take a moment to give us feedback or raise issues on:
    </p>
    <div class="link-container">
      <a
        href="https://github.com/thunderbird/send-suite/issues/new?labels=feedback-alpha&title=Alpha+Feedback:+&body=Your+description+here:"
      >
        <p>Github issues</p>
        <OpenerIcon />
      </a>
      <a href="https://forms.gle/qBYAjSRwMiTQ6KNr6">
        <p>Google forms</p>
        <OpenerIcon />
      </a>
    </div>
  </section>
</template>

<style scoped>
.text {
  font-size: 9px;
  font-weight: 700;
}
.link-container {
  display: flex;
  gap: 1rem;
}
.link-container a {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  color: var(--primary-default);
  text-decoration: none;
}
</style>
