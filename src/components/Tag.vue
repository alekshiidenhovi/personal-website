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
    ml: props.color === 'machineLearning',
    ll: props.color === 'lowLevel',
    wd: props.color === 'webDev',
  }"> {{ text }} </div>
</template>

<style scoped>
.base {
  border: 2px solid color-mix(in srgb, var(--neutral-700), transparent 50%);
  background-color: var(--neutral-800);
  padding: 0.5rem 1.25rem;
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
