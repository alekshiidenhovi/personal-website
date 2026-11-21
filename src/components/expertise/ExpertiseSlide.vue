<script setup lang="ts">
import { getRoleHref } from '../../content/experience';
import type { ExpertiseArea } from '../../content/expertise';
import ItemSlide from '../layout/ItemSlide.vue';
import HighlightedText from '../ui/HighlightedText.vue';
import Icon from '../ui/Icon.vue';
import { EXPERTISE_VISUALS } from './expertiseVisuals';
import StackLine from './StackLine.vue';
import VisualWindow from './VisualWindow.vue';

/** One area of expertise: a card with what it covers and its stack, and a live demo in an app window. */
interface Props {
  area: ExpertiseArea;
  /** Whether the slide is the one in view, so its demo plays. */
  active: boolean;
}
const props = defineProps<Props>();

const visual = EXPERTISE_VISUALS[props.area.visual];
</script>

<template>
  <ItemSlide class="expertise-slide" :discipline="props.area.discipline" :title="props.area.title"
    popup-label="Open demo" :popup-title="props.area.fileName" :active="props.active">
    <template #info>
      <p><HighlightedText :text="props.area.text" /></p>
      <StackLine :items="props.area.stack" />
    </template>

    <template #visual="{ active }">
      <VisualWindow :file-name="props.area.fileName">
        <component :is="visual" :active="active" />
      </VisualWindow>
    </template>

    <template #caption>
      <a class="source" :href="getRoleHref(props.area.source.role)">
        <span class="source-label">From</span> {{ props.area.source.label }}
        <Icon icon="heroicons:arrow-right-20-solid" class="source-arrow" />
      </a>
    </template>
  </ItemSlide>
</template>

<style scoped>
@import "../../styles/media.css";

.expertise-slide {
  --info-gap: 1.25rem;
}

p {
  max-width: 32rem;
  font-size: clamp(1rem, 1.3vw, 1.125rem);
  line-height: 1.65;
  color: var(--neutral-400);
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

.source:hover {
  color: var(--card-color);
}

.source-label {
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.source-arrow {
  width: 0.875rem;
  height: 0.875rem;
  transition: translate 0.2s ease;
}

.source:hover .source-arrow {
  translate: 0.25rem 0;
}

/* On wide screens, in the caption row below the window */
@media (--wide) {
  .source {
    justify-self: end;
    align-self: start;
  }
}

@media (--below-lg) {
  .expertise-slide {
    --title-size: 1.75rem;
  }
}

@media (--phone) {
  .expertise-slide {
    --title-size: 1.5rem;
  }
}

/* Very short pages (phones in landscape): a compact card */
@container page (height < 16rem) {
  .expertise-slide {
    --info-gap: 0.75rem;
    --info-padding: 0.75rem 1rem;
  }
}
</style>
