<script setup lang="ts">
import { computed, ref, toRef } from "vue";
import { useLiveTicker } from "../composables/useLiveTicker";

/**
 * A simulated LeJEPA pretraining run, shaped like the real ones: the SIGReg
 * term drops fast like an ordinary loss, while the invariance term starts near
 * zero, spikes as the embeddings spread out, then settles in between. Each run
 * uses the next SIGReg weight λ; a larger λ settles at a higher invariance and
 * a lower SIGReg. Hover to inspect a step.
 */

interface Step {
  /** Raw and smoothed invariance loss */
  invariance: number;
  invarianceSmooth: number;
  sigreg: number;
}

interface RunShape {
  lambda: number;
  invarianceStart: number;
  invariancePeak: number;
  invarianceSettle: number;
  sigregFloor: number;
}

/** Roughly the curves of the λ sweep in the thesis */
const RUN_SHAPES: RunShape[] = [
  { lambda: 0.05, invarianceStart: 0.06, invariancePeak: 0.26, invarianceSettle: 0.16, sigregFloor: 2.5 },
  { lambda: 0.01, invarianceStart: 0.06, invariancePeak: 0.14, invarianceSettle: 0.07, sigregFloor: 6 },
  { lambda: 0.002, invarianceStart: 0.05, invariancePeak: 0.065, invarianceSettle: 0.03, sigregFloor: 15 },
];

const STEP_COUNT = 80;
const STEPS_PER_POINT = 300;
const PEAK_AT = 0.05;
const INVARIANCE_MAX = 0.3;
/** The log scale runs from 10⁰ to a little above 10², so the starting loss clears the top */
const SIGREG_DECADES = 2.4;
const SMOOTHING = 0.15;
const TICK_MS = 160;
const PAUSE_TICKS_BETWEEN_RUNS = 14;

const simulateStep = (index: number, shape: RunShape, previous: Step | undefined): Step => {
  const t = index / (STEP_COUNT - 1);
  const { invarianceStart, invariancePeak, invarianceSettle, sigregFloor } = shape;
  const base =
    t < PEAK_AT
      ? invarianceStart + (invariancePeak - invarianceStart) * Math.sin(((t / PEAK_AT) * Math.PI) / 2)
      : invarianceSettle + (invariancePeak - invarianceSettle) * Math.exp(-(t - PEAK_AT) / 0.3);
  const invariance = Math.max(0, base * (1 + (Math.random() - 0.5) * 0.45));
  const sigreg =
    sigregFloor * (1 + 0.9 * Math.exp(-t / 0.3)) + (100 - 1.9 * sigregFloor) * Math.exp(-t / 0.035);
  const invarianceSmooth = previous ? previous.invarianceSmooth + SMOOTHING * (invariance - previous.invarianceSmooth) : invariance;
  return { invariance, invarianceSmooth, sigreg: sigreg * (1 + (Math.random() - 0.5) * 0.06) };
};

const simulateRun = (shape: RunShape) => {
  const steps: Step[] = [];
  for (let index = 0; index < STEP_COUNT; index++) steps.push(simulateStep(index, shape, steps[index - 1]));
  return steps;
};

interface Props {
  /** Whether the visual is playing */
  active: boolean;
}
const props = defineProps<Props>();

const chartsRef = ref<HTMLElement | null>(null);
const runIndex = ref(0);
const shape = computed(() => RUN_SHAPES[runIndex.value % RUN_SHAPES.length]);
// Without motion we show a finished run; otherwise it streams in from step 0
const history = ref<Step[]>(
  window.matchMedia("(prefers-reduced-motion: reduce)").matches ? simulateRun(RUN_SHAPES[0]) : [],
);
const hoveredIndex = ref<number | null>(null);
let pauseTicks = 0;

useLiveTicker(
  toRef(props, "active"),
  () => {
    if (history.value.length < STEP_COUNT) {
      history.value.push(simulateStep(history.value.length, shape.value, history.value[history.value.length - 1]));
      return;
    }
    pauseTicks++;
    if (pauseTicks < PAUSE_TICKS_BETWEEN_RUNS) return;
    pauseTicks = 0;
    runIndex.value++;
    history.value = [];
  },
  TICK_MS,
);

