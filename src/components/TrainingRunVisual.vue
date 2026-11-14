<script setup lang="ts">
import { computed, ref, toRef } from "vue";
import { useLiveTicker } from "../composables/useLiveTicker";

/**
 * A simulated training run: train/validation loss streams in epoch by epoch,
 * then a new run starts with fresh hyperparameters. Hover to inspect an epoch.
 */

interface Epoch {
  train: number;
  val: number;
}

interface RunParams {
  start: number;
  floor: number;
  decay: number;
  valGap: number;
  overfitFrom: number;
  learningRate: number;
}

const EPOCHS = 60;
const Y_MAX = 2.6;
const TICK_MS = 220;
const PAUSE_TICKS_BETWEEN_RUNS = 12;
const LEARNING_RATES = [1e-3, 5e-4, 3e-4, 1e-4];

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

const createRunParams = (): RunParams => ({
  start: randomBetween(2.1, 2.45),
  floor: randomBetween(0.06, 0.16),
  decay: randomBetween(0.06, 0.11),
  valGap: randomBetween(0.04, 0.1),
  overfitFrom: randomBetween(32, 50),
  learningRate: LEARNING_RATES[Math.floor(Math.random() * LEARNING_RATES.length)],
});

const simulateEpoch = (epoch: number, params: RunParams): Epoch => {
  const base = params.floor + (params.start - params.floor) * Math.exp(-params.decay * epoch);
  const noise = () => (Math.random() - 0.5) * 0.08 * Math.exp(-epoch / 45);
  const overfit = Math.max(0, epoch - params.overfitFrom) * 0.005;
  return {
    train: Math.max(0.01, base + noise()),
    val: Math.max(0.01, base + params.valGap + overfit + noise()),
  };
};

const simulateRun = (params: RunParams) =>
  Array.from({ length: EPOCHS }, (_, epoch) => simulateEpoch(epoch, params));

interface Props {
  /** Whether the visual is playing */
  active: boolean;
}
const props = defineProps<Props>();

const chartRef = ref<HTMLElement | null>(null);
const runNumber = ref(1);
const params = ref(createRunParams());
// Without motion we show a finished run; otherwise it streams in from epoch 0
const history = ref<Epoch[]>(
  window.matchMedia("(prefers-reduced-motion: reduce)").matches ? simulateRun(params.value) : [],
);
const hoveredIndex = ref<number | null>(null);
let pauseTicks = 0;

useLiveTicker(
  toRef(props, "active"),
  () => {
    if (history.value.length < EPOCHS) {
      history.value.push(simulateEpoch(history.value.length, params.value));
      return;
    }
    pauseTicks++;
    if (pauseTicks < PAUSE_TICKS_BETWEEN_RUNS) return;
    pauseTicks = 0;
    runNumber.value++;
    params.value = createRunParams();
    history.value = [];
  },
  TICK_MS,
);

const toX = (index: number) => (index / (EPOCHS - 1)) * 100;
const toY = (loss: number) => 100 - (Math.min(loss, Y_MAX) / Y_MAX) * 100;

const toPoints = (key: keyof Epoch) =>
  history.value.map((epoch, index) => `${toX(index)},${toY(epoch[key])}`).join(" ");

const trainPoints = computed(() => toPoints("train"));
const valPoints = computed(() => toPoints("val"));
const trainArea = computed(() =>
  history.value.length ? `0,100 ${trainPoints.value} ${toX(history.value.length - 1)},100` : "",
);

const isComplete = computed(() => history.value.length === EPOCHS);
const status = computed(() => {
  if (isComplete.value) return "done";
  if (props.active) return "training";
  return history.value.length ? "paused" : "ready";
});
const selectedIndex = computed(() => hoveredIndex.value ?? history.value.length - 1);
const selected = computed(() => history.value[selectedIndex.value]);

const onPointerMove = (event: PointerEvent) => {
  const rect = chartRef.value?.getBoundingClientRect();
  if (!rect || !history.value.length) return;
  const fraction = (event.clientX - rect.left) / rect.width;
  const index = Math.round(fraction * (EPOCHS - 1));
  hoveredIndex.value = Math.min(Math.max(index, 0), history.value.length - 1);
};
</script>

