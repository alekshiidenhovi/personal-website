<script setup lang="ts">
import { computed, onUnmounted, ref, toRef, watch } from "vue";
import { useLiveTicker } from "../../composables/useLiveTicker";

/**
 * Why the learned embedding matters: a model first runs on hand-crafted
 * features alone, then the self-supervised embedding is added alongside them
 * and its ROC curve bows upward. The gain over features alone is shaded, and
 * the loop switches the embedding on and off.
 */

interface Props {
  active: boolean;
}
const props = defineProps<Props>();

const STAGES = [
  { title: "features", centerX: 80 },
  { title: "model", centerX: 221 },
  { title: "roc", centerX: 336 },
];
const FEATURES = ["sessions_7d", "spend_30d", "level", "days_active", "last_seen"];
const FEATURE_ROW_Y = (index: number) => 50 + index * 13;
const FEATURE_BAR = { x: 82, width: 66 };
const DIMENSIONS = 16;
const MODEL = { x: 180, y: 56, width: 82, height: 94 };
const MODEL_COLUMNS = [199, 221, 243];
const MODEL_ROWS = [76, 94, 112, 130];
const ROC = { x: 290, y: 52, size: 92 };
/** Curve exponents: a smaller exponent bows the curve further up */
const CURVE_FEATURES_ONLY = 0.5;
const CURVE_WITH_EMBEDDING = 0.27;
const CURVE_TWEEN_MS = 800;
const TICK_MS = 700;
const TICKS_PER_TOGGLE = 4;

const randomValues = (count: number) => Array.from({ length: count }, () => 0.2 + Math.random() * 0.8);

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
// Without motion the figure rests on the embedding switched on
const isEmbeddingOn = ref(prefersReducedMotion);
const features = ref(randomValues(FEATURES.length));
const embedding = ref(randomValues(DIMENSIONS));
const curveExponent = ref(prefersReducedMotion ? CURVE_WITH_EMBEDDING : CURVE_FEATURES_ONLY);
let ticks = 0;
let frameId = 0;

useLiveTicker(
  toRef(props, "active"),
  () => {
    ticks++;
    features.value = features.value.map((value) => Math.min(Math.max(value + (Math.random() - 0.5) * 0.12, 0.1), 1));
    if (isEmbeddingOn.value) embedding.value = randomValues(DIMENSIONS);
    if (ticks % TICKS_PER_TOGGLE === 0) isEmbeddingOn.value = !isEmbeddingOn.value;
  },
  TICK_MS,
);

// The curve eases between its two shapes; polyline points can't be transitioned with CSS
watch(isEmbeddingOn, (isOn) => {
  cancelAnimationFrame(frameId);
  const from = curveExponent.value;
  const to = isOn ? CURVE_WITH_EMBEDDING : CURVE_FEATURES_ONLY;
  const start = performance.now();
  const step = (now: number) => {
    const t = Math.min((now - start) / CURVE_TWEEN_MS, 1);
    const eased = 1 - (1 - t) ** 3;
    curveExponent.value = from + (to - from) * eased;
    if (t < 1) frameId = requestAnimationFrame(step);
  };
  frameId = requestAnimationFrame(step);
});
onUnmounted(() => cancelAnimationFrame(frameId));

/** Samples cluster near the origin, where the curve is steepest */
const curvePoints = (exponent: number) =>
  Array.from({ length: 41 }, (_, i) => {
    const fpr = (i / 40) ** 2;
    return [ROC.x + fpr * ROC.size, ROC.y + ROC.size - fpr ** exponent * ROC.size] as const;
  });

const toPolyline = (points: readonly (readonly [number, number])[]) => points.map(([x, y]) => `${x},${y}`).join(" ");

const baselineCurve = toPolyline(curvePoints(CURVE_FEATURES_ONLY));
const curve = computed(() => toPolyline(curvePoints(curveExponent.value)));
/** The area between the current curve and features alone: what the embedding adds */
const gainArea = computed(
  () => `${curve.value} ${toPolyline([...curvePoints(CURVE_FEATURES_ONLY)].reverse())}`,
);

const status = computed(() => (isEmbeddingOn.value ? "+ learned embedding" : "hand-crafted features only"));
</script>

