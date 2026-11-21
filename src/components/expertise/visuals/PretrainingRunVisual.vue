<script setup lang="ts">
import { computed, ref, shallowRef, useTemplateRef } from 'vue';
import { type AnimationFrame, useAnimationFrame } from '../../../composables/useAnimationFrame';
import { clamp } from '../../../lib/math';
import { prefersReducedMotion } from '../../../lib/motion';
import StatusBadge from '../StatusBadge.vue';
import {
  createRunNoise,
  drawLossCurve,
  formatStep,
  getInvarianceLoss,
  getInvarianceY,
  getSigregLoss,
  getSigregY,
  INVARIANCE_MAX,
  SIGREG_MAX,
  sampleEmbeddings,
  sampleViewPairs,
  shapeCloud,
} from './pretrainingRunModel';

/**
 * A self-supervised pretraining run (see pretrainingRunModel) beside the embeddings it trains. The run draws
 * continuously and loops; hovering the charts scrubs through it.
 */
interface Props {
  /** Whether the visual is in view, so it plays. */
  active: boolean;
}
const props = defineProps<Props>();

type RunStatus = 'training' | 'done' | 'paused' | 'ready';

const RUN_MS = 10_000;
const PAUSE_MS = 2_500;
const STATUS_TONES = { training: 'active', done: 'success', paused: 'idle', ready: 'idle' } as const;
const EMBEDDINGS = sampleEmbeddings();
const VIEW_PAIRS = sampleViewPairs();

const chartsRef = useTemplateRef<HTMLElement>('charts');
/** How far the run has drawn; without motion it is shown finished. */
const progress = ref(prefersReducedMotion ? 1 : 0);
const hoveredProgress = ref<number>();
const noise = shallowRef(createRunNoise());
let pausedMs = 0;

/** The point in the run shown by the cloud, the step and the dots: where the pointer is, or else the run's end. */
const shownProgress = computed(() => hoveredProgress.value ?? progress.value);
const invarianceCurve = computed(() =>
  drawLossCurve((at) => getInvarianceY(getInvarianceLoss(noise.value.invariance.raw, at))),
);
const sigregCurve = computed(() => drawLossCurve((at) => getSigregY(getSigregLoss(noise.value.sigreg.raw, at))));
const invarianceDotY = computed(() =>
  getInvarianceY(getInvarianceLoss(noise.value.invariance.smooth, shownProgress.value)),
);
const sigregDotY = computed(() => getSigregY(getSigregLoss(noise.value.sigreg.smooth, shownProgress.value)));
const cloud = computed(() => shapeCloud(EMBEDDINGS, VIEW_PAIRS, shownProgress.value));
/** Hides the curves past the run's progress. */
const revealStyle = computed(() => ({ clipPath: `inset(-10% ${100 - progress.value * 100}% -10% 0)` }));

const status = computed<RunStatus>(() => {
  if (progress.value === 1) {
    return 'done';
  }
  if (props.active) {
    return 'training';
  }
  return progress.value > 0 ? 'paused' : 'ready';
});

/**
 * Draws the run on by a frame, and after a pause at its end starts a new run with fresh noise.
 *
 * @param frame The frame's timing.
 */
function advanceRun({ deltaMs }: AnimationFrame) {
  if (progress.value < 1) {
    progress.value = Math.min(progress.value + deltaMs / RUN_MS, 1);
    return;
  }
  pausedMs += deltaMs;
  if (pausedMs >= PAUSE_MS) {
    pausedMs = 0;
    progress.value = 0;
    noise.value = createRunNoise();
  }
}

/**
 * Scrubs to the point in the run under the pointer, up to how far the run has drawn.
 *
 * @param event The pointer move.
 */
function scrubToPointer(event: PointerEvent) {
  if (!chartsRef.value || progress.value === 0) {
    return;
  }
  const { left, width } = chartsRef.value.getBoundingClientRect();
  hoveredProgress.value = clamp((event.clientX - left) / width, 0, progress.value);
}

useAnimationFrame(() => props.active, advanceRun);
</script>

<template>
  <div class="visual">
    <div class="header">
      <StatusBadge :label="status" :tone="STATUS_TONES[status]" color="primary" />
      <span>step <span class="step">{{ formatStep(shownProgress) }}</span></span>
    </div>

    <div class="body">
      <!-- What the losses act on: the embeddings, in two dimensions -->
      <div class="embedding-plot">
        <span class="panel-label">player embeddings</span>
        <svg viewBox="-3.2 -3.2 6.4 6.4" aria-hidden="true">
          <circle r="2" class="target" />
          <circle v-for="([x, y], index) in cloud.points" :key="index" :cx="x" :cy="y" r="0.05" class="embedding" />
          <g v-for="([[x1, y1], [x2, y2]], index) in cloud.pairs" :key="`pair-${index}`">
            <line :x1="x1" :y1="y1" :x2="x2" :y2="y2" class="pair-link" />
            <circle :cx="x1" :cy="y1" r="0.085" class="pair-point" />
            <circle :cx="x2" :cy="y2" r="0.085" class="pair-point" />
          </g>
        </svg>
      </div>
      <div class="legend">
        <span class="legend-item"><span class="legend-pair"></span>one player, two event
          windows&nbsp;→&nbsp;pulled&nbsp;together</span>
        <span class="legend-item"><span class="legend-target"></span>target
          distribution&nbsp;→&nbsp;spread&nbsp;out&nbsp;to&nbsp;fill</span>
      </div>

      <!-- Two panels sharing the step axis, as in the thesis figures -->
      <div ref="charts" class="charts" @pointermove="scrubToPointer" @pointerleave="hoveredProgress = undefined">
        <div class="chart">
          <span class="panel-label">invariance loss</span>
          <span class="axis-label axis-top">{{ INVARIANCE_MAX.toFixed(1) }}</span>
          <span class="axis-label axis-bottom">0.0</span>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" :style="revealStyle">
            <polyline :points="invarianceCurve" class="line invariance-line" />
          </svg>
          <span class="dot invariance-dot" :style="{ left: `${shownProgress * 100}%`, top: `${invarianceDotY}%` }"></span>
        </div>
        <div class="chart">
          <span class="panel-label">SIGReg loss</span>
          <span class="axis-label axis-top">{{ SIGREG_MAX }}</span>
          <span class="axis-label axis-bottom">0</span>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" :style="revealStyle">
            <polyline :points="sigregCurve" class="line sigreg-line" />
          </svg>
          <span class="dot sigreg-dot" :style="{ left: `${shownProgress * 100}%`, top: `${sigregDotY}%` }"></span>
        </div>
        <span v-if="hoveredProgress !== undefined" class="crosshair" :style="{ left: `${shownProgress * 100}%` }"></span>
      </div>
      <span class="axis-x">steps →</span>
    </div>
  </div>
