<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue';
import { useTilt } from '../../composables/useTilt';
import { PROJECT_TAG_LABELS, type Project } from '../../content/projects';
import Icon from '../ui/Icon.vue';
import { PROJECT_COVERS } from './projectCovers';

/**
 * A project as a card linking to it: its tag, an animated cover, and its title. The card tilts towards the mouse
 * (see useTilt), and its cover plays while hovered or focused.
 */
interface Props {
  project: Project;
  /** Whether the card is the large one of its page. */
  featured?: boolean;
  /** Whether the cover plays without hover, where there is no pointer to hover with. */
  playing?: boolean;
}
const props = withDefaults(defineProps<Props>(), { featured: false, playing: false });

const cardRef = useTemplateRef<HTMLElement>('card');
const isHovered = ref(false);
const tilt = useTilt(cardRef);
const isActive = computed(() => isHovered.value || props.playing);
const cover = PROJECT_COVERS[props.project.cover];
// Side projects aren't a discipline, so they keep a neutral color and the default selection
const discipline = props.project.tag === 'side-project' ? undefined : props.project.tag;
</script>

<template>
  <a ref="card" class="card dot-grid" :class="{ featured: props.featured, active: isActive }"
    :data-discipline="discipline" :style="tilt" :href="props.project.url" target="_blank" rel="noreferrer"
    @pointerenter="isHovered = true" @pointerleave="isHovered = false" @focus="isHovered = true"
    @blur="isHovered = false">
    <div class="metadata">
      <span class="tag">{{ PROJECT_TAG_LABELS[props.project.tag] }}</span>
      <span class="link-label">
        {{ props.project.linkLabel }}
        <Icon icon="heroicons:arrow-up-right-20-solid" class="arrow" />
      </span>
    </div>
    <div class="cover" role="img" :aria-label="props.project.coverDescription">
      <component :is="cover" :active="isActive" />
    </div>
    <div class="title">
      <h3>{{ props.project.title }}</h3>
      <p>{{ props.project.description }}</p>
    </div>
  </a>
</template>

<style scoped>
.card {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  /* A faint tint of the card's color at rest, brightening on hover */
  border: 1px solid color-mix(in srgb, var(--card-color) 18%, var(--neutral-800));
  background-color: var(--neutral-900);
  text-decoration: none;
  outline: none;
  transform: perspective(75rem) rotateX(calc(var(--tilt-y) * -3deg)) rotateY(calc(var(--tilt-x) * 3deg));
  transition:
    transform 0.25s ease-out,
    border-color 0.3s ease,
    box-shadow 0.3s ease;
  will-change: transform;
}

.card:not([data-discipline]) {
  --card-color: var(--neutral-400);
}

/* A soft glow in the card's color behind the cover */
.card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse 70% 60% at 50% 45%,
    color-mix(in srgb, var(--card-color), transparent 88%),
    transparent
  );
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

.metadata {
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

.link-label {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  gap: 0.25rem;
  color: var(--text-muted);
  transition: color 0.2s ease;
}

.active .link-label {
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

.cover {
  position: relative;
  flex-grow: 1;
  min-height: 0;
  padding: 0.75rem 1.25rem;
}

.title {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  padding: 0 1.5rem 1.5rem;
}

h3 {
  font-size: 1.5rem;
  line-height: 1.2;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--neutral-100);
}

p {
  font-size: 1rem;
  line-height: 1.5;
  color: var(--neutral-400);
}

/* The featured card stands out only where the page is tall enough for the featured layout (see ProjectsSection) */
@container page (height >= 34rem) {
  .featured .cover {
    padding: 2rem 3rem;
  }

  .featured h3 {
    font-size: clamp(1.75rem, 3vw, 2.75rem);
  }

  .featured p {
    font-size: 1.125rem;
  }
}
</style>
