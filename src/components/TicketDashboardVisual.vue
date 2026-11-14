<script setup lang="ts">
import { computed, ref, toRef } from "vue";
import { useLiveTicker } from "../composables/useLiveTicker";

/**
 * A miniature of the ticket analysis dashboard, drawn to illustrate rather
 * than measure. Topics aren't predefined classes: they are clusters found in
 * the ticket text, so new ones can emerge, like the one rising at the bottom.
 * Volumes trend over time, and now and then a topic spikes: a sudden surge
 * that is flagged as an anomaly against its own recent baseline, which is
 * what makes watching the topics worthwhile. A table ranks topics by relative
 * volume, and each new ticket lands in its nearest topic. Hover a topic to
 * follow its trend.
 */

interface Topic {
  name: string;
  color: string;
  /** Typical relative volume */
  level: number;
  /** Found only recently: flat at first, then rising */
  isEmerging?: boolean;
}

interface SampleTicket {
  id: number;
  text: string;
  topic: string;
}

const TOPICS: Topic[] = [
  { name: "payments", color: "var(--warning-400)", level: 0.66 },
  { name: "bugs", color: "var(--warning-200)", level: 0.5 },
  { name: "account", color: "var(--warning-600)", level: 0.36 },
  { name: "matchmaking", color: "var(--neutral-400)", level: 0.24 },
  { name: "login loop", color: "var(--neutral-100)", level: 0.3, isEmerging: true },
];
const TICKETS = [
  { text: "Charged twice for the same offer", topic: "payments" },
  { text: "Game crashes when opening the shop", topic: "bugs" },
  { text: "Lost access after changing phones", topic: "account" },
  { text: "Stuck on the login screen again", topic: "login loop" },
  { text: "Matches take forever to start", topic: "matchmaking" },
  { text: "Rewards missing after the update", topic: "bugs" },
];
const DAYS = 56;
/** Day from which the emerging topic starts to rise */
const EMERGES_AT = 38;
const TICK_MS = 1100;
const TICKS_PER_TICKET = 3;
/** A spike's shape over consecutive days, as a share of its height */
const SPIKE_SHAPE = [0.55, 1, 0.7, 0.4, 0.2];
const SPIKE_HEIGHT = 0.34;
const SPIKE_CHANCE_PER_TICK = 0.07;
/** Spikes already in the history, so the static view shows them too: topic → first day */
const PAST_SPIKES: Record<string, number> = { bugs: 22, account: 44 };
/** A day this far above its topic's average over the previous week is an anomaly */
const ANOMALY_THRESHOLD = 0.2;
const BASELINE_DAYS = 7;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const nextValue = (previous: number, level: number) =>
  clamp(previous + (level - previous) * 0.15 + (Math.random() - 0.5) * 0.08, 0.03, 0.95);

const spikeValue = (level: number, step: number) =>
  clamp(level + SPIKE_HEIGHT * SPIKE_SHAPE[step] + (Math.random() - 0.5) * 0.04, 0.03, 0.95);

const createSeries = ({ name, level, isEmerging }: Topic) => {
  const series: number[] = [];
  const spikeStart = PAST_SPIKES[name];
  for (let day = 0; day < DAYS; day++) {
    const spikeStep = day - spikeStart;
    if (spikeStep >= 0 && spikeStep < SPIKE_SHAPE.length) {
      series.push(spikeValue(level, spikeStep));
      continue;
    }
    const target = isEmerging && day < EMERGES_AT ? 0.03 : level;
    series.push(nextValue(series[day - 1] ?? target, target));
  }
  return series;
};

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

/** Days that peak well above the previous week's average */
const findAnomalies = (values: number[]) =>
  values.flatMap((value, day) => {
    if (day < BASELINE_DAYS) return [];
    const baseline = sum(values.slice(day - BASELINE_DAYS, day)) / BASELINE_DAYS;
    const isPeak = value >= values[day - 1] && value >= (values[day + 1] ?? 0);
    return isPeak && value - baseline > ANOMALY_THRESHOLD ? [day] : [];
  });

let nextTicketId = 0;
const createSampleTicket = (): SampleTicket => {
  const ticket = TICKETS[nextTicketId % TICKETS.length];
  return { id: nextTicketId++, ...ticket };
};

