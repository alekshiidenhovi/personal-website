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
    <!-- The text as a card, grouping the item apart from the section's title and beside or above its visual -->
    <div class="info tinted-card dot-grid">
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
  padding: clamp(1.5rem, 2.5vw, 2.5rem);
}

h3 {
  /* A clear step below the section's title, the same for every item */
  font-size: clamp(1.75rem, min(3.5vw, 6svh), 2.75rem);
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

/*
 * Side by side on wide screens, the card as tall as the window: the visual's
 * column spans two rows as a subgrid, the window sharing the card's row and
 * the source link below.
 */
@media (width >= 64rem) {
  .panel {
    grid-template-rows: auto auto;
    row-gap: 0.75rem;
    align-content: center;
    align-items: stretch;
  }

  .info {
    grid-row: 1;
    justify-content: center;
  }

  .visual-column {
    grid-row: 1 / 3;
    display: grid;
    grid-template-rows: subgrid;
  }

  .source {
    justify-self: end;
    align-self: start;
  }
}

/* Stacked below lg, the card above the visual; the title a clear step below the section's */
@media (width < 64rem) {
  /* Close together, so the card and its visual read as one item */
  .panel {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }

  h3 {
    font-size: 1.75rem;
  }
}

@media (width < 40rem), (height < 30rem) {
  /* From the top, like the other sections' phone pages */
  .panel {
    align-content: start;
  }

  /* The visual's button in the card's top-right corner, the title clear of it */
  .info .visual-popup {
    position: absolute;
    top: 1rem;
    right: 1rem;
  }

  h3 {
    padding-right: 2.75rem;
  }

  .info {
    padding: 1.25rem;
  }

  h3 {
    font-size: 1.5rem;
  }
}

/* Very short pages (phones in landscape): a compact card */
@container page (height < 16rem) {
  .info {
    gap: 0.75rem;
    padding: 0.75rem 1rem;
  }

  .info .visual-popup {
    top: 0.5rem;
    right: 0.5rem;
  }
}
</style>
