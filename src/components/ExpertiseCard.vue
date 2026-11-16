<script setup lang="ts">
import type { Component } from "vue";
import { useMatchMedia } from "../composables/useMatchMedia";
import { EXPERTISE_COLOR, type ExpertiseArea } from "../data/expertise";
import { PHONE_QUERY } from "../lib/layout";
import type { Expertise } from "../types";
import DataPipelineVisual from "./DataPipelineVisual.vue";
import HighlightedText from "./HighlightedText.vue";
import Icon from "./Icon.vue";
import PretrainingRunVisual from "./PretrainingRunVisual.vue";
import StackLine from "./StackLine.vue";
import TicketDashboardVisual from "./TicketDashboardVisual.vue";
import VisualPopup from "./VisualPopup.vue";
import VisualWindow from "./VisualWindow.vue";

interface Props {
  area: ExpertiseArea;
  /** The panel currently in view; only its visual plays */
  active: boolean;
}
const props = defineProps<Props>();

const VISUALS: Record<Expertise, Component> = {
  "machine learning": PretrainingRunVisual,
  "data foundations": DataPipelineVisual,
  "web development": TicketDashboardVisual,
};

// Phones show the visual in a popup instead, so the hidden one on the page stays still
const isPhone = useMatchMedia(PHONE_QUERY);
</script>

<template>
  <article class="panel" :class="{ active: props.active }"
    :style="{ '--card-color': EXPERTISE_COLOR[props.area.expertise] }">
    <div class="info">
      <h3>{{ props.area.title }}</h3>
      <p><HighlightedText :text="props.area.text" /></p>
      <StackLine :items="props.area.tags" />
      <!-- On phones in place of the visual column; see .phone-only in style.css -->
      <VisualPopup class="phone-only" label="Open demo" :title="props.area.fileName">
        <template #default="{ active }">
          <VisualWindow :file-name="props.area.fileName">
            <component :is="VISUALS[props.area.expertise]" :active="active" />
          </VisualWindow>
        </template>
      </VisualPopup>
    </div>

    <div class="visual-column except-phones">
      <VisualWindow :file-name="props.area.fileName">
        <component :is="VISUALS[props.area.expertise]" :active="props.active && !isPhone" />
      </VisualWindow>
      <a class="source" :href="`#${props.area.source.role}`">
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

@media (width < 64rem) {
  .panel {
    grid-template-columns: 1fr;
  }
}
</style>
