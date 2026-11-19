<script setup lang="ts">
import { computed, onUnmounted, ref, toRef, watch } from "vue";
import { useLiveTicker } from "../../composables/useLiveTicker";
import { easeOut, prefersReducedMotion, tween } from "../../lib/motion";

/**
 * Why the learned embedding matters: the model runs on aggregated features
 * only, on the self-supervised embedding only, and on both. The inputs in use
 * light up, and the ROC curve moves with them: the embedding alone already
 * beats the aggregates, and both together bow it furthest. Grey stands for the
 * aggregates and the accent for the embedding throughout, so the curves are
 * labelled in place rather than with a legend.
 */

interface Props {
  active: boolean;
}
const props = defineProps<Props>();

interface Condition {
  label: string;
  aggregates: boolean;
  embedding: boolean;
  /** Curve exponent: a smaller exponent bows the curve further up */
  exponent: number;
}

const CONDITIONS: Condition[] = [
  { label: "aggregated only", aggregates: true, embedding: false, exponent: 0.5 },
  { label: "embedding only", aggregates: false, embedding: true, exponent: 0.38 },
  { label: "both", aggregates: true, embedding: true, exponent: 0.27 },
];
const [AGGREGATED_ONLY] = CONDITIONS;

const STAGES = [
  { title: "features", centerX: 80 },
  { title: "model", centerX: 210 },
  { title: "roc", centerX: 331 },
];
const FEATURES = ["sessions_7d", "matches_30d", "level", "days_active", "last_seen"];
const FEATURE_ROW_Y = (index: number) => 64 + index * 16;
const FEATURE_BAR = { x: 82, width: 66 };
const DIMENSIONS = 16;
const CELL = { y: 160, width: 7, height: 14, pitch: 8.5 };
const MODEL = { x: 172, y: 58, width: 76, height: 116 };
const MODEL_COLUMNS = [191, 210, 229];
const MODEL_ROWS = [83, 105, 127, 149];
const MODEL_CENTER_Y = MODEL.y + MODEL.height / 2;
const ROC = { x: 272, y: 57, size: 118 };
const CURVE_TWEEN_MS = 800;
const TICK_MS = 700;
const TICKS_PER_CONDITION = 4;

const randomValues = (count: number) => Array.from({ length: count }, () => 0.2 + Math.random() * 0.8);

// Without motion the figure rests on both inputs, the strongest result
const conditionIndex = ref(prefersReducedMotion ? CONDITIONS.length - 1 : 0);
const condition = computed(() => CONDITIONS[conditionIndex.value]);
const features = ref(randomValues(FEATURES.length));
const embedding = ref(randomValues(DIMENSIONS));
const curveExponent = ref(condition.value.exponent);
let ticks = 0;
let cancelTween = () => {};

useLiveTicker(
  toRef(props, "active"),
  () => {
    ticks++;
    // Only the inputs in use keep changing
    if (condition.value.aggregates) {
      features.value = features.value.map((value) => Math.min(Math.max(value + (Math.random() - 0.5) * 0.12, 0.1), 1));
    }
    if (condition.value.embedding) embedding.value = randomValues(DIMENSIONS);
    if (ticks % TICKS_PER_CONDITION === 0) conditionIndex.value = (conditionIndex.value + 1) % CONDITIONS.length;
  },
  TICK_MS,
);

// The curve eases between its shapes; polyline points can't be transitioned with CSS
watch(condition, ({ exponent: to }) => {
  cancelTween();
  const from = curveExponent.value;
  cancelTween = tween(CURVE_TWEEN_MS, (t) => {
    curveExponent.value = from + (to - from) * easeOut(t);
  });
});
onUnmounted(() => cancelTween());

/** Samples cluster near the origin, where the curve is steepest */
const curvePoints = (exponent: number) =>
  Array.from({ length: 41 }, (_, i) => {
    const fpr = (i / 40) ** 2;
    return [ROC.x + fpr * ROC.size, ROC.y + ROC.size - fpr ** exponent * ROC.size] as const;
  });

const toPolyline = (points: readonly (readonly [number, number])[]) => points.map(([x, y]) => `${x},${y}`).join(" ");

const baselineCurve = toPolyline(curvePoints(AGGREGATED_ONLY.exponent));
const curve = computed(() => toPolyline(curvePoints(curveExponent.value)));
/** The area between the current curve and the aggregates alone: what the embedding adds */
const gainArea = computed(
  () => `${curve.value} ${toPolyline([...curvePoints(AGGREGATED_ONLY.exponent)].reverse())}`,
);
</script>

