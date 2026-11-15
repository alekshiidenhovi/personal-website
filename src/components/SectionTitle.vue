<script setup lang="ts">
interface Props {
  index: number;
  title: string;
  subtitle?: string;
}

const props = defineProps<Props>();
</script>

<template>
  <div class="title-container" v-reveal>
    <span class="index" aria-hidden="true">{{ String(props.index).padStart(2, "0") }}</span>
    <div class="text">
      <h2>{{ props.title }}</h2>
      <p v-if="props.subtitle">{{ props.subtitle }}</p>
    </div>
    <!-- Optional content aligned to the right end, such as a page indicator -->
    <div v-if="$slots.default" class="aside">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.title-container {
  display: flex;
  align-items: flex-end;
  gap: clamp(1rem, 3vw, 2.5rem);
  width: 100%;
  padding-bottom: clamp(1rem, 2vw, 1.5rem);
  border-bottom: 1px solid var(--neutral-800);
}

.index {
  font-size: clamp(3.5rem, min(9vw, 14dvh), 8rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 0.8;
  /*
   * Outlined digits: the stroke is painted first and the background-colored
   * fill covers its inner half, hiding lines where a glyph's contours overlap.
   */
  color: var(--neutral-950);
  -webkit-text-stroke: 2px var(--neutral-700);
  paint-order: stroke fill;
}

.aside {
  margin-left: auto;
}

.text {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

h2 {
  font-size: clamp(2rem, min(5vw, 7dvh), 4rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1;
  color: var(--neutral-100);
}

/*
 * Stacked layout (no .pinned on the root): the number sits beside the title on one
 * row, and the subtitle runs the full width below them.
 */
:root:not(.pinned) .title-container {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: end;
  column-gap: 1rem;
}

:root:not(.pinned) .text {
  display: contents;
}

:root:not(.pinned) .index {
  font-size: 2.75rem;
}

:root:not(.pinned) h2 {
  font-size: 2.5rem;
}

:root:not(.pinned) p {
  grid-column: 1 / -1;
  padding-top: 0.75rem;
}

p {
  padding-top: 0.25rem;
  font-size: clamp(1rem, 1.3vw, 1.125rem);
  line-height: 1.6;
  color: var(--neutral-400);
}
</style>
