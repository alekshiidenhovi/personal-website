<script setup lang="ts">
import { ROLES } from "../data/experience";
import { EXPERTISE_COLOR } from "../data/expertise";
import PinnedSection from "./PinnedSection.vue";
import RoleSlide from "./RoleSlide.vue";
</script>

<template>
  <PinnedSection id="professional-experience" :page-count="ROLES.length" :page-ids="ROLES.map((role) => role.slug)"
    :page-colors="ROLES.map((role) => EXPERTISE_COLOR[role.discipline])">
    <template #default="{ page, active }">
      <RoleSlide :role="ROLES[page]" :index="page" :active="active" />
    </template>
  </PinnedSection>
</template>