</template>

<style scoped>
@import "../../../styles/media.css";

.visual {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-self: stretch;
  width: 100%;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--text-muted);
}

.header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.5rem 1rem;
}

.step {
  font-variant-numeric: tabular-nums;
  color: var(--neutral-100);
}

/* The embeddings beside the curves, sharing their top and bottom edges; the captions in the row below */
.body {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
  grid-template-areas:
    "plot charts"
    "legend axis";
  gap: 0.5rem 1rem;
  flex-grow: 1;
}

/* Square, and capped by the screen's height too, so short laptop windows still fit the slide */
.embedding-plot {
  grid-area: plot;
  position: relative;
  width: min(100%, 31svh);
  aspect-ratio: 1;
  border: 1px solid var(--neutral-800);
}

/* In the SIGReg curve's color, as that loss pulls the cloud to it; the pairs share the invariance curve's blue */
.target {
  fill: none;
  stroke: var(--neutral-200);
  stroke-width: 1;
  stroke-dasharray: 3 4;
  vector-effect: non-scaling-stroke;
}

.embedding {
  fill: var(--neutral-400);
  opacity: 0.6;
}

.pair-link {
  stroke: var(--primary-400);
  stroke-width: 1;
  opacity: 0.6;
  vector-effect: non-scaling-stroke;
}

.pair-point {
  fill: var(--primary-400);
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 1rem;
  font-size: 0.625rem;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
}

/* Two dots joined by a line, as drawn in the plot */
.legend-pair {
  width: 1rem;
  height: 0.375rem;
  background:
    radial-gradient(circle, var(--primary-400) 0.1875rem, transparent 0.1875rem) left / 0.375rem 0.375rem no-repeat,
    radial-gradient(circle, var(--primary-400) 0.1875rem, transparent 0.1875rem) right / 0.375rem 0.375rem no-repeat,
    linear-gradient(var(--primary-400), var(--primary-400)) center / 100% 1px no-repeat;
}

.legend-target {
  width: 1rem;
  border-top: 1px dashed var(--neutral-200);
}

.charts {
  grid-area: charts;
  position: relative;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  gap: 0.5rem;
  min-height: clamp(9rem, 24svh, 17rem);
  cursor: crosshair;
  touch-action: none;
}

.chart {
  position: relative;
  flex: 1;
  border-left: 1px solid var(--neutral-700);
  border-bottom: 1px solid var(--neutral-700);
  background-image: linear-gradient(color-mix(in srgb, var(--neutral-700), transparent 60%) 1px, transparent 1px);
  background-size: 100% 25%;
}

svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.embedding-plot svg {
  overflow: hidden;
}

.line {
  fill: none;
  stroke-width: 1.5;
  vector-effect: non-scaling-stroke;
  stroke-linejoin: round;
}

.invariance-line {
  stroke: var(--primary-400);
}

.sigreg-line {
  stroke: var(--neutral-200);
}

.panel-label {
  position: absolute;
  top: 0.25rem;
  right: 0.375rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 0.625rem;
}

.axis-label {
  position: absolute;
  left: 0.375rem;
  font-size: 0.625rem;
}

.axis-top {
  top: 0.25rem;
}

.axis-bottom {
  bottom: 0.25rem;
}

.axis-x {
  justify-self: end;
}

.crosshair {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background-color: var(--neutral-500);
  pointer-events: none;
}

.dot {
  position: absolute;
  width: 0.5625rem;
  height: 0.5625rem;
  border-radius: 50%;
  border: 2px solid var(--neutral-900);
  translate: -50% -50%;
  pointer-events: none;
}

.invariance-dot {
  background-color: var(--primary-400);
  box-shadow: 0 0 0.75rem var(--primary-400);
}

.sigreg-dot {
  background-color: var(--neutral-200);
}

/* Beside the curves, the legend runs on under them too, sharing its row with the steps caption at the far end */
.legend {
  grid-row: 2;
  grid-column: 1 / -1;
}

.axis-x {
  grid-row: 2;
  grid-column: 2;
}

/* Narrow screens stack the plot above the curves, each caption below its own part */
@media (--below-sm) {
  .body {
    grid-template-columns: 1fr;
    grid-template-areas: "plot" "legend" "charts" "axis";
  }

  .legend {
    grid-area: legend;
  }

  .axis-x {
    grid-area: axis;
  }

  .embedding-plot {
    max-width: 16rem;
  }
}
</style>
