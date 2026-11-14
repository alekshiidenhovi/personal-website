<script setup lang="ts">
import { computed, ref, toRef } from "vue";
import { useLiveTicker } from "../composables/useLiveTicker";

/**
 * A miniature real-time metrics dashboard: traffic streams in as bars and
 * requests scroll through a log. Hover a bar to inspect that second.
 */

interface Sample {
  id: number;
  time: string;
  requestsPerSecond: number;
  p95LatencyMs: number;
  errorRate: number;
}

interface LogEntry {
  id: number;
  method: string;
  path: string;
  status: number;
  durationMs: number;
}

const BAR_COUNT = 28;
const TICK_MS = 1000;
const MAX_REQUESTS_PER_SECOND = 300;
const LOG_LENGTH = 3;
const ENDPOINTS = [
  { method: "GET", path: "/api/tickets" },
  { method: "GET", path: "/api/topics?window=7d" },
  { method: "POST", path: "/api/search" },
  { method: "GET", path: "/api/metrics/summary" },
  { method: "PATCH", path: "/api/tickets/4821" },
];

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const formatTime = (date: Date) => date.toLocaleTimeString("en-GB", { hour12: false });

let nextSampleId = 0;
const nextSample = (previous: Sample | undefined, date: Date): Sample => {
  const requestsPerSecond = Math.round(
    clamp((previous?.requestsPerSecond ?? 160) + (Math.random() - 0.5) * 70, 60, 280),
  );
  return {
    id: nextSampleId++,
    time: formatTime(date),
    requestsPerSecond,
    p95LatencyMs: Math.round(28 + requestsPerSecond * 0.08 + Math.random() * 12),
    errorRate: Math.random() < 0.08 ? 0.8 + Math.random() : Math.random() * 0.3,
  };
};

const createInitialSamples = () => {
  const now = Date.now();
  const result: Sample[] = [];
  for (let i = BAR_COUNT - 1; i >= 0; i--) {
    result.push(nextSample(result[result.length - 1], new Date(now - i * TICK_MS)));
  }
  return result;
};

let nextLogId = 0;
const createLogEntry = (): LogEntry => {
  const endpoint = ENDPOINTS[Math.floor(Math.random() * ENDPOINTS.length)];
  const roll = Math.random();
  const successStatus = endpoint.method === "POST" ? 201 : 200;
  return {
    id: nextLogId++,
    ...endpoint,
    status: roll < 0.04 ? 500 : roll < 0.15 ? 304 : successStatus,
    durationMs: Math.round(12 + Math.random() * 60),
  };
};

interface Props {
  /** Whether the visual is playing */
  active: boolean;
}
const props = defineProps<Props>();

const samples = ref(createInitialSamples());
const log = ref(Array.from({ length: LOG_LENGTH }, createLogEntry));
const hoveredIndex = ref<number | null>(null);

useLiveTicker(
  toRef(props, "active"),
  () => {
    // Freeze the stream while a bar is being inspected
    if (hoveredIndex.value !== null) return;
    samples.value = [...samples.value.slice(1), nextSample(samples.value[samples.value.length - 1], new Date())];
    log.value = [createLogEntry(), ...log.value.slice(0, LOG_LENGTH - 1)];
  },
  TICK_MS,
);

const status = computed(() => {
  if (!props.active) return "idle";
  return hoveredIndex.value === null ? "live" : "paused";
});

const selectedIndex = computed(() => hoveredIndex.value ?? samples.value.length - 1);
const selected = computed(() => samples.value[selectedIndex.value]);
const previous = computed(() => samples.value[Math.max(selectedIndex.value - 1, 0)]);
const trafficChange = computed(
  () => ((selected.value.requestsPerSecond - previous.value.requestsPerSecond) / previous.value.requestsPerSecond) * 100,
);

const kpis = computed(() => [
  {
    label: "req/s",
    value: selected.value.requestsPerSecond,
    delta: `${trafficChange.value >= 0 ? "▲" : "▼"} ${Math.abs(trafficChange.value).toFixed(1)}%`,
    isGood: trafficChange.value >= 0,
  },
  { label: "p95", value: `${selected.value.p95LatencyMs}ms`, delta: "latency", isGood: selected.value.p95LatencyMs < 50 },
  {
    label: "errors",
    value: `${selected.value.errorRate.toFixed(2)}%`,
    delta: selected.value.errorRate < 0.5 ? "healthy" : "elevated",
    isGood: selected.value.errorRate < 0.5,
  },
]);
</script>

