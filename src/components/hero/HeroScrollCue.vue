<script setup lang="ts">
import Icon from '../ui/Icon.vue';

/** A bobbing arrow at the bottom of the hero, scrolling (rather than jumping) to what follows. */
interface Props {
  /** The in-page link to what follows. */
  href: string;
  /** The accessible name, as the arrow has no text. */
  label: string;
}
defineProps<Props>();
</script>

<template>
  <a class="scroll-cue" :href="href" data-scroll :aria-label="label">
    <Icon icon="heroicons:arrow-down" class="arrow" />
  </a>
</template>

<style scoped>
.scroll-cue {
  position: absolute;
  bottom: clamp(1.25rem, 3vh, 2.5rem);
  left: 50%;
  z-index: 1;
  display: flex;
  padding: 0.5rem;
  translate: -50% 0;
  color: var(--text-muted);
  transition: color 0.2s ease;
}

.scroll-cue:hover,
.scroll-cue:focus-visible {
  color: var(--primary-400);
}

.arrow {
  width: 1.5rem;
  height: 1.5rem;
  animation: bob 2.4s cubic-bezier(0.45, 0, 0.55, 1) infinite;
}

/* Bob downward, brightening at the lowest point to lead the eye down */
@keyframes bob {
  0%,
  100% {
    translate: 0 -0.25rem;
    opacity: 0.4;
  }

  50% {
    translate: 0 0.5rem;
    opacity: 1;
  }
}
</style>