interface Props {
  /** Whether the visual is playing */
  active: boolean;
}
const props = defineProps<Props>();

const series = ref(Object.fromEntries(TOPICS.map((topic) => [topic.name, createSeries(topic)])));
const ticket = ref(createSampleTicket());
const hoveredTopic = ref<string | null>(null);
let ticks = 0;
let spike: { topic: string; step: number } | null = null;

useLiveTicker(
  toRef(props, "active"),
  () => {
    for (const topic of TOPICS) {
      const values = series.value[topic.name];
      const next =
        spike?.topic === topic.name
          ? spikeValue(topic.level, spike.step)
          : nextValue(values[values.length - 1], topic.level);
      series.value[topic.name] = [...values.slice(1), next];
    }
    if (spike) {
      spike.step++;
      if (spike.step >= SPIKE_SHAPE.length) spike = null;
    } else if (Math.random() < SPIKE_CHANCE_PER_TICK) {
      const candidates = TOPICS.filter((topic) => !topic.isEmerging);
      spike = { topic: candidates[Math.floor(Math.random() * candidates.length)].name, step: 0 };
    }
    ticks++;
    if (ticks % TICKS_PER_TICKET === 0) ticket.value = createSampleTicket();
  },
  TICK_MS,
);

const toPoints = (values: number[]) =>
  values.map((value, index) => `${(index / (DAYS - 1)) * 100},${100 - value * 100}`).join(" ");

/** Ranked by recent volume; trend compares the last week with the one before */
const rows = computed(() => {
  const ranked = TOPICS.map((topic) => {
    const values = series.value[topic.name];
    const thisWeek = sum(values.slice(-7));
    const anomalies = findAnomalies(values);
    return {
      ...topic,
      volume: thisWeek,
      isRising: thisWeek >= sum(values.slice(-14, -7)),
      points: toPoints(values),
      anomalies: anomalies.map((day) => ({ day, x: (day / (DAYS - 1)) * 100, y: 100 - values[day] * 100 })),
      hasRecentSpike: anomalies.some((day) => day >= DAYS - BASELINE_DAYS),
    };
  }).sort((a, b) => b.volume - a.volume);
  const maxVolume = Math.max(...ranked.map((row) => row.volume));
  return ranked.map((row) => ({ ...row, share: row.volume / maxVolume }));
});

const status = computed(() => (props.active ? "live" : "idle"));
</script>

<template>
  <div class="browser">
    <div class="browser-bar">
      <span class="url">tickets.local/topics</span>
      <span class="live" :class="{ paused: status !== 'live' }">{{ status }}</span>
    </div>

    <div class="dashboard">
      <div class="main" @pointerleave="hoveredTopic = null">
        <div class="trend">
          <span class="panel-label">volume by topic over time</span>
          <div class="plot">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <polyline v-for="row in rows" :key="row.name" :points="row.points" class="trend-line"
                :class="{ dimmed: hoveredTopic && hoveredTopic !== row.name, focused: hoveredTopic === row.name }"
                :style="{ stroke: row.color }" />
            </svg>
            <!-- Detected anomalies, ringed on their topic's line -->
            <template v-for="row in rows" :key="row.name">
              <span v-for="anomaly in row.anomalies" :key="anomaly.day" class="anomaly"
                :class="{ dimmed: hoveredTopic && hoveredTopic !== row.name, recent: anomaly.day >= DAYS - BASELINE_DAYS }"
                :style="{ left: `${anomaly.x}%`, top: `${anomaly.y}%`, borderColor: row.color }"></span>
            </template>
          </div>
        </div>

        <table class="topics">
          <thead>
            <tr>
              <th>topic</th>
              <th>volume</th>
              <th>trend</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.name"
              :class="{ dimmed: hoveredTopic && hoveredTopic !== row.name, incoming: ticket.topic === row.name }"
              @pointerenter="hoveredTopic = row.name">
              <td><span class="swatch" :style="{ backgroundColor: row.color }"></span>{{ row.name }}</td>
              <td class="volume">
                <span class="volume-bar" :style="{ width: `${row.share * 100}%`, backgroundColor: row.color }"></span>
              </td>
              <td class="trend-cell">
                <span v-if="row.isEmerging" class="badge">new</span>
                <span v-else-if="row.hasRecentSpike" class="badge spike">spike</span>
                <span v-else class="arrow">{{ row.isRising ? "▲" : "▼" }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- The newest ticket, placed in its nearest topic -->
      <Transition name="ticket" mode="out-in">
        <div :key="ticket.id" class="ticket">
          <span class="ticket-text">“{{ ticket.text }}”</span>
          <span class="ticket-topic">→ {{ ticket.topic }}</span>
        </div>
      </Transition>
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
  color: var(--text-muted);
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

.main {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
  gap: 0.875rem;
}

@media (max-width: 40rem) {
  .main {
    grid-template-columns: 1fr;
  }
}

.trend {
  position: relative;
  min-height: 7.5rem;
  border-left: 1px solid var(--neutral-700);
  border-bottom: 1px solid var(--neutral-700);
  background-image: linear-gradient(color-mix(in srgb, var(--neutral-700), transparent 60%) 1px, transparent 1px);
  background-size: 100% 25%;
}

.panel-label {
  position: absolute;
  top: 0.25rem;
  left: 0.375rem;
  font-size: 0.625rem;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--text-muted);
}