<template>
  <div class="browser">
    <div class="browser-bar">
      <span class="url">dashboard.local/metrics</span>
      <span class="live" :class="{ paused: status !== 'live' }">{{ status }}</span>
    </div>

    <div class="dashboard">
      <div class="kpis">
        <div v-for="kpi in kpis" :key="kpi.label" class="kpi">
          <span class="kpi-label">{{ kpi.label }}</span>
          <span class="kpi-value">{{ kpi.value }}</span>
          <span class="kpi-delta" :class="{ bad: !kpi.isGood }">{{ kpi.delta }}</span>
        </div>
      </div>

      <div class="chart" @pointerleave="hoveredIndex = null">
        <span v-for="(sample, index) in samples" :key="sample.id" class="bar-slot"
          :class="{ active: index === hoveredIndex, dimmed: hoveredIndex !== null && index !== hoveredIndex }"
          @pointerenter="hoveredIndex = index">
          <span class="bar" :class="{ error: sample.errorRate >= 0.5 }"
            :style="{ height: `${(sample.requestsPerSecond / MAX_REQUESTS_PER_SECOND) * 100}%` }"></span>
        </span>
        <div v-if="hoveredIndex !== null" class="tooltip"
          :class="{ flipped: hoveredIndex > BAR_COUNT / 2 }"
          :style="{ left: `${((hoveredIndex + 0.5) / BAR_COUNT) * 100}%` }">
          <span class="tooltip-time">{{ selected.time }}</span>
          <span>{{ selected.requestsPerSecond }} req/s · p95 {{ selected.p95LatencyMs }}ms</span>
        </div>
      </div>

      <TransitionGroup name="log" tag="ol" class="log">
        <li v-for="entry in log" :key="entry.id">
          <span class="method">{{ entry.method }}</span>
          <span class="path">{{ entry.path }}</span>
          <span class="status" :class="{ error: entry.status >= 500, cached: entry.status === 304 }">{{ entry.status
            }}</span>
          <span class="duration">{{ entry.durationMs }}ms</span>
        </li>
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
.browser {
  width: 100%;
  border: 1px solid var(--neutral-800);
  background-color: color-mix(in srgb, var(--neutral-950), transparent 40%);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--neutral-500);
}

.browser-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--neutral-800);
}

.url {
  flex-grow: 1;
  padding: 0.125rem 0.625rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background-color: var(--neutral-800);
  color: var(--neutral-400);
}

.live {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--warning-300);
  text-transform: uppercase;
}

.live.paused {
  color: var(--neutral-400);
}

.live.paused::before {
  background-color: var(--neutral-400);
  animation: none;
}

.live::before {
  content: "";
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 50%;
  background-color: var(--warning-400);
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  50% {
    opacity: 0.25;
  }
}

.dashboard {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.75rem;
}

.kpis {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
}

.kpi {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  padding: 0.5rem 0.625rem;
  border: 1px solid var(--neutral-800);
  background-color: var(--neutral-900);
}

.kpi-label {
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.kpi-value {
  font-size: 1rem;
  font-variant-numeric: tabular-nums;
  color: var(--neutral-100);
}

.kpi-delta {
  font-size: 0.625rem;
  color: var(--success-400);
}

.kpi-delta.bad {
  color: var(--danger-400);
}

.chart {
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 5.5rem;
  border-bottom: 1px solid var(--neutral-700);
}

.bar-slot {
  display: flex;
  align-items: flex-end;
  flex: 1;
  height: 100%;
  cursor: crosshair;
  transition: opacity 0.2s ease;
}

.bar {
  width: 100%;
  background: linear-gradient(to top, color-mix(in srgb, var(--warning-500), transparent 70%), var(--warning-400));
  transition: height 0.4s ease;
}

.bar.error {
  background: linear-gradient(to top, color-mix(in srgb, var(--danger-500), transparent 70%), var(--danger-400));
}

.bar-slot.dimmed {
  opacity: 0.35;
}

.bar-slot.active .bar {
  box-shadow: 0 0 0.75rem var(--warning-400);
}

.tooltip {
  position: absolute;
  top: 0;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  padding: 0.375rem 0.625rem;
  border: 1px solid var(--neutral-700);
  background-color: color-mix(in srgb, var(--neutral-950), transparent 10%);
  white-space: nowrap;
  color: var(--neutral-200);
  translate: 0.5rem 0;
  pointer-events: none;
}

.tooltip.flipped {
  translate: calc(-100% - 0.5rem) 0;
}

.tooltip-time {
  color: var(--neutral-400);
}

.log {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  list-style: none;
}

.log li {
  display: grid;
  grid-template-columns: 3.25rem minmax(0, 1fr) auto 3rem;
  gap: 0.5rem;
  white-space: nowrap;
}

.method {
  color: var(--primary-300);
}

.path {
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--neutral-300);
}

.status {
  color: var(--success-400);
}

.status.cached {
  color: var(--neutral-400);
}

.status.error {
  color: var(--danger-400);
}

.duration {
  text-align: right;
}

.log-enter-active,
.log-move {
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.log-leave-active {
  position: absolute;
  opacity: 0;
}

.log-enter-from {
  opacity: 0;
  transform: translateY(-0.5rem);
}
</style>
