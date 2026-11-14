<script setup lang="ts">
import { EXPERTISE_AREAS, EXPERTISE_COLOR } from "../data/expertise";
import ExpertiseCard from "./ExpertiseCard.vue";
import PinnedSection from "./PinnedSection.vue";
</script>

<template>
  <PinnedSection id="expertise" :index="1" title="Expertise"
    subtitle="Three disciplines, one throughline: understanding systems all the way down."
    :page-count="EXPERTISE_AREAS.length">
    <template #nav="{ activePage, goToPage }">
      <nav class="steps" aria-label="Expertise">
        <button v-for="(area, index) in EXPERTISE_AREAS" :key="area.expertise" type="button" class="step"
          :class="{ current: index === activePage }" :style="{ '--step-color': EXPERTISE_COLOR[area.expertise] }"
          @click="goToPage(index)">
          {{ area.title }}
        </button>
      </nav>
    </template>

    <template #default="{ page, active }">
      <ExpertiseCard :area="EXPERTISE_AREAS[page]" :active="active" />
    </template>
  </PinnedSection>
</template>

<style scoped>
.steps {
  display: flex;
  gap: clamp(1.5rem, 3vw, 2.5rem);
}

.step {
  position: relative;
  padding: 0 0 0.5rem;
  border: none;
  background: none;
  font-family: var(--font-mono);
  font-size: 0.875rem;
  color: var(--neutral-500);
  cursor: pointer;
  transition: color 0.3s ease;
}

.step::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  background-color: var(--step-color);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.3s ease;
}

.step:hover {
  color: var(--neutral-200);
}

.step.current {
  color: var(--step-color);
}

.step.current::after {
  transform: scaleX(1);
}
</style>
