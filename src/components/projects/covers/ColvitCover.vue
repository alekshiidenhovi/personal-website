<script setup lang="ts">
import FlowArrow from '../../ui/FlowArrow.vue';
import { getStaggeredTransition } from './stagger';

/**
 * Image retrieval: a query image, split into patches, searched against a gallery. While active, each gallery image
 * is scored in turn, and the match locks in. The images are small landscapes: a mountain ridge under a sun.
 */
interface Props {
  /** Whether the cover plays. */
  active: boolean;
}
const props = defineProps<Props>();

/** A landscape, drawn around (0, 0) and scaled into place. */
interface Scene {
  /** The ridge's heights above the horizon, sampled evenly from left to right. */
  readonly ridge: readonly number[];
  readonly sun: { readonly x: number; readonly y: number; readonly r: number };
}

const QUERY_SCENE: Scene = { ridge: [4, 22, 10, 30, 14, 6], sun: { x: 22, y: -22, r: 7 } };
const GALLERY: readonly { readonly scene: Scene; readonly score: number }[] = [
  { scene: { ridge: [10, 14, 26, 12, 20, 8], sun: { x: -20, y: -24, r: 6 } }, score: 0.31 },
  { scene: { ridge: [2, 8, 16, 34, 18, 4], sun: { x: -24, y: -18, r: 8 } }, score: 0.42 },
  { scene: { ridge: [18, 8, 4, 10, 28, 16], sun: { x: 4, y: -26, r: 6 } }, score: 0.27 },
  { scene: { ridge: [6, 12, 8, 14, 10, 6], sun: { x: 24, y: -10, r: 9 } }, score: 0.18 },
  { scene: QUERY_SCENE, score: 0.94 },
  { scene: { ridge: [8, 26, 12, 22, 8, 12], sun: { x: 26, y: -24, r: 5 } }, score: 0.36 },
];
const MATCH_INDEX = GALLERY.findIndex((entry) => entry.scene === QUERY_SCENE);

const QUERY = { x: 16, y: 50, patchSize: 22, gridSize: 4, scale: 0.95 };
const QUERY_CENTER = {
  x: QUERY.x + (QUERY.gridSize * QUERY.patchSize) / 2,
  y: QUERY.y + (QUERY.gridSize * QUERY.patchSize) / 2,
};
/** Scenes are drawn in a box of this half-width around their center. */
const SCENE_HALF_WIDTH = 40;
const HORIZON_Y = 26;
const HORIZON_PATH = `M${-SCENE_HALF_WIDTH} ${HORIZON_Y} H${SCENE_HALF_WIDTH}`;
const THUMB = { x: 172, y: 40, width: 56, height: 68, gap: 8, columns: 3, scale: 0.42 };
const PATCH_STAGGER_S = 0.04;
const SCAN_START_S = QUERY.gridSize ** 2 * PATCH_STAGGER_S;
const SCAN_STAGGER_S = 0.25;
const SCAN_DURATION_S = 0.5;
// The match is revealed once the last gallery image has finished its scan flash
const MATCH_DELAY_S = SCAN_START_S + (GALLERY.length - 1) * SCAN_STAGGER_S + SCAN_DURATION_S;

/**
 * Gets the left edge of a gallery column.
 *
 * @param index The image's index in the gallery.
 * @returns The x coordinate.
 */
function getThumbX(index: number): number {
  return THUMB.x + (index % THUMB.columns) * (THUMB.width + THUMB.gap);
}

/**
 * Draws a scene's ridge, closed along the horizon.
 *
 * @param scene The scene.
 * @returns The path's `d` attribute.
 */
function drawRidge({ ridge }: Scene): string {
  const step = (SCENE_HALF_WIDTH * 2) / (ridge.length - 1);
  const points = ridge.map((height, index) => `${-SCENE_HALF_WIDTH + index * step} ${HORIZON_Y - height}`);
  return `M${-SCENE_HALF_WIDTH} ${HORIZON_Y} L${points.join(' L')} L${SCENE_HALF_WIDTH} ${HORIZON_Y}`;
}

const patches = Array.from({ length: QUERY.gridSize ** 2 }, (_, index) => ({
  index,
  x: QUERY.x + (index % QUERY.gridSize) * QUERY.patchSize,
  y: QUERY.y + Math.floor(index / QUERY.gridSize) * QUERY.patchSize,
}));

const thumbnails = GALLERY.map((entry, index) => ({
  ...entry,
  index,
  x: getThumbX(index),
  y: THUMB.y + Math.floor(index / THUMB.columns) * (THUMB.height + THUMB.gap),
  ridge: drawRidge(entry.scene),
  isMatch: index === MATCH_INDEX,
  delayS: SCAN_START_S + index * SCAN_STAGGER_S,
}));
</script>

