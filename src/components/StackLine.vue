<script setup lang="ts">
/** A tech stack as one mono line, `A / B / C`, in the surrounding `--card-color` */

interface Props {
  items: string[];
}
const props = defineProps<Props>();
</script>

<template>
  <ul class="stack" aria-label="Tech stack">
    <li v-for="item in props.items" :key="item">{{ item }}</li>
  </ul>
</template>

<style scoped>
.stack {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0;
  padding-top: 1rem;
  border-top: 1px solid var(--neutral-800);
  list-style: none;
  font-family: var(--font-mono);
  font-size: 0.875rem;
  color: var(--card-color);
}

.stack li+li::before {
  content: "/";
  margin: 0 0.625rem;
  color: var(--neutral-600);
}
</style>
