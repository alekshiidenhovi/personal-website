<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue';
import { useLiveTicker } from '../../../composables/useLiveTicker';
import { pickWeightedIndex } from '../../../lib/math';
import { prefersReducedMotion } from '../../../lib/motion';

/**
 * The ticket analysis workflow, in phases on a loop:
 * 1. ingest: tickets pour through the ETL funnel, each landing as a point in the embedding space
 * 2. cluster: the funnel runs dry, and topic clusters are found among the points
 * 3. dashboard: the ticket count of each topic appears
 * 4. reset: everything fades out before the next run
 */
interface Props {
  /** Whether the figure is in view, so it plays. */
  active: boolean;
}
const props = defineProps<Props>();

type Phase = 'ingest' | 'cluster' | 'dashboard' | 'reset';

/** A support topic, as a cluster in the embedding space. */
interface Topic {
  readonly label: string;
  /** The cluster's center. */
  readonly x: number;
  readonly y: number;
  /** The topic's share of the tickets. */
  readonly weight: number;
}

/** A ticket as a point in the embedding space. */
interface EmbeddedTicket {
  readonly x: number;
  readonly y: number;
  /** The index of the ticket's topic. */
  readonly topic: number;
}

/** A ticket on its way into the funnel. */
interface FallingTicket {
  readonly id: number;
  /** The index of the row it starts from. */
  readonly row: number;
  readonly spawnTick: number;
}

/** How long each phase lasts, except the ingest, which lasts until every ticket has landed. */
const PHASE_DURATIONS_MS: Readonly<Record<Exclude<Phase, 'ingest'>, number>> = {
  cluster: 2200,
  dashboard: 3500,
  reset: 800,
};
const NEXT_PHASES: Readonly<Record<Phase, Phase>> = {
  ingest: 'cluster',
  cluster: 'dashboard',
  dashboard: 'reset',
  reset: 'ingest',
};

const TICK_MS = 150;
const TICKET_COUNT = 40;
/** How long a ticket takes to fall into the funnel; the same as the `ticket-fall` animation's duration. */
const FLIGHT_MS = 1200;
const FLIGHT_TICKS = FLIGHT_MS / TICK_MS;

const TICKET_ROWS_Y = [70, 88, 106, 124, 142];
/** The horizontal center of a ticket card, which aims tickets at the funnel's mouth. */
const TICKET_CENTER_X = 21;
const STAGE_WIDTH = 120;
const STAGE_GAP = 10;
const FUNNEL = { mouthX: 62, stemStartX: 100, stemEndX: 128, centerY: 106, mouthRadius: 28, stemRadius: 4 };

const TOPICS: readonly Topic[] = [
  { label: 'payments', x: 176, y: 78, weight: 0.45 },
  { label: 'bugs', x: 228, y: 116, weight: 0.33 },
  { label: 'account', x: 178, y: 150, weight: 0.22 },
];
const TOPIC_WEIGHTS = TOPICS.map((topic) => topic.weight);
/** How far a ticket can land from its topic's center, roughly. */
const TOPIC_SPREAD = 16;
/** Keeps a cluster's outline inside the embedding space, even around outliers. */
const MAX_HULL_RADIUS = 20;

/**
 * Gets the left edge of one of the three equal stages side by side.
 *
 * @param index The stage's index.
 * @returns The stage's x coordinate.
 */
function getStageX(index: number): number {
  return 10 + index * (STAGE_WIDTH + STAGE_GAP);
}

const STAGES = ['etl', 'embedding space', 'dashboard'].map((title, index) => ({
  title,
  centerX: getStageX(index) + STAGE_WIDTH / 2,
}));
const SPACE = { x: getStageX(1), y: 40, width: STAGE_WIDTH, height: 140 };
const DASHBOARD = { x: getStageX(2), y: 40, width: STAGE_WIDTH, height: 140, padding: 8 };

/**
 * Gets the funnel's two sides: from the mouth, narrowing into the stem.
 *
 * @returns The path's `d` attribute.
 */