<template>
  <svg class="cover" :class="{ active: props.active, 'embedding-on': isEmbeddingOn }" viewBox="0 0 400 220"
    aria-hidden="true">
    <text v-for="stage in STAGES" :key="stage.title" :x="stage.centerX" y="24" text-anchor="middle"
      class="cover-text label">{{ stage.title }}</text>
    <text x="10" y="206" class="cover-text accent status">{{ status }}</text>

    <!-- Hand-crafted features: a few named aggregates -->
    <text x="12" y="40" class="cover-text label">hand-crafted</text>
    <g v-for="(name, index) in FEATURES" :key="name">
      <text x="12" :y="FEATURE_ROW_Y(index) + 3" class="cover-text feature-name">{{ name }}</text>
      <rect :x="FEATURE_BAR.x" :y="FEATURE_ROW_Y(index) - 2" :width="FEATURE_BAR.width" height="5" class="track" />
      <rect :x="FEATURE_BAR.x" :y="FEATURE_ROW_Y(index) - 2" :width="FEATURE_BAR.width * features[index]" height="5"
        class="feature-bar" />
    </g>

    <!-- The learned embedding: dense, and only lit while it feeds the model -->
    <g class="embedding">
      <text x="12" y="126" class="cover-text label embedding-label">learned embedding</text>
      <rect v-for="(value, index) in embedding" :key="index" :x="12 + index * 8.5" y="134" width="7" height="12"
        class="cell" :style="{ fillOpacity: 0.15 + value * 0.75 }" />
    </g>

    <path d="M152 76 H178" class="cover-line" />
    <path d="M152 140 H166 V118 H178" class="cover-line embedding-link" />

    <!-- Model: a small network both inputs feed -->
    <rect :x="MODEL.x" :y="MODEL.y" :width="MODEL.width" :height="MODEL.height" rx="3" class="cover-line model" />
    <template v-for="(x, column) in MODEL_COLUMNS.slice(0, -1)" :key="x">
      <template v-for="fromY in MODEL_ROWS" :key="fromY">
        <line v-for="toY in MODEL_ROWS" :key="toY" :x1="x" :y1="fromY" :x2="MODEL_COLUMNS[column + 1]" :y2="toY"
          class="cover-line muted synapse" />
      </template>
    </template>
    <template v-for="x in MODEL_COLUMNS" :key="x">
      <circle v-for="y in MODEL_ROWS" :key="y" :cx="x" :cy="y" r="2.5" class="node" />
    </template>

    <path :d="`M${MODEL.x + MODEL.width} 103 H${ROC.x - 2}`" class="cover-line" />

    <!-- ROC curve: chance diagonal, features alone, and the curve with the embedding -->
    <rect :x="ROC.x" :y="ROC.y" :width="ROC.size" :height="ROC.size" class="cover-line muted" />
    <line :x1="ROC.x" :y1="ROC.y + ROC.size" :x2="ROC.x + ROC.size" :y2="ROC.y" class="cover-line muted chance" />
    <polygon :points="gainArea" class="gain" />
    <polyline :points="baselineCurve" class="cover-line baseline" />
    <polyline :points="curve" class="cover-line curve" />

    <g class="legend">
      <line :x1="ROC.x" y1="160" :x2="ROC.x + 12" y2="160" class="cover-line baseline-key" />
      <text :x="ROC.x + 16" y="162" class="cover-text label">features only</text>
      <line :x1="ROC.x" y1="174" :x2="ROC.x + 12" y2="174" class="cover-line curve-key" />
      <text :x="ROC.x + 16" y="176" class="cover-text label">+ embedding</text>
    </g>
  </svg>
</template>

<style scoped>
.status {
  font-size: 8px;
}

.feature-name {
  font-size: 6.5px;
  fill: var(--neutral-500);
}

.track {
  fill: var(--neutral-800);
}

/* Hand-crafted features stay grey; the learned embedding carries the accent */
.feature-bar {
  fill: var(--neutral-500);
  transition: width 0.6s ease;
}

.cell {
  fill: var(--cover-accent);
  transition: fill-opacity 0.5s ease, opacity 0.5s ease;
}

.embedding .cell {
  opacity: 0.2;
}

.embedding-on .embedding .cell {
  opacity: 1;
}

.embedding-label {
  transition: fill 0.4s ease;
}

.embedding-on .embedding-label {
  fill: var(--cover-accent);
}

.embedding-link {
  stroke: var(--cover-muted);
  stroke-dasharray: 3 4;
}

.cover.active.embedding-on .embedding-link {
  stroke: var(--cover-accent);
  animation: cover-flow 0.8s linear infinite;
}

.model {
  fill: var(--card-color);
  fill-opacity: 0.04;
}

.node {
  fill: var(--neutral-600);
  transition: fill 0.4s ease;
}

.embedding-on .node {
  fill: var(--cover-accent);
}

.chance {
  stroke-dasharray: 2 3;
}

.baseline,
.baseline-key {
  stroke: var(--neutral-500);
  stroke-dasharray: 3 2;
}

.curve-key {
  stroke: var(--cover-accent);
  stroke-width: 1.5;
}

/* Grey like features alone until the embedding lifts it */
.curve {
  stroke: var(--neutral-400);
  stroke-width: 1.5;
  transition: stroke 0.4s ease;
}

.embedding-on .curve {
  stroke: var(--cover-accent);
}

.gain {
  fill: var(--cover-accent);
  fill-opacity: 0;
  transition: fill-opacity 0.6s ease;
}

.embedding-on .gain {
  fill-opacity: 0.16;
}
</style>
