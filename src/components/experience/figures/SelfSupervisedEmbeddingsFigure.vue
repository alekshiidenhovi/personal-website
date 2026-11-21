<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import { useLiveTicker } from '../../../composables/useLiveTicker';
import { clamp, interpolate, type Vector } from '../../../lib/math';
import { easeOut, prefersReducedMotion, tween } from '../../../lib/motion';
import { formatPoints } from '../../../lib/svg';

/**
 * Why the learned embedding matters: the model runs on aggregated features only, on the self-supervised embedding
 * only, and on both. The inputs in use light up, and the ROC curve moves with them: the embedding alone already
 * beats the aggregates, and both together bow it furthest. Each input keeps its color throughout, so the curves
 * are labelled in place rather than with a legend.
 */
interface Props {
  /** Whether the figure is in view, so it plays. */
  active: boolean;
}
const props = defineProps<Props>();

/** The inputs the model runs on, and the ROC curve it reaches with them. */
interface Condition {
  readonly label: string;
  readonly usesAggregates: boolean;
  readonly usesEmbedding: boolean;
  /** The ROC curve's exponent; a smaller one bows the curve further up. */
  readonly curveExponent: number;
}

const CONDITIONS: readonly Condition[] = [
  { label: 'aggregated only', usesAggregates: true, usesEmbedding: false, curveExponent: 0.5 },
  { label: 'embedding only', usesAggregates: false, usesEmbedding: true, curveExponent: 0.38 },
  { label: 'both', usesAggregates: true, usesEmbedding: true, curveExponent: 0.27 },
];
const [AGGREGATES_ONLY] = CONDITIONS;

const STAGES = [
  { title: 'features', centerX: 80 },
  { title: 'model', centerX: 210 },
  { title: 'roc', centerX: 331 },
];
const FEATURE_NAMES = ['sessions_7d', 'matches_30d', 'level', 'days_active', 'last_seen'];
const FEATURE_BAR = { x: 82, width: 66 };
const EMBEDDING_DIMENSIONS = 16;
const EMBEDDING_CELL = { y: 160, width: 7, height: 14, pitch: 8.5 };
const MODEL = { x: 172, y: 58, width: 76, height: 116 };
const MODEL_COLUMNS_X = [191, 210, 229];
const MODEL_ROWS_Y = [83, 105, 127, 149];
const MODEL_CENTER_Y = MODEL.y + MODEL.height / 2;
const ROC = { x: 272, y: 57, size: 118 };
const CURVE_SAMPLE_COUNT = 41;
const CURVE_TWEEN_MS = 800;
const TICK_MS = 700;
const TICKS_PER_CONDITION = 4;
/** How far an aggregated feature can move in a tick. */
const FEATURE_JITTER = 0.12;

/**
 * Gets the vertical center of an aggregated feature's row.
 *
 * @param index The feature's index.
 * @returns The row's y coordinate.
 */
function getFeatureRowY(index: number): number {
  return 64 + index * 16;
}

/**
 * Creates random input values, never so small that a bar or cell disappears.
 *
 * @param count How many values to create.
 * @returns The values, from 0.2 to 1.
 */
function createRandomValues(count: number): number[] {
  return Array.from({ length: count }, () => 0.2 + Math.random() * 0.8);
}

/**
 * Moves an aggregated feature's value a little, as live data would.
 *
 * @param value The current value.
 * @returns The new value, from 0.1 to 1.
 */
function jitterFeature(value: number): number {
  return clamp(value + (Math.random() - 0.5) * FEATURE_JITTER, 0.1, 1);
}

/**
 * Samples an ROC curve, most densely near the origin, where it is steepest.
 *
 * @param exponent The curve's exponent.
 * @returns The curve's points, in the figure's coordinates.
 */
function getCurvePoints(exponent: number): Vector[] {
  return Array.from({ length: CURVE_SAMPLE_COUNT }, (_, index) => {
    const falsePositiveRate = (index / (CURVE_SAMPLE_COUNT - 1)) ** 2;
    const truePositiveRate = falsePositiveRate ** exponent;
    return [ROC.x + falsePositiveRate * ROC.size, ROC.y + ROC.size - truePositiveRate * ROC.size];
  });
}

const BASELINE_POINTS = getCurvePoints(AGGREGATES_ONLY.curveExponent);
const BASELINE_CURVE = formatPoints(BASELINE_POINTS);
const REVERSED_BASELINE_CURVE = formatPoints([...BASELINE_POINTS].reverse());