<template>
  <svg class="drawing" :class="{ active: props.active }" viewBox="0 0 400 200" aria-hidden="true"
    :style="{ '--scan-duration': `${SCAN_DURATION_S}s`, '--match-delay': `${MATCH_DELAY_S}s` }">
    <text :x="QUERY.x" y="40" class="drawing-text label">query</text>
    <text :x="THUMB.x" y="30" class="drawing-text label">gallery</text>

    <!-- The query image, split into patches -->
    <rect v-for="patch in patches" :key="patch.index" :x="patch.x" :y="patch.y" :width="QUERY.patchSize"
      :height="QUERY.patchSize" class="drawing-line muted patch"
      :style="getStaggeredTransition(props.active, patch.index, PATCH_STAGGER_S)" />
    <g :transform="`translate(${QUERY_CENTER.x} ${QUERY_CENTER.y}) scale(${QUERY.scale})`" class="query-scene">
      <circle :cx="QUERY_SCENE.sun.x" :cy="QUERY_SCENE.sun.y" :r="QUERY_SCENE.sun.r" class="drawing-line" />
      <path :d="drawRidge(QUERY_SCENE)" class="drawing-line" />
      <path :d="HORIZON_PATH" class="drawing-line" />
    </g>

    <text x="118" y="92" class="drawing-text label">search</text>
    <FlowArrow :x1="114" :x2="162" :y="100" />

    <!-- The gallery, scored one by one -->
    <g v-for="thumb in thumbnails" :key="thumb.index" class="thumb" :class="{ match: thumb.isMatch }"
      :style="{ '--delay': `${thumb.delayS}s` }">
      <rect v-if="thumb.isMatch" :x="thumb.x" :y="thumb.y" :width="THUMB.width" :height="THUMB.height"
        class="drawing-fill accent halo" />
      <rect :x="thumb.x" :y="thumb.y" :width="THUMB.width" :height="THUMB.height" class="drawing-line muted frame" />
      <g :transform="`translate(${thumb.x + THUMB.width / 2} ${thumb.y + 27}) scale(${THUMB.scale})`" class="scene">
        <circle :cx="thumb.scene.sun.x" :cy="thumb.scene.sun.y" :r="thumb.scene.sun.r" class="drawing-line" />
        <path :d="thumb.ridge" class="drawing-line" />
        <path :d="HORIZON_PATH" class="drawing-line" />
      </g>
      <text :x="thumb.x + THUMB.width / 2" :y="thumb.y + THUMB.height - 6" text-anchor="middle"
        class="drawing-text score drawing-sequence">{{ thumb.score.toFixed(2) }}</text>
    </g>

    <text :x="getThumbX(MATCH_INDEX) + THUMB.width / 2" y="194" text-anchor="middle"
      class="drawing-text label accent drawing-sequence match-label"
      :style="{ '--delay': `calc(${MATCH_DELAY_S}s + 0.15s)` }">▲ match</text>
  </svg>
</template>

<style scoped>
.patch {
  fill: var(--card-color);
  fill-opacity: 0;
}

.active .patch {
  stroke: var(--drawing-accent);
  fill-opacity: 0.08;
}

.active .query-scene .drawing-line {
  stroke: var(--drawing-accent);
}

.frame {
  fill: var(--card-color);
  fill-opacity: 0;
}

.score {
  font-size: 8px;
}

/* Two steps: every gallery image flashes as it is scored, then the match is revealed while the rest dims */
.active .frame {
  animation: scan var(--scan-duration) ease var(--delay) both;
}

.active .match .frame {
  animation:
    scan var(--scan-duration) ease var(--delay) both,
    lock 0.5s ease var(--match-delay) forwards;
}

.active .match .scene .drawing-line {
  animation: to-accent-stroke 0.5s ease var(--match-delay) forwards;
}

.active .match .score {
  animation:
    drawing-appear 0.3s ease var(--delay) both,
    to-accent-fill 0.5s ease var(--match-delay) forwards;
}

.active .thumb:not(.match) {
  animation: dim 0.5s ease var(--match-delay) forwards;
}

/* A static blur whose opacity fades in: smoother than transitioning a filter */
.halo {
  opacity: 0;
  filter: blur(6px);
}

.active .halo {
  animation: halo 0.5s ease var(--match-delay) forwards;
}

.active .match-label {
  fill: var(--drawing-accent);
}

@keyframes scan {
  50% {
    stroke: var(--drawing-accent);
    fill-opacity: 0.1;
  }
}

@keyframes lock {
  to {
    stroke: var(--drawing-accent);
    fill-opacity: 0.12;
  }
}

@keyframes to-accent-stroke {
  to {
    stroke: var(--drawing-accent);
  }
}

@keyframes to-accent-fill {
  to {
    fill: var(--drawing-accent);
  }
}

@keyframes dim {
  to {
    opacity: 0.4;
  }
}

@keyframes halo {
  to {
    opacity: 0.25;
  }
}
</style>
