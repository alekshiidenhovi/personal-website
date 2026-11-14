<script setup lang="ts">
import CoverArrow from "./CoverArrow.vue";

/**
 * Image retrieval: a query image, split into patches, is searched against a
 * gallery. When active, each gallery image is scored in turn and the match
 * locks in. The images are small landscapes: a mountain ridge under a sun.
 */

interface Props {
  active: boolean;
}
const props = defineProps<Props>();

interface Scene {
  /** Ridge heights above the horizon, sampled evenly from left to right */
  ridge: number[];
  sun: { x: number; y: number; r: number };
}

const QUERY_SCENE: Scene = { ridge: [4, 22, 10, 30, 14, 6], sun: { x: 22, y: -22, r: 7 } };
const GALLERY: { scene: Scene; score: number }[] = [
  { scene: { ridge: [10, 14, 26, 12, 20, 8], sun: { x: -20, y: -24, r: 6 } }, score: 0.31 },
  { scene: { ridge: [2, 8, 16, 34, 18, 4], sun: { x: -24, y: -18, r: 8 } }, score: 0.42 },
  { scene: { ridge: [18, 8, 4, 10, 28, 16], sun: { x: 4, y: -26, r: 6 } }, score: 0.27 },
  { scene: { ridge: [6, 12, 8, 14, 10, 6], sun: { x: 24, y: -10, r: 9 } }, score: 0.18 },
  { scene: QUERY_SCENE, score: 0.94 },
  { scene: { ridge: [8, 26, 12, 22, 8, 12], sun: { x: 26, y: -24, r: 5 } }, score: 0.36 },
];
const MATCH_INDEX = GALLERY.findIndex((entry) => entry.scene === QUERY_SCENE);

const QUERY = { x: 16, y: 50, patchSize: 22, gridSize: 4, scale: 0.95 };
/** Scenes are drawn in a box of this half-width around their center */
const SCENE_HALF = 40;
const HORIZON_Y = 26;
const THUMB = { x: 172, y: 40, width: 56, height: 68, gap: 8, columns: 3, scale: 0.42 };
const PATCH_STAGGER_S = 0.04;
const SCAN_START_S = QUERY.gridSize * QUERY.gridSize * PATCH_STAGGER_S;
const SCAN_STAGGER_S = 0.25;
const SCAN_DURATION_S = 0.5;
// The match is revealed once the last gallery image has finished its scan flash
const MATCH_DELAY_S = SCAN_START_S + (GALLERY.length - 1) * SCAN_STAGGER_S + SCAN_DURATION_S;

const patches = Array.from({ length: QUERY.gridSize ** 2 }, (_, index) => ({
  index,
  x: QUERY.x + (index % QUERY.gridSize) * QUERY.patchSize,
  y: QUERY.y + Math.floor(index / QUERY.gridSize) * QUERY.patchSize,
}));

const thumbnails = GALLERY.map((entry, index) => {
  const x = THUMB.x + (index % THUMB.columns) * (THUMB.width + THUMB.gap);
  const y = THUMB.y + Math.floor(index / THUMB.columns) * (THUMB.height + THUMB.gap);
  return { ...entry, index, x, y, isMatch: index === MATCH_INDEX, delay: SCAN_START_S + index * SCAN_STAGGER_S };
});

/** A scene drawn around (0, 0); scaled into place by its parent group */
const ridgePath = ({ ridge }: Scene) => {
  const step = (SCENE_HALF * 2) / (ridge.length - 1);
  const points = ridge.map((height, i) => `${-SCENE_HALF + i * step} ${HORIZON_Y - height}`);
  return `M${-SCENE_HALF} ${HORIZON_Y} L${points.join(" L")} L${SCENE_HALF} ${HORIZON_Y}`;
};
const horizonPath = `M${-SCENE_HALF} ${HORIZON_Y} H${SCENE_HALF}`;
</script>