// Without motion the figure rests on both inputs, the strongest result
const conditionIndex = ref(prefersReducedMotion ? CONDITIONS.length - 1 : 0);
const condition = computed(() => CONDITIONS[conditionIndex.value]);
const featureValues = ref(createRandomValues(FEATURE_NAMES.length));
const embeddingValues = ref(createRandomValues(EMBEDDING_DIMENSIONS));
const curveExponent = ref(condition.value.curveExponent);
let tickCount = 0;
let cancelCurveTween: (() => void) | undefined;

const curve = computed(() => formatPoints(getCurvePoints(curveExponent.value)));
/** The area between the current curve and the aggregates' alone: what the embedding adds. */
const gainArea = computed(() => `${curve.value} ${REVERSED_BASELINE_CURVE}`);

/** Changes the inputs in use, and moves on to the next condition every few ticks. */
function advance() {
  tickCount++;
  if (condition.value.usesAggregates) {
    featureValues.value = featureValues.value.map((value) => jitterFeature(value));
  }
  if (condition.value.usesEmbedding) {
    embeddingValues.value = createRandomValues(EMBEDDING_DIMENSIONS);
  }
  if (tickCount % TICKS_PER_CONDITION === 0) {
    conditionIndex.value = (conditionIndex.value + 1) % CONDITIONS.length;
  }
}

/**
 * Eases the curve into a condition's shape. Polyline points can't be transitioned with CSS.
 *
 * @param targetExponent The exponent of the curve to ease into.
 */
function tweenCurveTo(targetExponent: number) {
  cancelCurveTween?.();
  const startExponent = curveExponent.value;
  cancelCurveTween = tween(CURVE_TWEEN_MS, (progress) => {
    curveExponent.value = interpolate(startExponent, targetExponent, easeOut(progress));
  });
}

useLiveTicker(() => props.active, advance, TICK_MS);
watch(condition, (nextCondition) => tweenCurveTo(nextCondition.curveExponent));
onUnmounted(() => cancelCurveTween?.());
</script>

<template>
  <svg class="drawing" aria-hidden="true" viewBox="0 0 400 220" :class="{
    active: props.active,
    'uses-aggregates': condition.usesAggregates,
    'uses-embedding': condition.usesEmbedding,
  }">
    <!-- Shifted so the drawing sits centered in its frame -->
    <g transform="translate(0 10)">
      <text v-for="stage in STAGES" :key="stage.title" :x="stage.centerX" y="30" text-anchor="middle"
        class="drawing-text label">{{ stage.title }}</text>

      <!-- Aggregated features: a few named, hand-crafted summaries -->
      <g class="aggregates">
        <text x="12" y="50" class="drawing-text label input-label">aggregated</text>
        <g v-for="(name, index) in FEATURE_NAMES" :key="name">
          <text x="12" :y="getFeatureRowY(index) + 3" class="drawing-text feature-name">{{ name }}</text>
          <rect :x="FEATURE_BAR.x" :y="getFeatureRowY(index) - 2.5" :width="FEATURE_BAR.width" height="6"
            class="track" />
          <rect :x="FEATURE_BAR.x" :y="getFeatureRowY(index) - 2.5" :width="FEATURE_BAR.width * featureValues[index]"
            height="6" class="feature-bar" />
        </g>
      </g>

      <!-- The learned embedding: dense, one cell per dimension -->
      <g class="embedding">
        <text x="12" y="152" class="drawing-text label input-label">learned embedding</text>
        <rect v-for="(value, index) in embeddingValues" :key="index" :x="12 + index * EMBEDDING_CELL.pitch"
          :y="EMBEDDING_CELL.y" :width="EMBEDDING_CELL.width" :height="EMBEDDING_CELL.height" class="cell"
          :style="{ fillOpacity: 0.15 + value * 0.75 }" />
      </g>

      <!-- Each link flows only while it carries something; the output always does -->
      <path :d="`M152 ${getFeatureRowY(2)} H${MODEL.x}`" class="drawing-line link aggregates-link" />
      <path :d="`M152 ${EMBEDDING_CELL.y + EMBEDDING_CELL.height / 2} H162 V${MODEL_ROWS_Y[2] + 9} H${MODEL.x}`"
        class="drawing-line link embedding-link" />

      <!-- Model: a small network the inputs feed -->
      <rect :x="MODEL.x" :y="MODEL.y" :width="MODEL.width" :height="MODEL.height" rx="3" class="drawing-line model" />
      <template v-for="(x, column) in MODEL_COLUMNS_X.slice(0, -1)" :key="x">
        <template v-for="fromY in MODEL_ROWS_Y" :key="fromY">
          <line v-for="toY in MODEL_ROWS_Y" :key="toY" :x1="x" :y1="fromY" :x2="MODEL_COLUMNS_X[column + 1]" :y2="toY"
            class="drawing-line muted" />
        </template>
      </template>
      <template v-for="x in MODEL_COLUMNS_X" :key="x">
        <circle v-for="y in MODEL_ROWS_Y" :key="y" :cx="x" :cy="y" r="2.5" class="node" />
      </template>

      <path :d="`M${MODEL.x + MODEL.width} ${MODEL_CENTER_Y} H${ROC.x - 2}`" class="drawing-line link output-link" />

      <!-- ROC: the chance diagonal, the aggregates alone for reference, and the current curve, labelled in place -->
      <rect :x="ROC.x" :y="ROC.y" :width="ROC.size" :height="ROC.size" class="drawing-line muted" />
      <line :x1="ROC.x" :y1="ROC.y + ROC.size" :x2="ROC.x + ROC.size" :y2="ROC.y" class="drawing-line muted chance" />
      <polygon :points="gainArea" class="gain" />
      <polyline :points="BASELINE_CURVE" class="drawing-line baseline" />
      <polyline :points="curve" class="drawing-line curve" />
      <!-- Keyed by the condition, so each new label fades in -->
      <text :key="condition.label" :x="ROC.x + ROC.size - 6" :y="ROC.y + ROC.size - 7" text-anchor="end"
        class="drawing-text condition">{{ condition.label }}</text>
    </g>
  </svg>
