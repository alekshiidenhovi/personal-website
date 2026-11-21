<script setup lang="ts">
import { EMAIL } from '../../content/contact';
import Icon from '../ui/Icon.vue';
</script>

<template>
  <a class="cta" :href="`mailto:${EMAIL}`">
    <span>Let's talk<span class="dot">.</span></span>
    <Icon icon="heroicons:arrow-up-right-20-solid" class="arrow" />
  </a>
</template>

<style scoped>
@import "../../styles/media.css";

.cta {
  display: inline-flex;
  align-items: center;
  gap: 0.15em;
  width: fit-content;
  font-size: clamp(3.5rem, min(13vw, 22svh), 12rem);
  font-weight: 700;
  letter-spacing: -0.05em;
  line-height: 0.9;
  text-decoration: none;
  /*
   * A strip of the gradient followed by the solid text color, twice the text's width and clipped to it. Sliding
   * it from the solid end to the gradient end wipes the gradient in on hover, and back out the same way.
   */
  color: transparent;
  background: linear-gradient(
      90deg,
      var(--primary-400) 0%,
      var(--accent-400) 22%,
      var(--warning-400) 45%,
      var(--neutral-100) 54%
    )
    right / 220% 100% no-repeat;
  background-clip: text;
  transition: background-position 0.6s cubic-bezier(0.2, 0.7, 0.2, 1);
}

.cta:hover {
  background-position: left;
}

.dot {
  color: var(--primary-400);
}

.arrow {
  width: 0.5em;
  height: 0.5em;
  color: var(--text-muted);
  transition:
    color 0.3s ease,
    transform 0.3s ease;
}

.cta:hover .arrow {
  color: var(--warning-400);
  transform: translate(0.1em, -0.1em);
}

/* Short screens (phones in landscape): sized to the height */
@media (--short) {
  .cta {
    font-size: 16svh;
  }
}
</style>
