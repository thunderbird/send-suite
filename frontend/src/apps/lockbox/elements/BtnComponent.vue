<script setup lang="ts">
type Props = {
  primary?: boolean;
  secondary?: boolean;
  danger?: boolean;
  size?: 'medium' | 'small' | 'xsmall';
};

withDefaults(defineProps<Props>(), {
  primary: false,
  secondary: false,
  danger: false,
  size: 'small',
});
</script>

<template>
  <button
    class="base-button"
    :class="{
      primary,
      secondary,
      danger,
      default: !primary && !secondary && !danger,
      'size-medium': size === 'medium',
      'size-small': size === 'small',
      'size-xsmall': size === 'xsmall',
    }"
  >
    <slot></slot>
  </button>
</template>

<style scoped>
.base-button {
  border-radius: 3px;
  box-shadow: 0px 6px 3px -4px rgba(21, 66, 124, 0.3);
  display: inline-flex;
  min-width: 96px;
  padding: 8px 16px;
  justify-content: center;
  align-items: center;
  gap: 10px;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.default {
  border: 1px solid #e5e7eb;
  background: #f3f4f6;
  color: #374151;
}

.default:hover {
  background: #e5e7eb;
}

.primary {
  border: 1px solid var(--primary-hover);
  background: var(--primary-default);
  color: white;
}

.primary:hover {
  background: var(--primary-hover);
}

.secondary {
  border: 1px solid #9ca3af;
  background: #e5e7eb;
  color: #1f2937;
}

.secondary:hover {
  background: #d1d5db;
}

.danger {
  border: 1px solid #991b1b;
  background: #dc2626;
  color: white;
}

.danger:hover {
  background: #991b1b;
}

.size-small {
  min-width: 96px;
  padding: 8px 16px;
  font-size: 0.875rem;
}

.size-xsmall {
  min-width: 64px;
  padding: 4px 8px;
  font-size: 0.75rem;
}

.size-medium {
  min-width: 128px;
  padding: 12px 24px;
  font-size: 1rem;
}
</style>
