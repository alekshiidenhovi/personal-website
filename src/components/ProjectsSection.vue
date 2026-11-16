<script setup lang="ts">
import { computed } from "vue";
import { useMatchMedia } from "../composables/useMatchMedia";
import { PROJECTS } from "../data/projects";
import { FINE_POINTER_QUERY, PHONE_QUERY, WIDE_QUERY } from "../lib/layout";
import PinnedSection from "./PinnedSection.vue";
import ProjectCard from "./ProjectCard.vue";

const isPhone = useMatchMedia(PHONE_QUERY);
const isWide = useMatchMedia(WIDE_QUERY);
const hasFinePointer = useMatchMedia(FINE_POINTER_QUERY);

/** Wide screens show one featured project next to two smaller ones; tablets two stacked; phones one */
const perPage = computed(() => (isPhone.value ? 1 : isWide.value ? 3 : 2));

const pages = computed(() =>
  Array.from({ length: Math.ceil(PROJECTS.length / perPage.value) }, (_, page) =>
    PROJECTS.slice(page * perPage.value, (page + 1) * perPage.value),
  ),
);
</script>

<template>
  <PinnedSection id="projects" class="projects" :page-count="pages.length">
    <!-- Covers animate on hover; without one to hover with, the current page's covers play -->
    <template #default="{ page, active }">
      <!-- Alternate trios mirror the layout so the featured card swaps sides -->
      <div class="page-grid" :class="{ trio: perPage === 3, mirrored: page % 2 === 1 }">
        <ProjectCard v-for="(project, index) in pages[page]" :key="project.title" :project="project"
          :featured="perPage === 3 && index === 0" :playing="active && !hasFinePointer" />
      </div>
    </template>
  </PinnedSection>
</template>

<style scoped>
.projects {
  --card-gap: clamp(1rem, 2vw, 1.5rem);
}

/* One card per row, sharing the page's height */
.page-grid {
  display: grid;
  grid-auto-rows: minmax(0, 1fr);
  gap: var(--card-gap);
  height: 100%;
}

.page-grid.trio {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
}

.page-grid.trio> :first-child {
  grid-column: 1 / 3;
  grid-row: 1 / 3;
}

.page-grid.trio.mirrored> :first-child {
  grid-column: 2 / 4;
}
</style>
