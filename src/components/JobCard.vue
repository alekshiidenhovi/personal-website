<script setup lang="ts">
import Tag from "./Tag.vue";
import SupercellLogo from "./SupercellLogo.vue";
import VeriLogo from "./VeriLogo.vue";

interface Props {
  jobTitle: string;
  startYear: number;
  startMonth: number;
  endYear: number;
  endMonth: number;
  jobDescription: string;
  companyUrl: string;
  logoName: "supercell" | "veri";
  tags: string[];
}

const props = defineProps<Props>();
</script>

<template>
  <div class="card">
    <div class="left-container">
      <h3>{{ props.jobTitle }}</h3>
      <span class="time">{{ props.startYear }}/{{ props.startMonth }} - {{ props.endYear }}/{{ props.endMonth
        }}</span>
      <p>{{ props.jobDescription }}</p>
      <div class="tags-container">
        <Tag v-for="tag in props.tags" :key="tag" :text="tag" :color="'machine learning'" />
      </div>
    </div>
    <a class="logo-container" :href="props.companyUrl" target="_blank">
      <SupercellLogo v-if="props.logoName === 'supercell'" />
      <VeriLogo v-else-if="props.logoName === 'veri'" />
    </a>
  </div>
</template>

<style scoped>
.card {
  background-color: var(--neutral-900);
  border: 2px solid var(--neutral-800);
  padding: 2.25rem;
  display: flex;
  gap: 2rem;
  align-items: center;
}

.left-container {
  width: 100%;
}

h3 {
  font-size: 1.5rem;
  line-height: 2rem;
  font-weight: 400;
  color: var(--neutral-200);
  text-transform: uppercase;
  letter-spacing: 3px;
}

.time {
  font-size: 0.875rem;
  line-height: 1.125rem;
  font-weight: 400;
  color: var(--neutral-500);
  letter-spacing: 1px;
}

p {
  font-size: 1.125rem;
  line-height: 1.75rem;
  font-weight: 400;
  color: var(--neutral-400);
  padding-top: 0.875rem;
}

.tags-container {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  overflow-x: hidden;
  padding-top: 1.25rem;
}

.logo-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 16rem;
  height: auto;
}
</style>
