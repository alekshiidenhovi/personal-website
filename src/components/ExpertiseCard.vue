<script setup lang="ts">
import type { Expertise } from "../types";
import Tag from "./Tag.vue";
import { Icon } from '@iconify/vue';


interface Props {
  cardColor: Expertise;
  cardTitle: string;
  cardText: string;
  iconName: string;
  tags: {
    tagText: string;
  }[]
}
const props = defineProps<Props>();
</script>

<template>
  <div class="card">
    <div :class="{
      'title-container': true,
      'title-container-ml': cardColor === 'machineLearning',
      'title-container-ll': cardColor === 'lowLevel',
      'title-container-wd': cardColor === 'webDev',
    }">
      <Icon :icon="props.iconName" class="icon" />
      <h3>{{ cardTitle }}</h3>
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
  gap: 0.75rem;
  align-items: center;
}

.title-container-ml {
  color: var(--primary-500);
}

.title-container-ll {
  color: var(--accent-500);
}

.title-container-wd {
  color: var(--warning-500);
}

.title-container .icon {
  width: 2rem;
  height: 2rem;
}

.title-container h3 {
  font-size: 1.5rem;
  font-weight: 400;
  letter-spacing: 3px;
  text-transform: uppercase;
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
