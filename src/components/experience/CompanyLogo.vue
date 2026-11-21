<script setup lang="ts">
import type { Component } from 'vue';
import type { CompanyId } from '../../content/experience';
import SupercellLogo from './SupercellLogo.vue';
import VeriLogo from './VeriLogo.vue';

/** A company's logo, sized so the marks of different shapes look alike in weight. */
interface Props {
  company: CompanyId;
}
const props = defineProps<Props>();

const LOGOS: Readonly<Record<CompanyId, Component>> = {
  supercell: SupercellLogo,
  veri: VeriLogo,
};
</script>

<template>
  <component :is="LOGOS[props.company]" class="logo" :class="props.company" />
</template>

<style scoped>
.logo {
  width: auto;
  height: 1.25rem;
}

/* The stacked three-line mark needs more height to match the one-line wordmark */
.supercell {
  height: 1.75rem;
}
</style>