function getFunnelSidesPath(): string {
  const { mouthX, stemStartX, stemEndX, centerY, mouthRadius, stemRadius } = FUNNEL;
  return [
    `M${mouthX} ${centerY - mouthRadius} L${stemStartX} ${centerY - stemRadius} H${stemEndX}`,
    `M${mouthX} ${centerY + mouthRadius} L${stemStartX} ${centerY + stemRadius} H${stemEndX}`,
  ].join(' ');
}

/**
 * Gets the funnel's outline as one closed shape, for its tinted glass.
 *
 * @returns The path's `d` attribute.
 */
function getFunnelGlassPath(): string {
  const { mouthX, stemStartX, stemEndX, centerY, mouthRadius, stemRadius } = FUNNEL;
  return [
    `M${mouthX} ${centerY - mouthRadius} L${stemStartX} ${centerY - stemRadius} H${stemEndX}`,
    `V${centerY + stemRadius} H${stemStartX} L${mouthX} ${centerY + mouthRadius} Z`,
  ].join(' ');
}

const FUNNEL_SIDES_PATH = getFunnelSidesPath();
const FUNNEL_GLASS_PATH = getFunnelGlassPath();

/**
 * Samples an offset from a topic's center, roughly normally distributed, as a sum of three uniform samples.
 *
 * @returns The offset.
 */
function sampleTopicOffset(): number {
  return (Math.random() + Math.random() + Math.random() - 1.5) * TOPIC_SPREAD;
}

/**
 * Creates a run's tickets, each scattered around its topic's center.
 *
 * @returns The tickets as points in the embedding space.
 */
function createEmbeddedTickets(): EmbeddedTicket[] {
  return Array.from({ length: TICKET_COUNT }, () => {
    const topic = pickWeightedIndex(TOPIC_WEIGHTS);
    return { x: TOPICS[topic].x + sampleTopicOffset(), y: TOPICS[topic].y + sampleTopicOffset(), topic };
  });
}

// Without motion the figure rests on a finished run
const phase = ref<Phase>(prefersReducedMotion ? 'dashboard' : 'ingest');
const embeddedTickets = shallowRef(createEmbeddedTickets());
const landedCount = ref(prefersReducedMotion ? TICKET_COUNT : 0);
const fallingTickets = shallowRef<FallingTicket[]>([]);
let tickCount = 0;
let phaseStartTick = 0;
let spawnedCount = 0;
let nextTicketId = 0;

const landedTickets = computed(() => embeddedTickets.value.slice(0, landedCount.value));
const topicCounts = computed(() =>
  TOPICS.map((_, index) => embeddedTickets.value.filter((ticket) => ticket.topic === index).length),
);
const maxTopicCount = computed(() => Math.max(...topicCounts.value));

/** A circle around each topic's tickets. */
const hulls = computed(() =>
  TOPICS.map((topic, index) => {
    const distances = embeddedTickets.value
      .filter((ticket) => ticket.topic === index)
      .map((ticket) => Math.hypot(ticket.x - topic.x, ticket.y - topic.y));
    return { ...topic, radius: Math.min(Math.max(...distances, 8), MAX_HULL_RADIUS) + 4 };
  }),
);

const statusText = computed(() => {
  switch (phase.value) {
    case 'ingest':
      return `ingesting ${landedCount.value} / ${TICKET_COUNT}`;
    case 'cluster':
      return 'clustering…';
    default:
      return `${TOPICS.length} topics found`;
  }
});

/**
 * Moves on to a phase; a new ingest starts a new run.
 *
 * @param nextPhase The phase to enter.
 */
function enterPhase(nextPhase: Phase) {
  phase.value = nextPhase;
  phaseStartTick = tickCount;
  if (nextPhase === 'ingest') {
    embeddedTickets.value = createEmbeddedTickets();
    landedCount.value = 0;
    spawnedCount = 0;
  }
}

/**
 * Checks whether a ticket has finished its fall into the funnel.
 *
 * @param ticket The ticket.
 * @returns Whether it has landed.
 */
function hasLanded(ticket: FallingTicket): boolean {
  return tickCount - ticket.spawnTick >= FLIGHT_TICKS;
}

