<script setup lang="ts">
import { CV, PROFILES } from '../../content/contact';
import Icon from '../ui/Icon.vue';
</script>

<template>
  <div class="links">
    <a :href="CV.href" target="_blank" class="link cv">
      <Icon :icon="CV.icon" class="icon" />
      {{ CV.label }}
    </a>
    <a v-for="profile in PROFILES" :key="profile.href" :href="profile.href" target="_blank" rel="noreferrer"
      class="link">
      <Icon :icon="profile.icon" class="icon" />
      {{ profile.label }}
    </a>
  </div>
</template>

<style scoped>
.links {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.link {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.25rem;
  border: 1px solid var(--neutral-800);
  background-color: var(--neutral-900);
  font-family: var(--font-mono);
  font-size: 0.9375rem;
  color: var(--neutral-200);
  text-decoration: none;
  transition:
    border-color 0.2s ease,
    color 0.2s ease;
}

.link:hover {
  border-color: color-mix(in srgb, var(--primary-500), transparent 40%);
  color: var(--primary-300);
}

.icon {
  width: 1.125rem;
  height: 1.125rem;
}

/* Narrow pages (phones): the CV full width, the profiles side by side below it as two equal buttons, a step smaller */
@container page (width < 36rem) {
  .links {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
  }

  .link {
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
  }

  .cv {
    grid-column: 1 / -1;
  }
}
</style>
