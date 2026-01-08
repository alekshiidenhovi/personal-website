<script setup lang="ts">
import type { Expertise } from "../types";

interface Props {
  projectTitle: string;
  projectDescription: string;
  projectTag: Expertise;
  projectLink: string;
  completionYear: number;
  imgUrl: string;
  imgDescription: string;
  objectPosition?: "top" | "center" | "bottom";

}
const props = withDefaults(defineProps<Props>(), {
  objectPosition: "center",
});

</script>

<template>
  <a class="card" :href="props.projectLink" target="_blank">
    <div class="metadata-container">
      <span class="tag" :class="{
        'tag-ml': props.projectTag === 'machineLearning',
        'tag-ll': props.projectTag === 'lowLevel',
        'tag-wd': props.projectTag === 'webDev',
      }">{{ props.projectTag }}</span>
      <span class="year">{{ props.completionYear }}</span>
    </div>
    <div class="title-container">
      <h3>{{ props.projectTitle }}</h3>
      <p>{{ props.projectDescription }}</p>
    </div>
    <div class="img-wrapper" :class="{
      'img-bg-ml': props.projectTag === 'machineLearning',
      'img-bg-ll': props.projectTag === 'lowLevel',
      'img-bg-wd': props.projectTag === 'webDev',
    }">
      <img :src="props.imgUrl" :alt="props.imgDescription" :style="{ objectPosition: props.objectPosition }" />
    </div>
  </a>
</template>

<style scoped>
.card {
  border: 2px solid var(--neutral-800);
  background-color: var(--neutral-900);
  width: 100%;
  height: 24rem;
  display: flex;
  flex-direction: column;
  text-decoration: none;
}

.card:hover {
  cursor: pointer;
  transform: scale(1.02);
  transition: all 0.2s ease-in-out;
}

.metadata-container {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  padding-top: 1.5rem;
  text-transform: uppercase;
}

.tag {
  letter-spacing: 3px;
  font-weight: 500;
  padding: 0.5rem 1.5rem;
  font-size: 1.125rem;
  line-height: 1.5rem;
}

.tag-ml {
  color: var(--primary-500);
  background-color: color-mix(in srgb, var(--primary-500), transparent 85%);
}

.tag-ll {
  color: var(--accent-500);
  background-color: color-mix(in srgb, var(--accent-500), transparent 85%);
}

.tag-wd {
  color: var(--warning-500);
  background-color: color-mix(in srgb, var(--warning-500), transparent 85%);
}

.year {
  padding: 0.5rem 1.0rem;
  color: var(--neutral-500);
  background-color: color-mix(in srgb, var(--neutral-500), transparent 85%);
  letter-spacing: 1px;
  font-size: 1.125rem;
  line-height: 1.5rem;
  font-weight: 400;
}

.title-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.5rem;
  border-bottom: 2px solid color-mix(in srgb, var(--neutral-800), transparent 60%);
}

h3 {
  font-size: 1.6rem;
  line-height: 2.0rem;
  font-weight: 500;
  color: var(--neutral-300);
}

p {
  font-size: 1.0rem;
  line-height: 1.5rem;
  font-weight: 400;
  color: var(--neutral-500);
}

.img-wrapper {
  width: 100%;
  flex-grow: 1;
  flex-shrink: 1;
  min-height: 0;
  overflow: hidden;
}

img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  mix-blend-mode: luminosity;
  opacity: 0.7;
  filter: grayscale(1);
  transition: filter 0.2s ease-in-out, opacity 0.2s ease-in-out;
  will-change: filter, opacity;
}

.img-bg-ml {
  background-color: color-mix(in srgb, var(--primary-500), transparent 90%);
}

.img-bg-ll {
  background-color: color-mix(in srgb, var(--accent-500), transparent 90%);
}

.img-bg-wd {
  background-color: color-mix(in srgb, var(--warning-500), transparent 90%);
}

.card:hover img {
  mix-blend-mode: normal;
  filter: grayscale(0);
  opacity: 1;
}
</style>
