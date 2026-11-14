<script setup lang="ts">
import { ROLES } from "../data/experience";
import PinnedSection from "./PinnedSection.vue";
import RoleSlide from "./RoleSlide.vue";
</script>

<template>
  <PinnedSection id="professional-experience" :index="3" title="Experience"
    subtitle="Shipping ML and data products at a global games company and a health-tech startup."
    :page-count="ROLES.length" :page-ids="ROLES.map((role) => role.slug)">
    <template #default="{ page, active }">
      <RoleSlide :role="ROLES[page]" :index="page" :active="active" />
    </template>
  </PinnedSection>
</template>