</template>

<style scoped>
@import "../../../styles/media.css";

/*
 * Each input has its own color while in use and turns grey when it isn't: amber for the aggregates, blue for the
 * embedding. The model and the curve take the color of what feeds them, and pink when both do.
 */
.drawing {
  --aggregates-color: var(--warning-400);
  --embedding-color: var(--primary-400);
  --both-color: var(--accent-400);
  --off-color: var(--neutral-600);
  --state-color: var(--aggregates-color);
}

.uses-embedding {
  --state-color: var(--embedding-color);
}

.uses-aggregates.uses-embedding {
  --state-color: var(--both-color);
}

.feature-name {
  font-size: 7.5px;
  fill: var(--neutral-500);
}

/* A step more contrast on phones, like the labels (see styles/drawing.css) */
@media (--phone) {
  .feature-name {
    fill: var(--neutral-400);
  }
}

.track {
  fill: var(--neutral-800);
}

.feature-bar {
  fill: var(--off-color);
  transition:
    width 0.6s ease,
    fill 0.4s ease;
}

.uses-aggregates .feature-bar {
  fill: var(--aggregates-color);
}

.cell {
  fill: var(--off-color);
  transition:
    fill-opacity 0.5s ease,
    fill 0.4s ease;
}

.uses-embedding .cell {
  fill: var(--embedding-color);
}

/* An input not in use also recedes, label and all */
.aggregates,
.embedding {
  opacity: 0.4;
  transition: opacity 0.5s ease;
}

.uses-aggregates .aggregates,
.uses-embedding .embedding {
  opacity: 1;
}

.input-label {
  transition: fill 0.4s ease;
}

.uses-aggregates .aggregates .input-label {
  fill: var(--aggregates-color);
}

.uses-embedding .embedding .input-label {
  fill: var(--embedding-color);
}

.link {
  stroke: var(--drawing-muted);
  stroke-dasharray: 3 4;
  transition: stroke 0.4s ease;
}

.drawing.active.uses-aggregates .aggregates-link {
  stroke: var(--aggregates-color);
  animation: drawing-flow 0.8s linear infinite;
}

.drawing.active.uses-embedding .embedding-link {
  stroke: var(--embedding-color);
  animation: drawing-flow 0.8s linear infinite;
}

/* The model's output, in the color of the model and the curve it feeds */
.output-link {
  stroke: var(--state-color);
}

.drawing.active .output-link {
  animation: drawing-flow 0.8s linear infinite;
}

.model {
  fill: var(--state-color);
  fill-opacity: 0.05;
  stroke: var(--state-color);
  transition:
    stroke 0.4s ease,
    fill 0.4s ease;
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

/* Names the curve, in the corner below the chance line, which a curve never reaches */
.condition {
  font-size: 8px;
  fill: var(--state-color);
  animation: fade-in 0.4s ease;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
}
</style>
