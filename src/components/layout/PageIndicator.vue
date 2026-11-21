<script setup lang="ts">
/** A tick per page, each linking to its page, and the current page number, such as `02 / 04`. */
interface Props {
  /** Names the navigation for screen readers, such as "Experience pages". */
  label: string;
  /** The pages' anchor ids, in order. */
  pageIds: string[];
  currentPageIndex: number;
}
const props = defineProps<Props>();

/**
 * Formats a page number with a leading zero.
 *
 * @param pageNumber The 1-based page number.
 * @returns The number as two digits.
 */
function formatPageNumber(pageNumber: number): string {
  return String(pageNumber).padStart(2, '0');
}
</script>

<template>
  <nav class="page-indicator" :aria-label="props.label">
    <a v-for="(pageId, pageIndex) in props.pageIds" :key="pageId" :href="`#${pageId}`" class="tick"
      :class="{ current: pageIndex === props.currentPageIndex }" :aria-label="`Page ${pageIndex + 1}`"
      :aria-current="pageIndex === props.currentPageIndex ? 'step' : undefined"></a>
    <span class="page-number">
      {{ formatPageNumber(props.currentPageIndex + 1) }} / {{ formatPageNumber(props.pageIds.length) }}
    </span>
  </nav>
</template>

<style scoped>
.page-indicator {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* A thin bar with a taller hit area */
.tick {
  width: 1.75rem;
  padding: 0.625rem 0;
  background: linear-gradient(var(--neutral-700), var(--neutral-700)) center / 100% 2px no-repeat;
  transition: background 0.3s ease;
}

.tick:hover {
  background-image: linear-gradient(var(--neutral-400), var(--neutral-400));
}

.tick.current {
  background-image: linear-gradient(var(--primary-400), var(--primary-400));
}

.page-number {
  margin-left: 0.75rem;
  font-variant-numeric: tabular-nums;
}
</style>
