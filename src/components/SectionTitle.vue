<script setup lang="ts">
interface Props {
  title: string;
}

const props = defineProps<Props>();

</script>

<template>
  <h2>{{ props.title }}</h2>
</template>

<style scoped>
h2 {
  font-size: 3.75rem;
  font-weight: 700;
  color: var(--neutral-200);
}
</style>