.plot {
  position: absolute;
  inset: 1.25rem 0 0;
}

svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.anomaly {
  position: absolute;
  width: 0.625rem;
  height: 0.625rem;
  border: 1.5px solid;
  border-radius: 50%;
  translate: -50% -50%;
  transition: opacity 0.3s ease;
}

.anomaly.dimmed {
  opacity: 0.15;
}

/* A fresh anomaly pulses until it scrolls out of the last week */
.anomaly.recent {
  animation: anomaly-pulse 1.4s ease-out infinite;
}

@keyframes anomaly-pulse {
  50% {
    box-shadow: 0 0 0 0.375rem color-mix(in srgb, var(--warning-400), transparent 80%);
  }
}

.trend-line {
  fill: none;
  stroke-width: 1.5;
  vector-effect: non-scaling-stroke;
  stroke-linejoin: round;
  transition: opacity 0.3s ease, stroke-width 0.3s ease;
}

.trend-line.dimmed {
  opacity: 0.15;
}

.trend-line.focused {
  stroke-width: 2.5;
}

.topics {
  border-collapse: collapse;
  font-variant-numeric: tabular-nums;
}

th {
  padding-bottom: 0.375rem;
  font-size: 0.625rem;
  font-weight: 400;
  letter-spacing: 1px;
  text-align: left;
  text-transform: uppercase;
  color: var(--text-muted);
}

th:last-child {
  text-align: right;
}

tbody tr {
  cursor: default;
  transition: opacity 0.3s ease;
}

tbody tr.dimmed {
  opacity: 0.35;
}

td {
  position: relative;
  padding: 0.3125rem 0;
  color: var(--neutral-300);
  white-space: nowrap;
}

td + td {
  padding-left: 0.625rem;
}

.swatch {
  display: inline-block;
  width: 0.5rem;
  height: 0.5rem;
  margin-right: 0.5rem;
}

/* Relative volume, not a count */
.volume {
  width: 40%;
}

.volume-bar {
  display: block;
  height: 0.375rem;
  opacity: 0.8;
  transition: width 0.6s ease;
}

.trend-cell {
  text-align: right;
}

/* Neutral: for support tickets, fewer is good news, so red and green would mislead */
.arrow {
  color: var(--neutral-400);
}

.badge.spike {
  border-color: color-mix(in srgb, var(--warning-400), transparent 40%);
  color: var(--warning-300);
}

/* A topic the clustering found only recently */
.badge {
  padding: 0 0.375rem;
  border: 1px solid var(--neutral-500);
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--neutral-100);
}

/* The topic of the newest ticket */
tbody tr.incoming td:first-child {
  color: var(--neutral-100);
}

.ticket {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.5rem 0.625rem;
  border: 1px dashed var(--neutral-700);
  white-space: nowrap;
}

.ticket-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--neutral-300);
}

.ticket-topic {
  color: var(--warning-300);
}

.ticket-enter-active,
.ticket-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.ticket-enter-from {
  opacity: 0;
  transform: translateY(-0.375rem);
}

.ticket-leave-to {
  opacity: 0;
}
</style>
