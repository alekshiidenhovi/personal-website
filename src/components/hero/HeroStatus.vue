<script setup lang="ts">
/** The current position, after a glowing "online" dot, linking to it */
defineProps<{ href: string }>();
</script>

<template>
  <a class="status" :href="href">
    <span class="dot"></span>
    <slot />
  </a>
</template>

<style scoped>
.status {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 0.625rem;
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  color: var(--neutral-400);
  text-decoration: none;
  transition: color 0.2s ease;
}

.status:hover {
  color: var(--neutral-100);
}

.dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background-color: var(--success-400);
  box-shadow: 0 0 0.5rem var(--success-400);
}
</style>
