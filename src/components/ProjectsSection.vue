<script setup lang="ts">
import { PROJECTS } from "../data/projects";
import PinnedSection from "./PinnedSection.vue";
import ProjectCard from "./ProjectCard.vue";

/** Each page shows one featured project next to two smaller ones */
const PROJECTS_PER_PAGE = 3;

const pages = Array.from({ length: Math.ceil(PROJECTS.length / PROJECTS_PER_PAGE) }, (_, page) =>
  PROJECTS.slice(page * PROJECTS_PER_PAGE, (page + 1) * PROJECTS_PER_PAGE),
);
</script>

<template>
  <PinnedSection id="projects" :index="2" title="Projects"
    subtitle="Things I've built from scratch — from language tooling to ML research frameworks."
    :page-count="pages.length">
    <template #default="{ page }">
      <!-- Alternate pages mirror the layout so the featured card swaps sides -->
      <div class="page-grid" :class="{ mirrored: page % 2 === 1 }">
        <ProjectCard v-for="(project, index) in pages[page]" :key="project.title" :project="project"
          :featured="index === 0" />
      </div>
    </template>
  </PinnedSection>
</template>

<style scoped>
.page-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: clamp(1rem, 2vw, 1.5rem);
  height: 100%;
}

.page-grid> :first-child {
  grid-column: 1 / 3;
  grid-row: 1 / 3;
}

.page-grid.mirrored> :first-child {
  grid-column: 2 / 4;
}

/* Matches PinnedSection's stacked fallback */
@media not ((min-width: 57.75rem) and (min-height: 40rem)) {
  .page-grid {
    grid-template-columns: 1fr;
    grid-template-rows: none;
    grid-auto-rows: 20rem;
    height: auto;
  }

  .page-grid> :first-child,
  .page-grid.mirrored> :first-child {
    grid-column: auto;
    grid-row: auto;
  }
}
</style>
