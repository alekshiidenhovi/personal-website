<script setup lang="ts">
import { getSectionHref, HERO_ID } from '../../content/sections';
import Icon from '../ui/Icon.vue';

const year = new Date().getFullYear();
</script>

<template>
  <footer>
    <span>© {{ year }} Aleks Hiidenhovi</span>
    <a class="back-to-top" :href="getSectionHref(HERO_ID)">
      Back to top
      <Icon icon="heroicons:arrow-up-20-solid" />
    </a>
  </footer>
</template>

<style scoped>
footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--neutral-800);
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.back-to-top {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--neutral-400);
  text-decoration: none;
  transition: color 0.2s ease;
}

.back-to-top:hover {
  color: var(--primary-400);
}
</style>