/** Lands the tickets that have finished falling, and sends the next one, until every ticket has landed. */
function advanceIngest() {
  const stillFalling = fallingTickets.value.filter((ticket) => !hasLanded(ticket));
  landedCount.value += fallingTickets.value.length - stillFalling.length;
  if (spawnedCount < TICKET_COUNT) {
    const row = Math.floor(Math.random() * TICKET_ROWS_Y.length);
    stillFalling.push({ id: nextTicketId++, row, spawnTick: tickCount });
    spawnedCount++;
  }
  fallingTickets.value = stillFalling;
  if (landedCount.value === TICKET_COUNT) {
    enterPhase('cluster');
  }
}

/** Advances the run by a tick: the ingest by its tickets, the other phases by their time. */
function advance() {
  tickCount++;
  if (phase.value === 'ingest') {
    advanceIngest();
    return;
  }
  const phaseElapsedMs = (tickCount - phaseStartTick) * TICK_MS;
  if (phaseElapsedMs >= PHASE_DURATIONS_MS[phase.value]) {
    enterPhase(NEXT_PHASES[phase.value]);
  }
}

useLiveTicker(() => props.active, advance, TICK_MS);
</script>

<template>
  <svg class="drawing" :class="[`phase-${phase}`, { active: props.active }]" viewBox="0 0 400 220" aria-hidden="true">
    <text v-for="stage in STAGES" :key="stage.title" :x="stage.centerX" y="24" text-anchor="middle"
      class="drawing-text label">{{ stage.title }}</text>
    <text x="10" y="206" class="drawing-text accent status">{{ statusText }}</text>

    <!-- Tickets falling into the funnel; each finishes its flight, so the stream drains naturally -->
    <g v-for="ticket in fallingTickets" :key="ticket.id" class="ticket" :style="{
      '--fall-x': `${FUNNEL.mouthX - TICKET_CENTER_X}px`,
      '--fall-y': `${FUNNEL.centerY - TICKET_ROWS_Y[ticket.row]}px`,
    }">
      <rect x="10" :y="TICKET_ROWS_Y[ticket.row] - 6" width="22" height="12" rx="2" class="drawing-line" />
      <line x1="14" :y1="TICKET_ROWS_Y[ticket.row] - 2" x2="28" :y2="TICKET_ROWS_Y[ticket.row] - 2"
        class="drawing-line muted" />
      <line x1="14" :y1="TICKET_ROWS_Y[ticket.row] + 2" x2="22" :y2="TICKET_ROWS_Y[ticket.row] + 2"
        class="drawing-line muted" />
    </g>

    <!-- ETL funnel: a lab funnel on its side, the mouth facing the incoming tickets -->
    <path :d="FUNNEL_GLASS_PATH" class="funnel-glass" />
    <path :d="FUNNEL_SIDES_PATH" class="drawing-line funnel-line" />
    <ellipse :cx="FUNNEL.mouthX" :cy="FUNNEL.centerY" rx="6" :ry="FUNNEL.mouthRadius" class="drawing-line funnel-line" />
    <ellipse :cx="FUNNEL.stemEndX" :cy="FUNNEL.centerY" rx="1.5" :ry="FUNNEL.stemRadius"
      class="drawing-line funnel-line" />

    <!-- Embedding space: tickets land as points while ingesting, then get clustered -->
    <rect :x="SPACE.x" :y="SPACE.y" :width="SPACE.width" :height="SPACE.height" rx="3"
      class="drawing-line muted space" />
    <g class="clusters">
      <g v-for="(hull, index) in hulls" :key="hull.label" :class="`topic-${index}`">
        <circle :cx="hull.x" :cy="hull.y" :r="hull.radius" pathLength="100" class="drawing-line hull" />
        <text :x="hull.x" :y="hull.y - hull.radius - 4" text-anchor="middle" class="drawing-text topic-label">
          {{ hull.label }}</text>
      </g>
    </g>
    <circle v-for="(ticket, index) in landedTickets" :key="index" :cx="ticket.x" :cy="ticket.y" r="2" class="point"
      :class="`topic-${ticket.topic}`" />

    <!-- Dashboard: tickets per topic; the bars grow with CSS transitions -->
    <rect :x="DASHBOARD.x" :y="DASHBOARD.y" :width="DASHBOARD.width" :height="DASHBOARD.height" rx="3"
      class="drawing-line" />
    <g v-for="(topic, index) in TOPICS" :key="topic.label" class="dashboard-row" :class="`topic-${index}`"
      :style="{ '--share': topicCounts[index] / maxTopicCount, '--row-delay': `${index * 0.15}s` }">
      <rect :x="DASHBOARD.x + DASHBOARD.padding" :y="60 + index * 40" width="5" height="5" class="swatch" />
      <text :x="DASHBOARD.x + DASHBOARD.padding + 9" :y="65 + index * 40" class="drawing-text label">
        {{ topic.label }}</text>
      <text :x="DASHBOARD.x + DASHBOARD.width - DASHBOARD.padding" :y="65 + index * 40" text-anchor="end"
        class="drawing-text count">{{ topicCounts[index] }}</text>
      <rect :x="DASHBOARD.x + DASHBOARD.padding" :y="72 + index * 40" :width="DASHBOARD.width - DASHBOARD.padding * 2"
        height="8" class="bar" />
    </g>
  </svg>
