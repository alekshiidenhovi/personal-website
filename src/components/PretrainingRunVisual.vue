<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue";
import { prefersReducedMotion } from "../lib/motion";
import StatusBadge from "./StatusBadge.vue";

/**
 * An illustrative self-supervised pretraining run, shaped like the thesis
 * runs, beside the embeddings it trains. The SIGReg loss drops fast as the
 * collapsed embedding cloud spreads into an isotropic Gaussian; the invariance
 * loss, the distance between two views of the same sequence, starts near zero
 * while everything sits together, spikes as the cloud spreads, then slowly
 * settles as the views are pulled back together. The run draws continuously
 * and loops; hover to scrub through it.
 */

/** A short run, so the rise fills much of the chart instead of a long plateau */
const TOTAL_STEPS = 10_000;
const INVARIANCE_START = 0.06;
const INVARIANCE_PEAK = 0.26;
const INVARIANCE_SETTLE = 0.16;
/** Share of the run spent rising to the invariance peak */
const INVARIANCE_PEAK_AT = 0.15;
/** How slowly the invariance loss settles after its peak */
const INVARIANCE_SETTLE_WIDTH = 0.375;
const SIGREG_FLOOR = 2.5;
const INVARIANCE_MAX = 0.3;
/** Starts a little below the top of its chart */
const SIGREG_START = 90;
const SIGREG_MAX = 100;
/** Relative size of the minibatch noise on each loss */
const INVARIANCE_NOISE = 0.04;
const SIGREG_NOISE = 0.035;
/** Noise values per run; the curve runs straight between them */
const NOISE_KNOTS = 260;
/** Knots on each side averaged into the path the moving dots follow, so they glide instead of shaking */
const DOT_SMOOTHING_RADIUS = 6;
const RUN_MS = 10_000;
const PAUSE_MS = 2_500;
/** Longest frame step, so the run doesn't leap ahead after the tab was in the background */
const MAX_FRAME_MS = 100;

const EMBEDDING_COUNT = 140;
const PAIR_COUNT = 6;
/** How far apart a pair's two views sit at the invariance peak, in standard deviations */
const PAIR_SPREAD = 1.2;
/** Spread of the collapsed cloud along its two axes at step 0, relative to the target Gaussian */
const COLLAPSED_SCALE = [0.3, 0.03] as const;
const COLLAPSED_ANGLE = Math.PI / 5;

const smoothstep = (x: number) => x * x * (3 - 2 * x);
const clamp01 = (x: number) => Math.min(Math.max(x, 0), 1);

const gaussian = () => Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());

/** Minibatch noise: independent values in [-1, 1], plus a moving average of them for the dots */
const makeNoise = () => {
  const raw = Array.from({ length: NOISE_KNOTS }, () => Math.random() * 2 - 1);
  const smooth = raw.map((_, i) => {
    const window = raw.slice(Math.max(i - DOT_SMOOTHING_RADIUS, 0), i + DOT_SMOOTHING_RADIUS + 1);
    return window.reduce((sum, value) => sum + value, 0) / window.length;
  });
  return { raw, smooth };
};

const noiseAt = (noise: number[], t: number) => {
  const position = t * (noise.length - 1);
  const i = Math.min(Math.floor(position), noise.length - 2);
  return noise[i] + (noise[i + 1] - noise[i]) * (position - i);
};

/** Smooth trend: eases up to the peak, then decays with a long tail */
const invarianceTrend = (t: number) =>
  t < INVARIANCE_PEAK_AT
    ? INVARIANCE_START + (INVARIANCE_PEAK - INVARIANCE_START) * smoothstep(t / INVARIANCE_PEAK_AT)
    : INVARIANCE_SETTLE +
      (INVARIANCE_PEAK - INVARIANCE_SETTLE) / (1 + ((t - INVARIANCE_PEAK_AT) / INVARIANCE_SETTLE_WIDTH) ** 2);

const sigregTrend = (t: number) =>
  SIGREG_FLOOR * (1 + 0.9 * Math.exp(-t / 0.75)) + (SIGREG_START - 1.9 * SIGREG_FLOOR) * Math.exp(-t / 0.09);

const SIGREG_LOG_DROP = Math.log(sigregTrend(0) / sigregTrend(1));

interface Props {
  /** Whether the visual is playing */
  active: boolean;
}
const props = defineProps<Props>();

const chartsRef = ref<HTMLElement | null>(null);
/** Share of the run drawn so far; without motion the run is shown finished */
const progress = ref(prefersReducedMotion ? 1 : 0);
const hoveredT = ref<number | null>(null);
// Each run gets fresh minibatch noise
const invarianceNoise = ref(makeNoise());
const sigregNoise = ref(makeNoise());