const toX = (index: number) => (index / (STEP_COUNT - 1)) * 100;
const toInvarianceY = (loss: number) => 100 - (Math.min(loss, INVARIANCE_MAX) / INVARIANCE_MAX) * 100;
const toSigregY = (loss: number) => 100 - (Math.log10(Math.max(loss, 1)) / SIGREG_DECADES) * 100;

const toPoints = (value: (step: Step) => number, toY: (loss: number) => number) =>
  history.value.map((step, index) => `${toX(index)},${toY(value(step))}`).join(" ");

const invarianceRawPoints = computed(() => toPoints((step) => step.invariance, toInvarianceY));
const invariancePoints = computed(() => toPoints((step) => step.invarianceSmooth, toInvarianceY));
const sigregPoints = computed(() => toPoints((step) => step.sigreg, toSigregY));

const status = computed(() => {
  if (history.value.length === STEP_COUNT) return "done";
  if (props.active) return "training";
  return history.value.length ? "paused" : "ready";
});
const selectedIndex = computed(() => hoveredIndex.value ?? history.value.length - 1);
const selected = computed(() => history.value[selectedIndex.value]);
const formatStep = (index: number) => ((index + 1) * STEPS_PER_POINT).toLocaleString("en-US");

const onPointerMove = (event: PointerEvent) => {
  const rect = chartsRef.value?.getBoundingClientRect();
  if (!rect || !history.value.length) return;
  const fraction = (event.clientX - rect.left) / rect.width;
  const index = Math.round(fraction * (STEP_COUNT - 1));
  hoveredIndex.value = Math.min(Math.max(index, 0), history.value.length - 1);
};
</script>

<template>
  <div class="visual">
    <div class="header">
      <div class="run-info">
        <span class="status" :class="status">{{ status }}</span>
        <span>run #{{ runIndex + 1 }}</span>
        <span>λ {{ shape.lambda }}</span>
      </div>
      <span class="objective">LeJEPA = (1−λ)·inv + λ·SIGReg</span>
    </div>

    <div class="stats">
      <div class="stat">
        <span class="stat-label">step</span>
        <span class="stat-value">{{ selected ? formatStep(selectedIndex) : "0" }}</span>
      </div>
      <div class="stat">
        <span class="stat-label">invariance</span>
        <span class="stat-value stat-invariance">{{ selected ? selected.invarianceSmooth.toFixed(4) : "—" }}</span>
      </div>
      <div class="stat">
        <span class="stat-label">SIGReg</span>
        <span class="stat-value">{{ selected ? selected.sigreg.toFixed(2) : "—" }}</span>
      </div>
    </div>

    <!-- Two panels sharing the step axis, as in the thesis figures -->
    <div ref="chartsRef" class="charts" @pointermove="onPointerMove" @pointerleave="hoveredIndex = null">
      <div class="chart">
        <span class="panel-label">invariance</span>
        <span class="axis-label axis-top">{{ INVARIANCE_MAX.toFixed(1) }}</span>
        <span class="axis-label axis-bottom">0.0</span>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <polyline :points="invarianceRawPoints" class="line line-raw" />
          <polyline :points="invariancePoints" class="line line-invariance" />
        </svg>
        <span v-if="selected" class="point point-invariance"
          :style="{ left: `${toX(selectedIndex)}%`, top: `${toInvarianceY(selected.invarianceSmooth)}%` }"></span>
      </div>
      <div class="chart chart-log">
        <span class="panel-label">SIGReg · log</span>
        <span class="axis-label decade" :style="{ top: `${toSigregY(100)}%` }">10²</span>
        <span class="axis-label decade" :style="{ top: `${toSigregY(10)}%` }">10¹</span>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <polyline :points="sigregPoints" class="line line-sigreg" />
        </svg>
        <span v-if="selected" class="point point-sigreg"
          :style="{ left: `${toX(selectedIndex)}%`, top: `${toSigregY(selected.sigreg)}%` }"></span>
      </div>
      <span v-if="selected && hoveredIndex !== null" class="crosshair" :style="{ left: `${toX(selectedIndex)}%` }"></span>
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

.run-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.objective {
  color: var(--text-muted);
  white-space: nowrap;
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

/* The raw, noisy invariance loss sits faintly behind its smoothed curve */
.line-raw {
  stroke: var(--neutral-600);
  stroke-width: 1;
  opacity: 0.7;
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
