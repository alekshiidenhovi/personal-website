<script setup lang="ts">
import { STUDIES } from '../../content/education';
import PinnedSection from '../layout/PinnedSection.vue';
import StudyCard from './StudyCard.vue';
</script>

<template>
  <PinnedSection id="education">
    <ol class="studies">
      <StudyCard v-for="study in STUDIES" :key="study.degree" :study="study" />
    </ol>
  </PinnedSection>
</template>

<style scoped>
/* A size container, so the cards' years can scale with the list's width */
.studies {
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: clamp(0.75rem, 1.5vw, 1rem);
  height: 100%;
  list-style: none;
}

/* Narrow pages: both degrees from the top */
@container page (width < 36rem) {
  .studies {
    justify-content: flex-start;
    gap: 0.875rem;
  }
}

/* Short pages, where the cards are single rows (see StudyCard) */
@container page (height < 24rem) {
  .studies {
    gap: 0.5rem;
  }
}
</style>
