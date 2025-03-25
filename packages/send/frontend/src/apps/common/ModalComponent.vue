<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <button class="modal-close" @click="$emit('close')">×</button>
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  emits: ['close'],
};
</script>

<style>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
}
.modal-content {
  position: relative;
  margin: 10% auto;
  padding: 20px;
  background: #fff;
  width: 50%;
}
.modal-close {
  position: absolute;
  top: 10px;
  right: 10px;
}
</style>
