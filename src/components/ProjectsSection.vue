<script setup lang="ts">
import { ref } from "vue";
import { pinnedLayout } from "../composables/usePinnedLayout";
import { useViewportUpdates } from "../composables/useViewportUpdates";
import { PROJECTS } from "../data/projects";
import { closestToViewportCenter } from "../lib/layout";
import PinnedSection from "./PinnedSection.vue";
import ProjectCard from "./ProjectCard.vue";

/** Each page shows one featured project next to two smaller ones */
const PROJECTS_PER_PAGE = 3;

const pages = Array.from({ length: Math.ceil(PROJECTS.length / PROJECTS_PER_PAGE) }, (_, page) =>
  PROJECTS.slice(page * PROJECTS_PER_PAGE, (page + 1) * PROJECTS_PER_PAGE),
);

/*
 * Covers animate on hover in the slideshow. The stacked layout has no room for
 * several animations at once and often no hover, so there only the card
 * nearest the middle of the screen plays.
 */
const cardRefs: HTMLElement[] = [];
const playingTitle = ref<string | null>(null);

const updatePlaying = () => {
  if (pinnedLayout.value) {
    playingTitle.value = null;
    return;
  }
  const index = closestToViewportCenter(cardRefs);
  playingTitle.value = cardRefs[index]?.dataset.project ?? null;
};

useViewportUpdates(updatePlaying);
</script>

<template>
  <PinnedSection id="projects" class="projects" :page-count="pages.length">
    <template #default="{ page }">
      <!-- Alternate pages mirror the layout so the featured card swaps sides -->
      <div class="page-grid" :class="{ mirrored: page % 2 === 1 }">
        <ProjectCard v-for="(project, index) in pages[page]" :key="project.title"
          :ref="(card) => { if (card) cardRefs[page * PROJECTS_PER_PAGE + index] = (card as InstanceType<typeof ProjectCard>).$el; }"
          :data-project="project.title" :project="project" :featured="index === 0"
          :playing="playingTitle === project.title" />
      </div>
    </template>
  </PinnedSection>
</template>

<style scoped>
/* Stacked, the pages continue as one list of cards */
.projects {
  --card-gap: clamp(1rem, 2vw, 1.5rem);
  --stacked-page-gap: var(--card-gap);
}

.page-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: var(--card-gap);
  height: 100%;
}

.page-grid> :first-child {
  grid-column: 1 / 3;
  grid-row: 1 / 3;
}

.page-grid.mirrored> :first-child {
  grid-column: 2 / 4;
}

/* Scrolling, the grid gets fixed rows instead of the slide's height */
:root:not(.pinned) .page-grid {
  grid-template-rows: repeat(2, 18rem);
  height: auto;
}

/* Below lg (always the scrolling layout) the cards run as one list */
@media (width < 64rem) {
  :root:not(.pinned) .page-grid {
    grid-template-columns: 1fr;
    grid-template-rows: none;
    grid-auto-rows: 20rem;
  }

  .page-grid> :first-child,
  .page-grid.mirrored> :first-child {
    grid-column: auto;
    grid-row: auto;
  }
}
</style>