/** Loss with minibatch noise: the raw values draw the curves, the smoothed ones place the dots */
const invarianceLoss = (t: number, noise: "raw" | "smooth" = "raw") =>
  invarianceTrend(t) * (1 + INVARIANCE_NOISE * noiseAt(invarianceNoise.value[noise], t));
const sigregLoss = (t: number, noise: "raw" | "smooth" = "raw") =>
  sigregTrend(t) * (1 + SIGREG_NOISE * noiseAt(sigregNoise.value[noise], t));

/** Where each embedding sits once training has spread the cloud into the target Gaussian */
const embeddings = Array.from({ length: EMBEDDING_COUNT }, () => [gaussian(), gaussian()] as const);
/** Pairs: one input seen two ways, offset in opposite directions from a shared position */
const pairs = Array.from({ length: PAIR_COUNT }, () => {
  const angle = Math.random() * 2 * Math.PI;
  return { center: [gaussian() * 0.8, gaussian() * 0.8] as const, offset: [Math.cos(angle), Math.sin(angle)] as const };
});

let frameId = 0;
let pausedMs = 0;

const stop = () => {
  cancelAnimationFrame(frameId);
  frameId = 0;
};

watch(
  () => props.active,
  (active) => {
    stop();
    if (!active || prefersReducedMotion) return;
    let last = performance.now();
    const frame = (now: number) => {
      const elapsed = Math.min(now - last, MAX_FRAME_MS);
      last = now;
      if (progress.value < 1) {
        progress.value = Math.min(progress.value + elapsed / RUN_MS, 1);
      } else {
        pausedMs += elapsed;
        if (pausedMs >= PAUSE_MS) {
          pausedMs = 0;
          progress.value = 0;
          invarianceNoise.value = makeNoise();
          sigregNoise.value = makeNoise();
        }
      }
      frameId = requestAnimationFrame(frame);
    };
    frameId = requestAnimationFrame(frame);
  },
  { immediate: true },
);
onUnmounted(stop);

const toX = (t: number) => t * 100;
const toInvarianceY = (loss: number) => 100 - (Math.min(loss, INVARIANCE_MAX) / INVARIANCE_MAX) * 100;
const toSigregY = (loss: number) => 100 - (Math.min(loss, SIGREG_MAX) / SIGREG_MAX) * 100;

/** The whole run's curve through its noise knots; computed once per run and revealed as the run plays */
const toPoints = (loss: (t: number) => number, toY: (loss: number) => number) =>
  Array.from({ length: NOISE_KNOTS }, (_, i) => {
    const t = i / (NOISE_KNOTS - 1);
    return `${toX(t)},${toY(loss(t))}`;
  }).join(" ");

const invariancePoints = computed(() => toPoints(invarianceLoss, toInvarianceY));
const sigregPoints = computed(() => toPoints(sigregLoss, toSigregY));

const status = computed(() => {
  if (progress.value === 1) return "done";
  if (props.active) return "training";
  return progress.value ? "paused" : "ready";
});
const STATUS_TONE = { training: "active", done: "success", paused: "idle", ready: "idle" } as const;
const reveal = computed(() => ({ clipPath: `inset(-10% ${100 - toX(progress.value)}% -10% 0)` }));
const selectedT = computed(() => hoveredT.value ?? progress.value);
const formatStep = (t: number) => (Math.round((t * TOTAL_STEPS) / 100) * 100).toLocaleString("en-US");

/*
 * The embedding cloud at the selected step, following the loss trends without
 * their noise. A falling SIGReg loss stretches the collapsed, flattened cloud
 * out to the round target Gaussian, and the invariance loss sets how far apart
 * each pair's two views sit.
 */
const cloud = computed(() => {
  const t = selectedT.value;
  const spread = smoothstep(clamp01(Math.log(sigregTrend(0) / sigregTrend(t)) / SIGREG_LOG_DROP));
  const scaleU = COLLAPSED_SCALE[0] + (1 - COLLAPSED_SCALE[0]) * spread;
  const scaleV = COLLAPSED_SCALE[1] + (1 - COLLAPSED_SCALE[1]) * spread;
  const cos = Math.cos(COLLAPSED_ANGLE);
  const sin = Math.sin(COLLAPSED_ANGLE);
  const transform = (x: number, y: number) => {
    const u = (x * cos + y * sin) * scaleU;
    const v = (-x * sin + y * cos) * scaleV;
    return [u * cos - v * sin, u * sin + v * cos] as const;
  };
  // Squared so the spike and the settling read clearly; not scaled with the cloud, so the gap shows the loss itself
  const separation = (PAIR_SPREAD / 2) * (invarianceTrend(t) / INVARIANCE_PEAK) ** 2;
  return {
    points: embeddings.map(([x, y]) => transform(x, y)),
    pairs: pairs.map(({ center: [x, y], offset: [dx, dy] }) => {
      const [cx, cy] = transform(x, y);
      return [
        [cx + dx * separation, cy + dy * separation],
        [cx - dx * separation, cy - dy * separation],
      ];
    }),
  };
});

