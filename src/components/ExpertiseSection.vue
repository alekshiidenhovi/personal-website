<script setup lang="ts">
import { EXPERTISE_AREAS } from "../data/expertise";
import ExpertiseCard from "./ExpertiseCard.vue";
import PinnedSection from "./PinnedSection.vue";
</script>

<template>
  <PinnedSection id="expertise" :index="1" title="Expertise"
    subtitle="Deep in embedding models, broad across the data stack around them." :page-count="EXPERTISE_AREAS.length">
    <template #default="{ page, active }">
      <ExpertiseCard :area="EXPERTISE_AREAS[page]" :active="active" />
    </template>
  </PinnedSection>
</template>