<template>
  <svg class="cover" :class="{ active: props.active }" viewBox="0 0 400 200" aria-hidden="true"
    :style="{ '--scan-duration': `${SCAN_DURATION_S}s`, '--match-delay': `${MATCH_DELAY_S}s` }">
    <text :x="QUERY.x" y="40" class="cover-text label">query</text>
    <text :x="THUMB.x" y="30" class="cover-text label">gallery</text>

    <!-- Query image, split into patches -->
    <rect v-for="patch in patches" :key="patch.index" :x="patch.x" :y="patch.y" :width="QUERY.patchSize"
      :height="QUERY.patchSize" class="cover-line muted patch"
      :style="{ transitionDelay: props.active ? `${patch.index * PATCH_STAGGER_S}s` : '0s' }" />
    <g :transform="`translate(${QUERY.x + (QUERY.gridSize * QUERY.patchSize) / 2} ${QUERY.y + (QUERY.gridSize * QUERY.patchSize) / 2}) scale(${QUERY.scale})`"
      class="scene query-scene">
      <circle :cx="QUERY_SCENE.sun.x" :cy="QUERY_SCENE.sun.y" :r="QUERY_SCENE.sun.r" class="cover-line" />
      <path :d="ridgePath(QUERY_SCENE)" class="cover-line" />
      <path :d="horizonPath" class="cover-line" />
    </g>

    <text x="118" y="92" class="cover-text label">search</text>
    <CoverArrow :x1="114" :x2="162" :y="100" />

    <!-- Gallery, scored one by one -->
    <g v-for="thumb in thumbnails" :key="thumb.index" class="thumb" :class="{ match: thumb.isMatch }"
      :style="{ '--delay': `${thumb.delay}s` }">
      <rect v-if="thumb.isMatch" :x="thumb.x" :y="thumb.y" :width="THUMB.width" :height="THUMB.height"
        class="cover-fill accent halo" />
      <rect :x="thumb.x" :y="thumb.y" :width="THUMB.width" :height="THUMB.height" class="cover-line muted frame" />
      <g :transform="`translate(${thumb.x + THUMB.width / 2} ${thumb.y + 27}) scale(${THUMB.scale})`" class="scene">
        <circle :cx="thumb.scene.sun.x" :cy="thumb.scene.sun.y" :r="thumb.scene.sun.r" class="cover-line" />
        <path :d="ridgePath(thumb.scene)" class="cover-line" />
        <path :d="horizonPath" class="cover-line" />
      </g>
      <text :x="thumb.x + THUMB.width / 2" :y="thumb.y + THUMB.height - 6" text-anchor="middle"
        class="cover-text score cover-sequence">{{ thumb.score.toFixed(2) }}</text>
    </g>

    <text :x="THUMB.x + (MATCH_INDEX % THUMB.columns) * (THUMB.width + THUMB.gap) + THUMB.width / 2" y="194"
      text-anchor="middle" class="cover-text label accent cover-sequence match-label"
      :style="{ '--delay': `calc(${MATCH_DELAY_S}s + 0.15s)` }">▲ match</text>
  </svg>
</template>

<style scoped>
.patch {
  fill: var(--card-color);
  fill-opacity: 0;
}

.active .patch {
  stroke: var(--cover-accent);
  fill-opacity: 0.08;
}

.active .query-scene .cover-line {
  stroke: var(--cover-accent);
}

.frame {
  fill: var(--card-color);
  fill-opacity: 0;
}

.score {
  font-size: 8px;
}

/*
 * Two steps: every gallery image flashes as it is scored, then the match is
 * revealed all at once while the rest of the gallery dims.
 */
.active .frame {
  animation: scan var(--scan-duration) ease var(--delay) both;
}

.active .match .frame {
  animation:
    scan var(--scan-duration) ease var(--delay) both,
    lock 0.5s ease var(--match-delay) forwards;
}

.active .match .scene .cover-line {
  animation: to-accent-stroke 0.5s ease var(--match-delay) forwards;
}

.active .match .score {
  animation:
    cover-appear 0.3s ease var(--delay) both,
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
  fill: var(--cover-accent);
}

@keyframes scan {
  50% {
    stroke: var(--cover-accent);
    fill-opacity: 0.1;
  }
}

@keyframes lock {
  to {
    stroke: var(--cover-accent);
    fill-opacity: 0.12;
  }
}

@keyframes to-accent-stroke {
  to {
    stroke: var(--cover-accent);
  }
}

@keyframes to-accent-fill {
  to {
    fill: var(--cover-accent);
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
