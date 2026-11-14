<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue";

/**
 * An illustrative self-supervised pretraining run, shaped like the thesis
 * runs: the SIGReg loss drops fast like an ordinary loss, while the invariance
 * loss starts near zero, spikes as the embeddings spread out, then slowly
 * settles in between. The curves draw continuously and loop; hover to inspect
 * a step.
 */

const TOTAL_STEPS = 24_000;
const INVARIANCE_START = 0.06;
const INVARIANCE_PEAK = 0.26;
const INVARIANCE_SETTLE = 0.16;
/** Share of the run spent rising to the invariance peak */
const INVARIANCE_PEAK_AT = 0.06;
/** How slowly the invariance loss settles after its peak */
const INVARIANCE_SETTLE_WIDTH = 0.15;
const SIGREG_FLOOR = 2.5;
const INVARIANCE_MAX = 0.3;
/** The log scale runs from 10⁰ to a little above 10², so the starting loss clears the top */
const SIGREG_DECADES = 2.4;
/** Samples per curve; dense enough to read as one smooth line */
const SAMPLE_COUNT = 240;
const RUN_MS = 10_000;
const PAUSE_MS = 2_500;

const smoothstep = (x: number) => x * x * (3 - 2 * x);

/** Smooth everywhere: eases up to the peak, then decays with a long tail */
const invarianceLoss = (t: number) =>
  t < INVARIANCE_PEAK_AT
    ? INVARIANCE_START + (INVARIANCE_PEAK - INVARIANCE_START) * smoothstep(t / INVARIANCE_PEAK_AT)
    : INVARIANCE_SETTLE +
      (INVARIANCE_PEAK - INVARIANCE_SETTLE) / (1 + ((t - INVARIANCE_PEAK_AT) / INVARIANCE_SETTLE_WIDTH) ** 2);

const sigregLoss = (t: number) =>
  SIGREG_FLOOR * (1 + 0.9 * Math.exp(-t / 0.3)) + (100 - 1.9 * SIGREG_FLOOR) * Math.exp(-t / 0.035);

interface Props {
  /** Whether the visual is playing */
  active: boolean;
}
const props = defineProps<Props>();

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const chartsRef = ref<HTMLElement | null>(null);
/** Share of the run drawn so far; without motion the run is shown finished */
const progress = ref(prefersReducedMotion ? 1 : 0);
const hoveredT = ref<number | null>(null);
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
      const elapsed = now - last;
      last = now;
      if (progress.value < 1) {
        progress.value = Math.min(progress.value + elapsed / RUN_MS, 1);
      } else {
        pausedMs += elapsed;
        if (pausedMs >= PAUSE_MS) {
          pausedMs = 0;
          progress.value = 0;
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
const toSigregY = (loss: number) => 100 - (Math.log10(Math.max(loss, 1)) / SIGREG_DECADES) * 100;

/** The curve up to the current progress, ending exactly at its tip */
const toPoints = (loss: (t: number) => number, toY: (loss: number) => number) => {
  const end = progress.value;
  const count = Math.max(Math.ceil(end * SAMPLE_COUNT), 1);
  return Array.from({ length: count + 1 }, (_, i) => {
    const t = (i / count) * end;
    return `${toX(t)},${toY(loss(t))}`;
  }).join(" ");
};

const invariancePoints = computed(() => toPoints(invarianceLoss, toInvarianceY));
const sigregPoints = computed(() => toPoints(sigregLoss, toSigregY));

const status = computed(() => {
  if (progress.value === 1) return "done";
  if (props.active) return "training";
  return progress.value ? "paused" : "ready";
});
const selectedT = computed(() => hoveredT.value ?? progress.value);
const formatStep = (t: number) => (Math.round((t * TOTAL_STEPS) / 100) * 100).toLocaleString("en-US");

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
      <span class="status" :class="status">{{ status }}</span>
      <span>self-supervised pretraining</span>
    </div>

    <div class="stats">
      <div class="stat">
        <span class="stat-label">step</span>
        <span class="stat-value">{{ formatStep(selectedT) }}</span>
      </div>
      <div class="stat">
        <span class="stat-label">invariance loss</span>
        <span class="stat-value stat-invariance">{{ invarianceLoss(selectedT).toFixed(4) }}</span>
      </div>
      <div class="stat">
        <span class="stat-label">SIGReg loss</span>
        <span class="stat-value">{{ sigregLoss(selectedT).toFixed(2) }}</span>
      </div>
    </div>

    <!-- Two panels sharing the step axis, as in the thesis figures -->
    <div ref="chartsRef" class="charts" @pointermove="onPointerMove" @pointerleave="hoveredT = null">
      <div class="chart">
        <span class="panel-label">invariance loss</span>
        <span class="axis-label axis-top">{{ INVARIANCE_MAX.toFixed(1) }}</span>
        <span class="axis-label axis-bottom">0.0</span>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <polyline :points="invariancePoints" class="line line-invariance" />
        </svg>
        <span class="point point-invariance"
          :style="{ left: `${toX(selectedT)}%`, top: `${toInvarianceY(invarianceLoss(selectedT))}%` }"></span>
      </div>
      <div class="chart chart-log">
        <span class="panel-label">SIGReg loss · log</span>
        <span class="axis-label decade" :style="{ top: `${toSigregY(100)}%` }">10²</span>
        <span class="axis-label decade" :style="{ top: `${toSigregY(10)}%` }">10¹</span>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <polyline :points="sigregPoints" class="line line-sigreg" />
        </svg>
        <span class="point point-sigreg"
          :style="{ left: `${toX(selectedT)}%`, top: `${toSigregY(sigregLoss(selectedT))}%` }"></span>
      </div>
      <span v-if="hoveredT !== null" class="crosshair" :style="{ left: `${toX(selectedT)}%` }"></span>
    </div>
    <span class="axis-x">steps →</span>
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

.status {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--primary-300);
}

.status::before {
  content: "";
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background-color: var(--primary-400);
  animation: pulse 1.2s ease-in-out infinite;
}

.status.done {
  color: var(--success-400);
}

.status.done::before {
  background-color: var(--success-400);
  animation: none;
}

.status.paused,
.status.ready {
  color: var(--neutral-400);
}

.status.paused::before,
.status.ready::before {
  background-color: var(--neutral-500);
  animation: none;
}

@keyframes pulse {
  50% {
    opacity: 0.3;
  }
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
  border: 1px solid var(--neutral-800);
  background-color: var(--neutral-800);
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.625rem 0.75rem;
  background-color: var(--neutral-900);
}

.stat-label {
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 0.6875rem;
}

.stat-value {
  font-size: clamp(1rem, 1.6vw, 1.25rem);
  font-variant-numeric: tabular-nums;
  color: var(--neutral-100);
}

.stat-invariance {
  color: var(--primary-300);
}

.charts {
  position: relative;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  gap: 0.5rem;
  min-height: clamp(9rem, 24dvh, 17rem);
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

/* Lines at the decades of the log scale */
.chart-log {
  background-image:
    linear-gradient(color-mix(in srgb, var(--neutral-700), transparent 60%) 1px, transparent 1px),
    linear-gradient(color-mix(in srgb, var(--neutral-700), transparent 60%) 1px, transparent 1px);
  background-size: 100% 1px;
  background-repeat: no-repeat;
  background-position: 0 calc(100% * 0.4 / 2.4), 0 calc(100% * 1.4 / 2.4);
}

svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
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

.decade {
  translate: 0 -50%;
}

.axis-x {
  align-self: flex-end;
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
</style>