<template>
  <div class="visual">
    <div class="header">
      <div class="run-info">
        <span class="status" :class="status">{{ status }}</span>
        <span>run #{{ runNumber }}</span>
        <span>lr {{ params.learningRate.toExponential(0) }}</span>
      </div>
      <div class="legend">
        <span class="legend-train">train</span>
        <span class="legend-val">val</span>
      </div>
    </div>

    <div class="stats">
      <div class="stat">
        <span class="stat-label">epoch</span>
        <span class="stat-value">{{ Math.max(selectedIndex + 1, 0) }}<span class="stat-unit">/{{ EPOCHS }}</span></span>
      </div>
      <div class="stat">
        <span class="stat-label">train loss</span>
        <span class="stat-value stat-train">{{ selected ? selected.train.toFixed(4) : "—" }}</span>
      </div>
      <div class="stat">
        <span class="stat-label">val loss</span>
        <span class="stat-value">{{ selected ? selected.val.toFixed(4) : "—" }}</span>
      </div>
    </div>

    <div ref="chartRef" class="chart" @pointermove="onPointerMove" @pointerleave="hoveredIndex = null">
      <span class="axis-label axis-top">{{ Y_MAX.toFixed(1) }}</span>
      <span class="axis-label axis-bottom">0.0</span>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="train-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--primary-500)" stop-opacity="0.35" />
            <stop offset="100%" stop-color="var(--primary-500)" stop-opacity="0" />
          </linearGradient>
        </defs>
        <polygon :points="trainArea" fill="url(#train-fill)" />
        <polyline :points="valPoints" class="line line-val" />
        <polyline :points="trainPoints" class="line line-train" />
      </svg>

      <template v-if="selected">
        <span v-if="hoveredIndex !== null" class="crosshair" :style="{ left: `${toX(selectedIndex)}%` }"></span>
        <span class="point point-val" :style="{ left: `${toX(selectedIndex)}%`, top: `${toY(selected.val)}%` }"></span>
        <span class="point point-train"
          :style="{ left: `${toX(selectedIndex)}%`, top: `${toY(selected.train)}%` }"></span>
        <div v-if="hoveredIndex !== null" class="tooltip" :class="{ flipped: toX(selectedIndex) > 60 }"
          :style="{ left: `${toX(selectedIndex)}%`, top: `${toY(selected.train)}%` }">
          <span class="tooltip-title">epoch {{ selectedIndex + 1 }}</span>
          <span><span class="dot dot-train"></span>train {{ selected.train.toFixed(4) }}</span>
          <span><span class="dot dot-val"></span>val {{ selected.val.toFixed(4) }}</span>
        </div>
      </template>
    </div>
    <span class="axis-x">epochs →</span>
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
  color: var(--neutral-500);
}

.header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.run-info,
.legend {
  display: flex;
  align-items: center;
  gap: 1rem;
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

.legend-train::before,
.legend-val::before {
  content: "";
  display: inline-block;
  width: 1rem;
  margin-right: 0.375rem;
  vertical-align: middle;
  border-top: 2px solid var(--primary-400);
}

.legend-val::before {
  border-top: 2px dashed var(--accent-400);
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

.stat-train {
  color: var(--primary-300);
}

.stat-unit {
  color: var(--neutral-500);
  font-size: 0.75rem;
}

.chart {
  position: relative;
  flex-grow: 1;
  min-height: clamp(8rem, 22dvh, 16rem);
  border-left: 1px solid var(--neutral-700);
  border-bottom: 1px solid var(--neutral-700);
  background-image: linear-gradient(color-mix(in srgb, var(--neutral-700), transparent 60%) 1px, transparent 1px);
  background-size: 100% 25%;
  cursor: crosshair;
  touch-action: none;
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

.line-train {
  stroke: var(--primary-400);
}

.line-val {
  stroke: var(--accent-400);
  stroke-dasharray: 4 3;
  opacity: 0.8;
}

.axis-label {
  position: absolute;
  left: 0.375rem;
  font-size: 0.6875rem;
}

.axis-top {
  top: 0.25rem;
}

.axis-bottom {
  bottom: 0.25rem;
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
  width: 0.625rem;
  height: 0.625rem;
  border-radius: 50%;
  border: 2px solid var(--neutral-900);
  translate: -50% -50%;
  pointer-events: none;
}

.point-train {
  background-color: var(--primary-400);
  box-shadow: 0 0 0.75rem var(--primary-400);
}

.point-val {
  background-color: var(--accent-400);
}

.tooltip {
  position: absolute;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--neutral-700);
  background-color: color-mix(in srgb, var(--neutral-950), transparent 10%);
  backdrop-filter: blur(8px);
  white-space: nowrap;
  color: var(--neutral-200);
  translate: 0.875rem -50%;
  pointer-events: none;
}

.tooltip.flipped {
  translate: calc(-100% - 0.875rem) -50%;
}

.tooltip-title {
  color: var(--neutral-400);
}

.dot {
  display: inline-block;
  width: 0.5rem;
  height: 0.5rem;
  margin-right: 0.5rem;
  border-radius: 50%;
}

.dot-train {
  background-color: var(--primary-400);
}

.dot-val {
  background-color: var(--accent-400);
}
</style>
