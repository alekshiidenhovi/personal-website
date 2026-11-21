<script setup lang="ts">
import { EXPERTISE_AREAS } from '../../content/expertise';
import PinnedSection from '../layout/PinnedSection.vue';
import ExpertiseSlide from './ExpertiseSlide.vue';
</script>

<template>
  <PinnedSection id="expertise" :page-count="EXPERTISE_AREAS.length">
    <template #default="{ page, active }">
      <ExpertiseSlide :area="EXPERTISE_AREAS[page]" :active="active" />
    </template>
  </PinnedSection>
</template>
