<script setup lang="ts">
import type { Component } from "vue";
import { EXPERTISE_COLOR, type ExpertiseArea } from "../data/expertise";
import type { Expertise } from "../types";
import HackCpuVisual from "./HackCpuVisual.vue";
import LiveDashboardVisual from "./LiveDashboardVisual.vue";
import StackLine from "./StackLine.vue";
import TrainingRunVisual from "./TrainingRunVisual.vue";

interface Props {
  area: ExpertiseArea;
  /** The panel currently in view; only its visual plays */
  active: boolean;
}
const props = defineProps<Props>();

const VISUALS: Record<Expertise, Component> = {
  "machine learning": TrainingRunVisual,
  "low level": HackCpuVisual,
  "web dev": LiveDashboardVisual,
};
</script>

<template>
  <article class="panel" :class="{ active: props.active }"
    :style="{ '--card-color': EXPERTISE_COLOR[props.area.expertise] }">
    <div class="info">
      <h3>{{ props.area.title }}</h3>
      <p>{{ props.area.text }}</p>
      <StackLine :items="props.area.tags" />
    </div>

    <div class="window">
      <header class="window-bar">
        <span class="window-dots"><span></span><span></span><span></span></span>
        <span class="file-name">{{ props.area.fileName }}</span>
      </header>
      <div class="visual-container">
        <component :is="VISUALS[props.area.expertise]" :active="props.active" />
      </div>
    </div>
  </article>
</template>

<style scoped>
.panel {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
  align-items: center;
  gap: clamp(2rem, 5vw, 5rem);
  width: 100%;
  height: 100%;
}

.info {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

h3 {
  font-size: clamp(2rem, 4vw, 3.25rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.05;
  color: var(--neutral-100);
}

p {
  max-width: 32rem;
  font-size: clamp(1rem, 1.3vw, 1.125rem);
  line-height: 1.65;
  color: var(--neutral-400);
}

.window {
  display: flex;
  flex-direction: column;
  border: 1px solid color-mix(in srgb, var(--card-color), transparent 50%);
  background-color: var(--neutral-900);
  box-shadow: 0 2rem 6rem -3rem color-mix(in srgb, var(--card-color), transparent 50%);
}

.window-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--neutral-800);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--neutral-400);
}

.window-dots {
  display: flex;
  gap: 0.5rem;
}

.window-dots span {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
  background-color: var(--card-color);
}

.visual-container {
  flex-grow: 1;
  display: flex;
  align-items: center;
  min-height: min(40dvh, 24rem);
  padding: clamp(1.25rem, 2.5vw, 2rem);
}

@media (max-width: 57.75rem) {
  .panel {
    grid-template-columns: 1fr;
  }

  .visual-container {
    min-height: 20rem;
  }
}
</style>