</template>

<style scoped>
/* One color per topic */
.topic-0 {
  --topic-color: var(--primary-400);
}

.topic-1 {
  --topic-color: var(--accent-400);
}

.topic-2 {
  --topic-color: var(--warning-400);
}

.status {
  font-size: 8px;
}

.ticket {
  transform-box: fill-box;
  transform-origin: center;
  animation: ticket-fall 1.2s cubic-bezier(0.45, 0, 0.8, 0.6) both;
}

@keyframes ticket-fall {
  from {
    opacity: 0;
    transform: translate(0, 0) scale(1);
  }

  15% {
    opacity: 1;
  }

  to {
    opacity: 0;
    transform: translate(var(--fall-x), var(--fall-y)) scale(0.35);
  }
}

.funnel-glass {
  fill: var(--card-color);
  fill-opacity: 0.05;
}

/* The funnel runs while ingesting, and eases off once it is dry */
.phase-ingest .funnel-line {
  stroke: var(--drawing-accent);
}

.phase-ingest .funnel-glass {
  fill-opacity: 0.12;
}

.space {
  fill: var(--neutral-950);
  fill-opacity: 0.4;
}

.point {
  fill: var(--neutral-400);
  animation: fade-in 0.3s ease-out;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
}

/* Clustered points take their topic's color */
.phase-cluster .point,
.phase-dashboard .point,
.phase-reset .point {
  fill: var(--topic-color);
}

.clusters {
  opacity: 0;
}

.phase-cluster .clusters,
.phase-dashboard .clusters {
  opacity: 1;
}

.hull {
  stroke: var(--topic-color);
}

.phase-cluster .hull {
  animation: draw-outline 1.2s ease-out both;
}

/* The outline's length is set to 100 by its pathLength */
@keyframes draw-outline {
  from {
    stroke-dasharray: 0 100;
  }

  to {
    stroke-dasharray: 100 0;
  }
}

.topic-label {
  font-size: 8px;
  fill: var(--topic-color);
}

.swatch {
  fill: var(--topic-color);
}

.count {
  font-size: 8px;
  fill: var(--topic-color);
  opacity: 0;
  transition: opacity 0.4s ease var(--row-delay);
}

.bar {
  fill: var(--topic-color);
  transform-box: fill-box;
  transform-origin: left;
  transform: scaleX(0);
  transition: transform 1s cubic-bezier(0.2, 0.7, 0.2, 1) var(--row-delay);
}

/* A new run starts from empty bars without animating them back down */
.phase-ingest .count,
.phase-ingest .bar {
  transition: none;
}

.phase-dashboard .count,
.phase-reset .count {
  opacity: 1;
}

.phase-dashboard .bar,
.phase-reset .bar {
  transform: scaleX(var(--share));
}

/* Everything fades out before the next run */
.phase-reset .point,
.phase-reset .dashboard-row,
.phase-reset .clusters {
  opacity: 0;
  transition: opacity 0.6s ease;
}
</style>
