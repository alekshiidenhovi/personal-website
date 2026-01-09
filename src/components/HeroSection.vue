<script setup lang="ts">
import { Icon } from '@iconify/vue';
</script>

<template>
  <section id="hero">
    <div class="gradient-overlay"></div>
    <h1>
      Aleks Hiidenhovi
    </h1>
    <div class="subtitle-container">
      <span class="subtitle-base subtitle-ml">machine learning</span>
      <span class="subtitle-base subtitle-ll">low level</span>
      <span class="subtitle-base subtitle-wd">web dev</span>
    </div>
    <div class="social-container">
      <a href="https://github.com/alekshiidenhovi" target="_blank" rel="noreferrer">
        <Icon :icon="'simple-icons:github'" class="icon" />
      </a>
      <a href="https://www.linkedin.com/in/hiidenhovi/" target="_blank" rel="noreferrer">
        <Icon :icon="'simple-icons:linkedin'" class="icon" />
      </a>
    </div>
  </section>
</template>

<style scoped>
#hero {
  display: flex;
  flex-direction: column;
  position: relative;
  height: 100dvh;
  width: 100dvw;
  align-items: center;
  justify-content: center;
  gap: clamp(0.5rem, 1.5vw, 1.25rem);
  overflow: hidden;
  padding: clamp(2rem, 2vw, 4rem);
}

.gradient-overlay {
  background-image: radial-gradient(ellipse 120rem 60rem at 50% 0%,
      color-mix(in srgb, var(--primary-600), transparent 75%) 0%,
      color-mix(in srgb, var(--primary-600), transparent 88%) 20%,
      color-mix(in srgb, var(--primary-600), transparent 94%) 35%,
      color-mix(in srgb, var(--primary-600), transparent 97%) 50%,
      color-mix(in srgb, var(--primary-600), transparent 99.85%) 65%,
      color-mix(in srgb, var(--primary-600), transparent 99.95%) 80%,
      transparent 100%);
  pointer-events: none;
  position: absolute;
  inset: 0;
}

h1 {
  color: var(--primary-50);
  font-size: clamp(2.5rem, 8vw, 8rem);
  letter-spacing: 3px;
  line-height: 1;
  font-weight: 700;
  text-align: center;
}

.subtitle-container {
  display: flex;
  gap: clamp(1rem, 2vw, 2rem);
}

.subtitle-base {
  font-size: clamp(0.75rem, 1.5vw, 1.5rem);
  letter-spacing: clamp(0.15rem, 0.5vw, 0.375rem);
  text-transform: uppercase;
}

.subtitle-ml {
  color: var(--primary-500);
}

.subtitle-ll {
  color: var(--accent-500);
}

.subtitle-wd {
  color: var(--warning-500);
}

.social-container {
  display: flex;
  gap: clamp(0.8rem, 2vw, 1.5rem);
  align-items: center;
  padding-top: clamp(1rem, 2vw, 2rem);
}

.icon {
  width: clamp(1.5rem, 3vw, 4rem);
  height: clamp(1.5rem, 3vw, 4rem);
  color: var(--neutral-500);
  opacity: 0.6;
  transition: all 0.2s ease;
  will-change: opacity, color;
}

.icon:hover {
  opacity: 0.8;
  color: var(--primary-500);
}

.icon:active {
  opacity: 1;
}
</style>
