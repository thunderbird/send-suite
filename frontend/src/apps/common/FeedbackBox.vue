<script setup lang="ts">
import OpenerIcon from './OpenerIcon.vue';
</script>

<template>
  <div style="margin-top: 1rem" data-testid="feedback-box">
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
  </div>
</template>

<style>
.text {
  color: #000;
  font-size: 9px;
  font-style: normal;
  font-weight: 700;
  line-height: normal;
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
