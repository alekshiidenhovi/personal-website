<script setup lang="ts">
import { computed } from 'vue';
import { useMatchMedia } from '../../composables/useMatchMedia';
import { PROJECTS } from '../../content/projects';
import { FINE_POINTER_QUERY, PHONE_QUERY, WIDE_QUERY } from '../../lib/layout';
import PinnedSection from '../layout/PinnedSection.vue';
import ProjectCard from './ProjectCard.vue';

const isPhone = useMatchMedia(PHONE_QUERY);
const isWide = useMatchMedia(WIDE_QUERY);
const hasFinePointer = useMatchMedia(FINE_POINTER_QUERY);

/** Wide screens show a featured project beside two smaller ones, tablets two stacked, and phones one. */
const projectsPerPage = computed(() => {
  if (isPhone.value) {
    return 1;
  }
  return isWide.value ? 3 : 2;
});
const isTrio = computed(() => projectsPerPage.value === 3);
const pages = computed(() =>
  Array.from({ length: Math.ceil(PROJECTS.length / projectsPerPage.value) }, (_, pageIndex) =>
    PROJECTS.slice(pageIndex * projectsPerPage.value, (pageIndex + 1) * projectsPerPage.value),
  ),
);
</script>

<template>
  <PinnedSection id="projects" class="projects" :page-count="pages.length">
    <!-- Covers play on hover; without a pointer to hover with, the current page's covers play -->
    <template #default="{ page, active }">
      <!-- Alternate trios mirror the layout, so the featured card swaps sides -->
      <div class="page-grid" :class="{ trio: isTrio, mirrored: page % 2 === 1 }">
        <ProjectCard v-for="(project, index) in pages[page]" :key="project.title" :project="project"
          :featured="isTrio && index === 0" :playing="active && !hasFinePointer" />
      </div>
    </template>
  </PinnedSection>
</template>

<style scoped>
/* One card per row, sharing the page's height */
.page-grid {
  display: grid;
  grid-auto-rows: minmax(0, 1fr);
  gap: clamp(1rem, 2vw, 1.5rem);
  height: 100%;
}

.page-grid.trio {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
}

.page-grid.trio > :first-child {
  grid-column: 1 / 3;
  grid-row: 1 / 3;
}

.page-grid.trio.mirrored > :first-child {
  grid-column: 2 / 4;
}

/*
 * Short pages: the page's cards side by side in one row, each the page's full height. Stacked, or small beside a
 * featured card, a card's text would leave its cover hardly any height. The text is sized in rem, so the threshold
 * is too: at 34rem the small covers of the featured layout still get about 100px. ProjectCard drops the featured
 * styling below the same height.
 */
@container page (height < 34rem) {
  .page-grid,
  .page-grid.trio {
    grid-auto-flow: column;
    grid-auto-columns: minmax(0, 1fr);
    grid-template-columns: none;
    grid-template-rows: minmax(0, 1fr);
  }

  .page-grid.trio > :first-child {
    grid-column: auto;
    grid-row: auto;
  }
}
</style>
