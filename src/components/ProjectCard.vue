<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { computed, ref } from "vue";
import { usePointerVars } from "../composables/usePointerVars";
import { PROJECT_TAG_COLOR, type Project } from "../data/projects";
import "./covers/cover.css";

interface Props {
  project: Project;
  featured?: boolean;
  /** Plays the cover without hover; used where there is no pointer to hover with */
  playing?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  featured: false,
  playing: false,
});

const cardRef = ref<HTMLElement | null>(null);
usePointerVars(cardRef);

const isHovered = ref(false);
const isActive = computed(() => isHovered.value || props.playing);
const linkType = computed(() => (new URL(props.project.link).hostname === "github.com" ? "source" : "live demo"));
</script>

<template>
  <a ref="cardRef" class="card" :class="{ featured: props.featured, active: isActive }"
    :style="{
      '--card-color': PROJECT_TAG_COLOR[props.project.tag],
      // Side projects aren't a discipline, so their selection stays the default blue
      '--selection-color': props.project.tag === 'side project' ? undefined : PROJECT_TAG_COLOR[props.project.tag],
    }" :href="props.project.link" target="_blank"
    rel="noreferrer" @pointerenter="isHovered = true" @pointerleave="isHovered = false" @focus="isHovered = true"
    @blur="isHovered = false">
    <div class="metadata-container">
      <span class="tag">{{ props.project.tag }}</span>
    </div>
    <div class="cover-container" role="img" :aria-label="props.project.coverDescription">
      <component :is="props.project.cover" :active="isActive" />
    </div>
    <div class="title-container">
      <div class="title-row">
        <h3>{{ props.project.title }}</h3>
        <span class="link-type">
          {{ linkType }}
          <Icon icon="heroicons:arrow-up-right-20-solid" class="arrow" />
        </span>
      </div>
      <p>{{ props.project.description }}</p>
    </div>
  </a>
</template>

<style scoped>
.card {
  --tilt-x: 0;
  --tilt-y: 0;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  /* A faint tint of the card's color at rest, brightening on hover */
  border: 1px solid color-mix(in srgb, var(--card-color) 18%, var(--neutral-800));
  background-color: var(--neutral-900);
  background-image: radial-gradient(color-mix(in srgb, var(--neutral-500), transparent 85%) 1px, transparent 1px);
  background-size: 1.25rem 1.25rem;
  text-decoration: none;
  outline: none;
  transform: perspective(75rem) rotateX(calc(var(--tilt-y) * -3deg)) rotateY(calc(var(--tilt-x) * 3deg));
  transition: transform 0.25s ease-out, border-color 0.3s ease, box-shadow 0.3s ease;
  will-change: transform;
}

/* Soft glow in the card's color behind the cover */
.card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 70% 60% at 50% 45%, color-mix(in srgb, var(--card-color), transparent 88%), transparent);
  opacity: 0.35;
  transition: opacity 0.4s ease;
  pointer-events: none;
}

.card.active {
  border-color: color-mix(in srgb, var(--card-color), transparent 50%);
  box-shadow: 0 2rem 5rem -2.5rem color-mix(in srgb, var(--card-color), transparent 60%);
}

.card.active::before {
  opacity: 1;
}

.card:focus-visible {
  outline: 2px solid var(--card-color);
  outline-offset: 4px;
}

.metadata-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.25rem 0;
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.tag {
  padding: 0.375rem 0.75rem;
  color: var(--card-color);
  border: 1px solid color-mix(in srgb, var(--card-color), transparent 60%);
  background-color: color-mix(in srgb, var(--card-color), transparent 92%);
}

.cover-container {
  position: relative;
  flex-grow: 1;
  min-height: 0;
  padding: 0.75rem 1.25rem;
}

.featured .cover-container {
  padding: 2rem 3rem;
}

.title-container {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  padding: 0 1.5rem 1.5rem;
}

.title-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}

h3 {
  font-size: 1.5rem;
  line-height: 1.2;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--neutral-100);
}

.featured h3 {
  font-size: clamp(1.75rem, 3vw, 2.75rem);
}

p {
  font-size: 1rem;
  line-height: 1.5;
  color: var(--neutral-400);
}

.featured p {
  font-size: 1.125rem;
}

.link-type {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  gap: 0.25rem;
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  color: var(--text-muted);
  transition: color 0.2s ease;
}

.active .link-type {
  color: var(--card-color);
}

.arrow {
  width: 1rem;
  height: 1rem;
  transition: transform 0.2s ease;
}

.active .arrow {
  transform: translate(2px, -2px);
}
</style>
