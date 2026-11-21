<script setup lang="ts">
import { ROLES } from '../../content/experience';
import PinnedSection from '../layout/PinnedSection.vue';
import RoleSlide from './RoleSlide.vue';

const ROLE_PAGE_IDS = ROLES.map((role) => role.slug);
</script>

<template>
  <PinnedSection id="professional-experience" :page-count="ROLES.length" :page-ids="ROLE_PAGE_IDS">
    <template #default="{ page, active }">
      <RoleSlide :role="ROLES[page]" :index="page" :active="active" />
    </template>
  </PinnedSection>
</template>
