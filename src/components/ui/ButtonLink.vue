<script setup lang="ts">
import Icon from './Icon.vue';
import type { IconName } from './icons';

/** A link styled as a button: solid for the main action, outlined otherwise, with an optional trailing icon. */
interface Props {
  href: string;
  variant?: 'primary' | 'secondary';
  /** An icon after the label. */
  icon?: IconName;
  /** Whether the link opens in a new tab. */
  external?: boolean;
}
const props = withDefaults(defineProps<Props>(), { variant: 'primary', icon: undefined, external: false });
</script>

<template>
  <a class="button" :class="props.variant" :href="props.href" :target="props.external ? '_blank' : undefined">
    <slot />
    <Icon v-if="props.icon" :icon="props.icon" class="icon" />
  </a>
</template>

<style scoped>
@import "../../styles/media.css";

/* Centered, so the label stays in the middle when a layout stretches the button */
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1.375rem;
  border: 1px solid transparent;
  font-size: 0.95rem;
  font-weight: 600;
  text-decoration: none;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;
}

.button:hover {
  transform: translateY(-2px);
}

.primary {
  color: var(--neutral-950);
  background-color: var(--primary-400);
}

.primary:hover {
  background-color: var(--primary-300);
}

.secondary {
  color: var(--neutral-200);
  border-color: var(--neutral-700);
  background-color: color-mix(in srgb, var(--neutral-900), transparent 40%);
}

.secondary:hover {
  border-color: var(--primary-500);
  color: var(--primary-300);
}

.icon {
  width: 1.125rem;
  height: 1.125rem;
}

/* Short screens (phones in landscape) need the height */
@media (--short) {
  .button {
    padding: 0.625rem 1rem;
  }
}
</style>
