<script setup lang="ts">
import type { Expertise } from "../types";

interface Props {
  color: Expertise;
  text: string;
}
const props = defineProps<Props>();


</script>

<template>
  <div class="base" :class="{
    ml: props.color === 'machine learning',
    ll: props.color === 'low level',
    wd: props.color === 'web dev',
  }"> {{ text }} </div>
</template>

<style scoped>
.base {
  border: 2px solid color-mix(in srgb, var(--neutral-700), transparent 50%);
  background-color: var(--neutral-800);
  padding: 0.5rem 1.25rem;
  flex-shrink: 0;
}

.ml {
  color: var(--primary-500);
}

.ll {
  color: var(--accent-500);
}

.wd {
  color: var(--warning-500);
}
</style>
