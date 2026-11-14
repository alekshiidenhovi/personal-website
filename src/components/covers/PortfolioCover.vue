<script setup lang="ts">
/** A wireframe of this very site; its sections light up one by one when active. */

interface Props {
  active: boolean;
}
const props = defineProps<Props>();

interface Block {
  x: number;
  y: number;
  width: number;
  height: number;
  filled?: boolean;
}

const BLOCKS: Block[] = [
  // Hero: name, pitch and terminal
  { x: 76, y: 34, width: 110, height: 14, filled: true },
  { x: 76, y: 54, width: 150, height: 4, filled: true },
  { x: 76, y: 62, width: 120, height: 4, filled: true },
  { x: 250, y: 32, width: 74, height: 40 },
  // Bento grid
  { x: 76, y: 84, width: 248, height: 40 },
  { x: 76, y: 130, width: 121, height: 30 },
  { x: 203, y: 130, width: 121, height: 30 },
];
const TIMELINE_DOTS = [110, 200, 290];
const STAGGER_S = 0.12;
</script>

<template>
  <svg class="cover" :class="{ active: props.active }" viewBox="0 0 400 200" aria-hidden="true">
    <!-- Browser frame -->
    <rect x="60" y="4" width="280" height="192" rx="6" class="cover-line" />
    <line x1="60" y1="22" x2="340" y2="22" class="cover-line" />
    <circle v-for="x in [72, 82, 92]" :key="x" :cx="x" cy="13" r="3" class="cover-line" />
    <rect x="110" y="8.5" width="150" height="9" rx="4.5" class="cover-line muted" />
    <text x="118" y="15.5" class="cover-text label">localhost:5173</text>

    <!-- Page sections -->
    <rect v-for="(block, index) in BLOCKS" :key="index" :x="block.x" :y="block.y" :width="block.width"
      :height="block.height" class="block" :class="block.filled ? 'cover-fill' : 'cover-line'"
      :style="{ transitionDelay: props.active ? `${index * STAGGER_S}s` : '0s' }" />
    <text v-for="(line, index) in ['$ whoami', '$ ls']" :key="line" x="256" :y="44 + index * 11"
      class="cover-text label">{{ line }}</text>

    <!-- Timeline -->
    <line x1="76" y1="178" x2="324" y2="178" class="cover-line muted" />
    <circle v-for="(x, index) in TIMELINE_DOTS" :key="x" :cx="x" cy="178" r="3" class="cover-fill timeline-dot"
      :style="{ transitionDelay: props.active ? `${(BLOCKS.length + index) * STAGGER_S}s` : '0s' }" />
  </svg>
</template>

<style scoped>
.block.cover-line {
  fill: var(--card-color);
  fill-opacity: 0;
}

.active .block.cover-fill,
.active .timeline-dot {
  fill: var(--cover-accent);
}

.active .block.cover-line {
  stroke: var(--cover-accent);
  fill-opacity: 0.12;
}
</style>