const onPointerMove = (event: PointerEvent) => {
  const rect = chartsRef.value?.getBoundingClientRect();
  if (!rect || !progress.value) return;
  const fraction = (event.clientX - rect.left) / rect.width;
  hoveredT.value = Math.min(Math.max(fraction, 0), progress.value);
};
</script>

<template>
  <div class="visual">
    <div class="header">
      <StatusBadge :label="status" :tone="STATUS_TONE[status]" color="primary" />
      <span>step <span class="step">{{ formatStep(selectedT) }}</span></span>
    </div>

    <div class="body">
      <!-- What the losses act on: the embeddings, in two dimensions -->
      <div class="embedding-plot">
          <span class="panel-label">embeddings</span>
          <svg viewBox="-3.2 -3.2 6.4 6.4" aria-hidden="true">
            <circle r="2" class="target" />
            <circle v-for="([x, y], index) in cloud.points" :key="index" :cx="x" :cy="y" r="0.05" class="embedding-point" />
            <g v-for="([[x1, y1], [x2, y2]], index) in cloud.pairs" :key="`pair-${index}`">
              <line :x1="x1" :y1="y1" :x2="x2" :y2="y2" class="pair-link" />
              <circle :cx="x1" :cy="y1" r="0.085" class="pair-point" />
              <circle :cx="x2" :cy="y2" r="0.085" class="pair-point" />
            </g>
          </svg>
      </div>
      <div class="legend">
        <span class="legend-item"><span class="legend-pair"></span>two views of one input</span>
        <span class="legend-item"><span class="legend-target"></span>target Gaussian</span>
      </div>

      <!-- Two panels sharing the step axis, as in the thesis figures -->
      <div ref="chartsRef" class="charts" @pointermove="onPointerMove" @pointerleave="hoveredT = null">
          <div class="chart">
            <span class="panel-label">invariance loss</span>
            <span class="axis-label axis-top">{{ INVARIANCE_MAX.toFixed(1) }}</span>
            <span class="axis-label axis-bottom">0.0</span>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" :style="reveal">
              <polyline :points="invariancePoints" class="line line-invariance" />
            </svg>
            <span class="point point-invariance"
              :style="{ left: `${toX(selectedT)}%`, top: `${toInvarianceY(invarianceLoss(selectedT, 'smooth'))}%` }"></span>
          </div>
          <div class="chart">
            <span class="panel-label">SIGReg loss</span>
            <span class="axis-label axis-top">{{ SIGREG_MAX }}</span>
            <span class="axis-label axis-bottom">0</span>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" :style="reveal">
              <polyline :points="sigregPoints" class="line line-sigreg" />
            </svg>
            <span class="point point-sigreg"
              :style="{ left: `${toX(selectedT)}%`, top: `${toSigregY(sigregLoss(selectedT, 'smooth'))}%` }"></span>
          </div>
          <span v-if="hoveredT !== null" class="crosshair" :style="{ left: `${toX(selectedT)}%` }"></span>
      </div>
      <span class="axis-x">steps →</span>
    </div>
  </div>
</template>

<style scoped>
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

/* Embeddings beside the curves, stacked on narrow screens */
/* Embeddings beside the curves, sharing their top and bottom edges; captions in the row below */
.body {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
  grid-template-areas:
    "plot charts"
    "legend axis";
  gap: 0.5rem 1rem;
  flex-grow: 1;
}

.embedding-plot {
  grid-area: plot;
  position: relative;
  aspect-ratio: 1;
  border: 1px solid var(--neutral-800);
}

.target {
  fill: none;
  stroke: var(--neutral-600);
  stroke-width: 1;
  stroke-dasharray: 3 4;
  vector-effect: non-scaling-stroke;
}

.embedding-point {
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
  grid-area: legend;
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
  border-top: 1px dashed var(--neutral-600);
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

.line-invariance {
  stroke: var(--primary-400);
}

.line-sigreg {
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
  grid-area: axis;
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

.point {
  position: absolute;
  width: 0.5625rem;
  height: 0.5625rem;
  border-radius: 50%;
  border: 2px solid var(--neutral-900);
  translate: -50% -50%;
  pointer-events: none;
}

.point-invariance {
  background-color: var(--primary-400);
  box-shadow: 0 0 0.75rem var(--primary-400);
}

.point-sigreg {
  background-color: var(--neutral-200);
}

@media (width < 40rem) {
  .body {
    grid-template-columns: 1fr;
    grid-template-areas: "plot" "legend" "charts" "axis";
  }

  .embedding-plot {
    max-width: 16rem;
  }
}
</style>
