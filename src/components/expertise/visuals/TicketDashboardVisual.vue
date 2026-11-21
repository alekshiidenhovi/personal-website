<script setup lang="ts">
import { computed, ref } from 'vue';
import { useLiveTicker } from '../../../composables/useLiveTicker';
import StatusBadge from '../StatusBadge.vue';
import { advanceDay, BASELINE_DAYS, createHistories, DAYS, rankTopics, type Spike } from './topicTrends';

/**
 * A miniature of the ticket analysis dashboard (see topicTrends): the topics' volumes over time with their
 * anomalies ringed, a table ranking the topics by recent volume, and each new ticket landing in its nearest topic.
 * Hovering a topic follows its trend.
 */
interface Props {
  /** Whether the visual is in view, so it plays. */
  active: boolean;
}
const props = defineProps<Props>();

/** A new ticket, with the topic it lands in. */
interface SampleTicket {
  readonly id: number;
  readonly text: string;
  readonly topic: string;
}

const SAMPLE_TICKETS = [
  { text: 'Charged twice for the same offer', topic: 'payments' },
  { text: 'Game crashes when opening the shop', topic: 'bugs' },
  { text: 'Lost access after changing phones', topic: 'account' },
  { text: 'Stuck on the login screen again', topic: 'login loop' },
  { text: 'Matches take forever to start', topic: 'matchmaking' },
  { text: 'Rewards missing after the update', topic: 'bugs' },
];
/** Each tick moves the trend on a day. */
const TICK_MS = 1100;
const TICKS_PER_TICKET = 3;

const histories = ref(createHistories());
const ticketCount = ref(0);
const hoveredTopic = ref<string>();
let spike: Spike | undefined;
let tickCount = 0;

const rows = computed(() => rankTopics(histories.value));
const ticket = computed<SampleTicket>(() => ({
  id: ticketCount.value,
  ...SAMPLE_TICKETS[ticketCount.value % SAMPLE_TICKETS.length],
}));
const status = computed(() => (props.active ? 'live' : 'idle'));

/**
 * Checks whether a topic recedes, while another one is hovered.
 *
 * @param topic The topic's name.
 * @returns Whether it is dimmed.
 */
function isDimmed(topic: string): boolean {
  return hoveredTopic.value !== undefined && hoveredTopic.value !== topic;
}

/** Moves the trend on a day, and brings in a new ticket every few days. */
function advance() {
  spike = advanceDay(histories.value, spike);
  tickCount++;
  if (tickCount % TICKS_PER_TICKET === 0) {
    ticketCount.value++;
  }
}

useLiveTicker(() => props.active, advance, TICK_MS);
</script>

<template>
  <div class="browser">
    <div class="browser-bar">
      <span class="url">tickets.local/topics</span>
      <StatusBadge class="live" :label="status" :tone="status === 'live' ? 'active' : 'idle'" color="warning" />
    </div>

    <div class="dashboard">
      <div class="main" @pointerleave="hoveredTopic = undefined">
        <div class="trend">
          <span class="panel-label">volume by topic over time</span>
          <div class="plot">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <polyline v-for="row in rows" :key="row.name" :points="row.trendPoints" class="trend-line"
                :class="{ dimmed: isDimmed(row.name), focused: hoveredTopic === row.name }"
                :style="{ stroke: row.color }" />
            </svg>
            <!-- Detected anomalies, ringed on their topic's line -->
            <template v-for="row in rows" :key="row.name">
              <span v-for="anomaly in row.anomalies" :key="anomaly.day" class="anomaly"
                :class="{ dimmed: isDimmed(row.name), recent: anomaly.day >= DAYS - BASELINE_DAYS }"
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
              :class="{ dimmed: isDimmed(row.name), incoming: ticket.topic === row.name }"
              @pointerenter="hoveredTopic = row.name">
              <td><span class="swatch" :style="{ backgroundColor: row.color }"></span>{{ row.name }}</td>
              <td class="volume">
                <span class="volume-bar" :style="{ width: `${row.share * 100}%`, backgroundColor: row.color }"></span>
              </td>
              <td class="trend-cell">
                <span v-if="row.isEmerging" class="badge">new</span>
                <span v-else-if="row.hasRecentSpike" class="badge spike">spike</span>
                <span v-else class="arrow">{{ row.isRising ? '▲' : '▼' }}</span>
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
@import "../../../styles/media.css";

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

/* Uppercase in the address bar, like a live indicator */
.live {
  text-transform: uppercase;
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

@media (--below-sm) {
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
