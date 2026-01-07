<script setup lang="ts">
import type { Expertise } from "../types";
import Tag from "./Tag.vue";

interface Props {
  cardColor: Expertise;
  cardTitle: string;
  cardText: string;
  tags: {
    tagText: string;
  }[]
}
const props = defineProps<Props>();
</script>

<template>
  <div class="card">
    <div class="title-container">
      <h3 :class="{
        'title-ml': cardColor === 'machineLearning',
        'title-ll': cardColor === 'lowLevel',
        'title-wd': cardColor === 'webDev',
      }">{{ cardTitle }}</h3>
    </div>
    <p>{{ cardText }}</p>
    <div class="tag-container">
      <Tag v-for="tag in props.tags" :color="cardColor" :text="tag.tagText" />
    </div>
  </div>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 2rem;
  border: 2px solid var(--neutral-700);
  background-color: var(--neutral-900);
  width: 100%;
  justify-content: between;
  height: 100%;
}

.title-container {
  display: flex;
  gap: 0.5rem;
}

.title-container h3 {
  font-size: 1.5rem;
  font-weight: 400;
  letter-spacing: 3px;
  text-transform: uppercase;
}

.title-container .title-ml {
  color: var(--primary-500);
}

.title-container .title-ll {
  color: var(--accent-500);
}

.title-container .title-wd {
  color: var(--warning-500);
}

p {
  color: var(--neutral-500);
  font-size: 1.125rem;
  line-height: calc(1.75 / 1.125);
  flex-grow: 1;
}

.tag-container {
  display: flex;
  gap: 0.75rem;
  width: 100%;
  overflow-x: auto;
}
</style>