<template>
  <svg class="cover" aria-hidden="true" viewBox="0 0 400 220" :class="{
    active: props.active,
    'aggregates-on': condition.aggregates,
    'embedding-on': condition.embedding,
  }">
    <!-- Shifted so the figure sits centered in its frame -->
    <g transform="translate(0 10)">
    <text v-for="stage in STAGES" :key="stage.title" :x="stage.centerX" y="30" text-anchor="middle"
      class="cover-text label">{{ stage.title }}</text>

    <!-- Aggregated features: a few named, hand-crafted summaries -->
    <g class="aggregates">
      <text x="12" y="50" class="cover-text label input-label">aggregated</text>
      <g v-for="(name, index) in FEATURES" :key="name">
        <text x="12" :y="FEATURE_ROW_Y(index) + 3" class="cover-text feature-name">{{ name }}</text>
        <rect :x="FEATURE_BAR.x" :y="FEATURE_ROW_Y(index) - 2.5" :width="FEATURE_BAR.width" height="6" class="track" />
        <rect :x="FEATURE_BAR.x" :y="FEATURE_ROW_Y(index) - 2.5" :width="FEATURE_BAR.width * features[index]"
          height="6" class="feature-bar" />
      </g>
    </g>

    <!-- The learned embedding: dense, one cell per dimension -->
    <g class="embedding">
      <text x="12" y="152" class="cover-text label input-label">learned embedding</text>
      <rect v-for="(value, index) in embedding" :key="index" :x="12 + index * CELL.pitch" :y="CELL.y"
        :width="CELL.width" :height="CELL.height" class="cell" :style="{ fillOpacity: 0.15 + value * 0.75 }" />
    </g>

    <!-- Each link flows only while it carries something; the output always does -->
    <path :d="`M152 ${FEATURE_ROW_Y(2)} H${MODEL.x}`" class="cover-line link aggregates-link" />
    <path :d="`M152 ${CELL.y + CELL.height / 2} H162 V${MODEL_ROWS[2] + 9} H${MODEL.x}`"
      class="cover-line link embedding-link" />

    <!-- Model: a small network the inputs feed -->
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

    <path :d="`M${MODEL.x + MODEL.width} ${MODEL_CENTER_Y} H${ROC.x - 2}`" class="cover-line link output-link" />

    <!-- ROC: chance diagonal, the aggregates alone for reference, and the current curve, labelled in place -->
    <rect :x="ROC.x" :y="ROC.y" :width="ROC.size" :height="ROC.size" class="cover-line muted" />
    <line :x1="ROC.x" :y1="ROC.y + ROC.size" :x2="ROC.x + ROC.size" :y2="ROC.y" class="cover-line muted chance" />
    <polygon :points="gainArea" class="gain" />
    <polyline :points="baselineCurve" class="cover-line baseline" />
    <polyline :points="curve" class="cover-line curve" />
    <text :key="condition.label" :x="ROC.x + ROC.size - 6" :y="ROC.y + ROC.size - 7" text-anchor="end"
      class="cover-text condition">{{ condition.label }}</text>
    </g>
  </svg>
</template>

<style scoped>
/*
 * Each input has its own color while in use and turns grey when it isn't:
 * amber for the aggregates, blue for the embedding. The model and the curve
 * take the color of what feeds them, and pink when both do.
 */
.cover {
  --aggregates-color: var(--warning-400);
  --embedding-color: var(--primary-400);
  --both-color: var(--accent-400);
  --off-color: var(--neutral-600);
  --state-color: var(--aggregates-color);
}

.embedding-on {
  --state-color: var(--embedding-color);
}

.aggregates-on.embedding-on {
  --state-color: var(--both-color);
}

.feature-name {
  font-size: 7.5px;
  fill: var(--neutral-500);
}

/* A step more contrast on phones, like the labels (see cover.css) */
@media (width < 40rem), (height < 30rem) {
  .feature-name {
    fill: var(--neutral-400);
  }
}

.track {
  fill: var(--neutral-800);
}

.feature-bar {
  fill: var(--off-color);
  transition: width 0.6s ease, fill 0.4s ease;
}

.aggregates-on .feature-bar {
  fill: var(--aggregates-color);
}

.cell {
  fill: var(--off-color);
  transition: fill-opacity 0.5s ease, fill 0.4s ease;
}

.embedding-on .cell {
  fill: var(--embedding-color);
}

/* An input not in use also recedes, label and all */
.aggregates,
.embedding {
  opacity: 0.4;
  transition: opacity 0.5s ease;
}

.aggregates-on .aggregates,
.embedding-on .embedding {
  opacity: 1;
}

.input-label {
  transition: fill 0.4s ease;
}

.aggregates-on .aggregates .input-label {
  fill: var(--aggregates-color);
}

.embedding-on .embedding .input-label {
  fill: var(--embedding-color);
}

.link {
  stroke: var(--cover-muted);
  stroke-dasharray: 3 4;
  transition: stroke 0.4s ease;
}

.cover.active.aggregates-on .aggregates-link {
  stroke: var(--aggregates-color);
  animation: cover-flow 0.8s linear infinite;
}

.cover.active.embedding-on .embedding-link {
  stroke: var(--embedding-color);
  animation: cover-flow 0.8s linear infinite;
}

/* The model's output, in the color of the model and the curve it feeds */
.output-link {
  stroke: var(--state-color);
}

.cover.active .output-link {
  animation: cover-flow 0.8s linear infinite;
}

.model {
  fill: var(--state-color);
  fill-opacity: 0.05;
  stroke: var(--state-color);
  transition: stroke 0.4s ease, fill 0.4s ease;
}

.node {
  fill: var(--state-color);
  transition: fill 0.4s ease;
}

.chance {
  stroke-dasharray: 2 3;
}

/* The aggregates alone, kept for reference */
.baseline {
  stroke: var(--neutral-500);
  stroke-dasharray: 3 2;
}

.curve {
  stroke: var(--state-color);
  stroke-width: 1.5;
  transition: stroke 0.4s ease;
}

/* The gain over the aggregates alone */
.gain {
  fill: var(--state-color);
  fill-opacity: 0.16;
  transition: fill 0.4s ease;
}

/* Names the curve, in the corner below the chance line that a curve never reaches */
.condition {
  font-size: 8px;
  fill: var(--state-color);
  animation: reveal 0.4s ease;
}

@keyframes reveal {
  from {
    opacity: 0;
  }
}
</style>
