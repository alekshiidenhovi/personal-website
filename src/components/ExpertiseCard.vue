<script setup lang="ts">
import { Icon } from "@iconify/vue";
import type { Component } from "vue";
import { EXPERTISE_COLOR, type ExpertiseArea } from "../data/expertise";
import type { Expertise } from "../types";
import DataPipelineVisual from "./DataPipelineVisual.vue";
import PretrainingRunVisual from "./PretrainingRunVisual.vue";
import StackLine from "./StackLine.vue";
import TicketDashboardVisual from "./TicketDashboardVisual.vue";

interface Props {
  area: ExpertiseArea;
  /** The panel currently in view; only its visual plays */
  active: boolean;
}
const props = defineProps<Props>();

const VISUALS: Record<Expertise, Component> = {
  "machine learning": PretrainingRunVisual,
  "data ops": DataPipelineVisual,
  "web dev": TicketDashboardVisual,
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

    <div class="visual-column">
      <div class="window">
        <header class="window-bar">
          <span class="window-dots"><span></span><span></span><span></span></span>
          <span class="file-name">{{ props.area.fileName }}</span>
        </header>
        <div class="visual-container">
          <component :is="VISUALS[props.area.expertise]" :active="props.active" />
        </div>
      </div>
      <a class="source" :href="props.area.source.href">
        <span class="source-label">From</span> {{ props.area.source.label }}
        <Icon icon="heroicons:arrow-right-20-solid" class="source-arrow" />
      </a>
    </div>
  </article>
</template>

<style scoped>
.panel {
  --selection-color: var(--card-color);
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

.visual-column {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 0;
}

.source {
  display: inline-flex;
  align-items: center;
  align-self: flex-end;
  gap: 0.5rem;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--neutral-400);
  text-decoration: none;
  transition: color 0.2s ease;
}

.source-label {
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.source:hover {
  color: var(--card-color);
}

.source-arrow {
  width: 0.875rem;
  height: 0.875rem;
  transition: translate 0.2s ease;
}

.source:hover .source-arrow {
  translate: 0.25rem 0;
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
