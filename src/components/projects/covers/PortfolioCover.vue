<script setup lang="ts">
import { getStaggeredTransition } from './stagger';

/** A wireframe of this very site; its sections light up one by one while active. */
interface Props {
  /** Whether the cover plays. */
  active: boolean;
}
const props = defineProps<Props>();

/** A block of the wireframe: a filled line of text, or an outlined box. */
interface Block {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly isFilled: boolean;
}

const BLOCKS: readonly Block[] = [
  // The hero: name, pitch and terminal
  { x: 76, y: 34, width: 110, height: 14, isFilled: true },
  { x: 76, y: 54, width: 150, height: 4, isFilled: true },
  { x: 76, y: 62, width: 120, height: 4, isFilled: true },
  { x: 250, y: 32, width: 74, height: 40, isFilled: false },
  // The bento grid
  { x: 76, y: 84, width: 248, height: 40, isFilled: false },
  { x: 76, y: 130, width: 121, height: 30, isFilled: false },
  { x: 203, y: 130, width: 121, height: 30, isFilled: false },
];
const BROWSER_DOTS_X = [72, 82, 92];
const TERMINAL_LINES = ['$ whoami', '$ ls'];
const TIMELINE_DOTS_X = [110, 200, 290];
const STAGGER_S = 0.12;
</script>

<template>
  <svg class="drawing" :class="{ active: props.active }" viewBox="0 0 400 200" aria-hidden="true">
    <!-- The browser frame -->
    <rect x="60" y="4" width="280" height="192" rx="6" class="drawing-line" />
    <line x1="60" y1="22" x2="340" y2="22" class="drawing-line" />
    <circle v-for="x in BROWSER_DOTS_X" :key="x" :cx="x" cy="13" r="3" class="drawing-line" />
    <rect x="110" y="8.5" width="150" height="9" rx="4.5" class="drawing-line muted" />
    <text x="118" y="15.5" class="drawing-text label">localhost:5173</text>

    <!-- The page's sections -->
    <rect v-for="(block, index) in BLOCKS" :key="index" :x="block.x" :y="block.y" :width="block.width"
      :height="block.height" class="block" :class="block.isFilled ? 'drawing-fill' : 'drawing-line'"
      :style="getStaggeredTransition(props.active, index, STAGGER_S)" />
    <text v-for="(line, index) in TERMINAL_LINES" :key="line" x="256" :y="44 + index * 11" class="drawing-text label">{{
      line }}</text>

    <!-- The timeline -->
    <line x1="76" y1="178" x2="324" y2="178" class="drawing-line muted" />
    <circle v-for="(x, index) in TIMELINE_DOTS_X" :key="x" :cx="x" cy="178" r="3" class="drawing-fill timeline-dot"
      :style="getStaggeredTransition(props.active, BLOCKS.length + index, STAGGER_S)" />
  </svg>
</template>

<style scoped>
.block.drawing-line {
  fill: var(--card-color);
  fill-opacity: 0;
}

.active .block.drawing-fill,
.active .timeline-dot {
  fill: var(--drawing-accent);
}

.active .block.drawing-line {
  stroke: var(--drawing-accent);
  fill-opacity: 0.12;
}
</style>
