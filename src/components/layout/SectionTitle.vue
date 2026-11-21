<script setup lang="ts">
import { onMounted, onUnmounted, ref, useTemplateRef } from 'vue';

/**
 * A section's number, title and subtitle, with optional content at the end of the row, such as a page indicator.
 * Fades up the first time it comes into view.
 */
interface Props {
  /** The section's 1-based number. */
  index: number;
  title: string;
  subtitle: string;
}
const props = defineProps<Props>();

/** The share of the title that must be visible before it fades up. */
const REVEAL_THRESHOLD = 0.15;

const rootRef = useTemplateRef<HTMLElement>('root');
const isRevealed = ref(false);
let revealObserver: IntersectionObserver | undefined;

/** Reveals the title once it first comes into view. */
function revealWhenInView() {
  if (!rootRef.value) {
    throw new Error('SectionTitle needs its root element mounted');
  }
  revealObserver = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        isRevealed.value = true;
        revealObserver?.disconnect();
      }
    },
    { threshold: REVEAL_THRESHOLD },
  );
  revealObserver.observe(rootRef.value);
}

onMounted(revealWhenInView);
onUnmounted(() => revealObserver?.disconnect());
</script>

<template>
  <div ref="root" class="section-title" :class="{ revealed: isRevealed }">
    <span class="number" aria-hidden="true">{{ String(props.index).padStart(2, '0') }}</span>
    <div class="text">
      <h2>{{ props.title }}</h2>
      <p>{{ props.subtitle }}</p>
    </div>
    <div v-if="$slots.default" class="row-end">
      <slot />
    </div>
  </div>
</template>

<style scoped>
@import "../../styles/media.css";

.section-title {
  display: flex;
  align-items: flex-end;
  gap: clamp(1rem, 3vw, 2.5rem);
  width: 100%;
  padding-bottom: clamp(1rem, 2vw, 1.5rem);
  border-bottom: 1px solid var(--neutral-800);
}

.section-title:not(.revealed) {
  opacity: 0;
}

/* Animates `translate` rather than `transform`, so it never overrides a transform set elsewhere */
.section-title.revealed {
  animation: fade-up 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) both;
}

@keyframes fade-up {
  from {
    opacity: 0;
    translate: 0 1.5rem;
  }
}

.number {
  font-size: clamp(3.5rem, min(9vw, 14svh), 8rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 0.8;
  /* Outlined: the fill, painted over the stroke's inner half, hides lines where a glyph's contours overlap */
  color: var(--neutral-950);
  -webkit-text-stroke: 2px var(--neutral-700);
  paint-order: stroke fill;
}

.text {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

h2 {
  font-size: clamp(2rem, min(5vw, 7svh), 4rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1;
  color: var(--neutral-100);
}

p {
  padding-top: 0.25rem;
  font-size: clamp(1rem, 1.3vw, 1.125rem);
  line-height: 1.6;
  color: var(--neutral-400);
}

.row-end {
  margin-left: auto;
}

/* The number beside the title on one row, the subtitle and row end each on a full-width row below */
@media (--below-lg) {
  .section-title {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: end;
    gap: 0 1rem;
  }

  .text {
    display: contents;
  }

  .number {
    font-size: 2.75rem;
  }

  h2 {
    font-size: 2.5rem;
  }

  p {
    grid-column: 1 / -1;
    padding-top: 1rem;
  }

  .row-end {
    grid-column: 1 / -1;
    margin-left: 0;
    padding-top: 0.5rem;
  }
}

@media (--below-sm) {
  .section-title {
    padding-bottom: 0.75rem;
  }

  .number {
    font-size: 2.5rem;
  }

  h2 {
    font-size: 2.25rem;
  }

  p {
    font-size: 0.9375rem;
    line-height: 1.5;
  }
}

/* One compact row without the subtitle, as phones in landscape need the height for the page */
@media (--short) {
  .section-title {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding-bottom: 0.5rem;
  }

  .number,
  h2 {
    font-size: 1.75rem;
  }

  p {
    display: none;
  }

  .row-end {
    margin-left: auto;
    padding-top: 0;
  }
}
</style>
