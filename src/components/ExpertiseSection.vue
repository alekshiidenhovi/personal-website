<script setup lang="ts">
import { EXPERTISE_AREAS, EXPERTISE_COLOR } from "../data/expertise";
import ExpertiseCard from "./ExpertiseCard.vue";
import PinnedSection from "./PinnedSection.vue";
</script>

<template>
  <PinnedSection id="expertise" :page-count="EXPERTISE_AREAS.length"
    :page-colors="EXPERTISE_AREAS.map((area) => EXPERTISE_COLOR[area.expertise])">
    <template #default="{ page, active }">
      <ExpertiseCard :area="EXPERTISE_AREAS[page]" :active="active" />
    </template>
  </PinnedSection>
</template>
