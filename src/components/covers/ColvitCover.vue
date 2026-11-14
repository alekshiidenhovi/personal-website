<script setup lang="ts">
import CoverArrow from "./CoverArrow.vue";

/**
 * Face identification: a query face, split into patches, is searched against a
 * gallery. When active, each gallery face is scored in turn and the match locks in.
 */

interface Props {
  active: boolean;
}
const props = defineProps<Props>();

interface Face {
  headWidth: number;
  headHeight: number;
  eyeGap: number;
  /** Positive smiles, negative frowns */
  mouthCurve: number;
  hair: "parted" | "fringe" | "none";
  glasses: boolean;
}

const QUERY_FACE: Face = { headWidth: 34, headHeight: 46, eyeGap: 13, mouthCurve: 8, hair: "parted", glasses: false };
const GALLERY: { face: Face; score: number }[] = [
  { face: { headWidth: 38, headHeight: 44, eyeGap: 15, mouthCurve: 2, hair: "fringe", glasses: false }, score: 0.31 },
  { face: { headWidth: 32, headHeight: 48, eyeGap: 11, mouthCurve: 6, hair: "none", glasses: true }, score: 0.42 },
  { face: { headWidth: 36, headHeight: 45, eyeGap: 14, mouthCurve: -3, hair: "parted", glasses: true }, score: 0.27 },
  { face: { headWidth: 40, headHeight: 42, eyeGap: 16, mouthCurve: 0, hair: "none", glasses: false }, score: 0.18 },
  { face: QUERY_FACE, score: 0.94 },
  { face: { headWidth: 33, headHeight: 47, eyeGap: 12, mouthCurve: 4, hair: "fringe", glasses: true }, score: 0.36 },
];
const MATCH_INDEX = GALLERY.findIndex((entry) => entry.face === QUERY_FACE);

const QUERY = { x: 16, y: 50, patchSize: 22, gridSize: 4, scale: 0.95 };
const THUMB = { x: 172, y: 40, width: 56, height: 68, gap: 8, columns: 3, scale: 0.42 };
const PATCH_STAGGER_S = 0.04;
const SCAN_START_S = QUERY.gridSize * QUERY.gridSize * PATCH_STAGGER_S;
const SCAN_STAGGER_S = 0.25;
const SCAN_DURATION_S = 0.5;
// The match is revealed once the last gallery face has finished its scan flash
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

/** Face drawn around (0, 0); scaled into place by its parent group */
const facePaths = (face: Face) => {
  const { headWidth: w, headHeight: h, eyeGap, mouthCurve } = face;
  const hair = {
    parted: `M${-w * 0.9} ${-h * 0.4} Q${-w * 0.2} ${-h * 1.2} ${w * 0.9} ${-h * 0.4} M${-w * 0.2} ${-h * 0.95} L${-w * 0.35} ${-h * 0.6}`,
    fringe: `M${-w * 0.85} ${-h * 0.45} Q0 ${-h * 0.25} ${w * 0.85} ${-h * 0.45}`,
    none: "",
  }[face.hair];
  return {
    eyes: [-eyeGap, eyeGap],
    features: `M0 -2 L-4 12 L2 14 M-12 24 Q0 ${24 + mouthCurve} 12 24`,
    hair,
  };
};
</script>

<template>
  <svg class="cover" :class="{ active: props.active }" viewBox="0 0 400 200" aria-hidden="true"
    :style="{ '--scan-duration': `${SCAN_DURATION_S}s`, '--match-delay': `${MATCH_DELAY_S}s` }">
    <text :x="QUERY.x" y="40" class="cover-text label">query</text>
    <text :x="THUMB.x" y="30" class="cover-text label">gallery</text>

    <!-- Query face, split into patches -->
    <rect v-for="patch in patches" :key="patch.index" :x="patch.x" :y="patch.y" :width="QUERY.patchSize"
      :height="QUERY.patchSize" class="cover-line muted patch"
      :style="{ transitionDelay: props.active ? `${patch.index * PATCH_STAGGER_S}s` : '0s' }" />
    <g :transform="`translate(${QUERY.x + (QUERY.gridSize * QUERY.patchSize) / 2} ${QUERY.y + (QUERY.gridSize * QUERY.patchSize) / 2}) scale(${QUERY.scale})`"
      class="face query-face">
      <ellipse :rx="QUERY_FACE.headWidth" :ry="QUERY_FACE.headHeight" class="cover-line" />
      <circle v-for="eyeX in facePaths(QUERY_FACE).eyes" :key="eyeX" :cx="eyeX" cy="-8" r="3.5" class="cover-line" />
      <path :d="facePaths(QUERY_FACE).features" class="cover-line" />
      <path :d="facePaths(QUERY_FACE).hair" class="cover-line" />
    </g>

    <text x="118" y="92" class="cover-text label">search</text>
    <CoverArrow :x1="114" :x2="162" :y="100" />

    <!-- Gallery, scored one by one -->
    <g v-for="thumb in thumbnails" :key="thumb.index" class="thumb" :class="{ match: thumb.isMatch }"
      :style="{ '--delay': `${thumb.delay}s` }">
      <rect v-if="thumb.isMatch" :x="thumb.x" :y="thumb.y" :width="THUMB.width" :height="THUMB.height"
        class="cover-fill accent halo" />
      <rect :x="thumb.x" :y="thumb.y" :width="THUMB.width" :height="THUMB.height" class="cover-line muted frame" />
      <g :transform="`translate(${thumb.x + THUMB.width / 2} ${thumb.y + 27}) scale(${THUMB.scale})`" class="face">
        <ellipse :rx="thumb.face.headWidth" :ry="thumb.face.headHeight" class="cover-line" />
        <template v-for="eyeX in facePaths(thumb.face).eyes" :key="eyeX">
          <circle :cx="eyeX" cy="-8" r="3.5" class="cover-line" />
          <circle v-if="thumb.face.glasses" :cx="eyeX" cy="-8" r="9" class="cover-line" />
        </template>
        <path v-if="thumb.face.glasses" :d="`M${-thumb.face.eyeGap + 9} -8 H${thumb.face.eyeGap - 9}`" class="cover-line" />
        <path :d="facePaths(thumb.face).features" class="cover-line" />
        <path :d="facePaths(thumb.face).hair" class="cover-line" />
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

.active .query-face .cover-line {
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
 * Two steps: every gallery face flashes as it is scored, then the match is
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

.active .match .face .cover-line {
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
