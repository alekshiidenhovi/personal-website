<script setup lang="ts">
import { computed, ref, shallowRef, toRef } from "vue";
import { useLiveTicker } from "../../composables/useLiveTicker";

/**
 * The ticket analysis workflow in phases, on a loop:
 * 1. ingest: tickets pour through the ETL funnel, each landing as a point in the embedding space
 * 2. cluster: the funnel runs dry and topic clusters are found in the collected points
 * 3. dashboard: per-topic ticket counts appear
 * 4. reset: everything fades out before the next run
 */

interface Props {
  active: boolean;
}
const props = defineProps<Props>();

type Phase = "ingest" | "cluster" | "dashboard" | "reset";

/** Ingest lasts until every ticket has landed; the other phases are timed */
const PHASE_DURATIONS_MS: Record<Exclude<Phase, "ingest">, number> = {
  cluster: 2200,
  dashboard: 3500,
  reset: 800,
};
const NEXT_PHASE: Record<Phase, Phase> = { ingest: "cluster", cluster: "dashboard", dashboard: "reset", reset: "ingest" };

const TICK_MS = 150;
const POINT_COUNT = 40;
/** How long a ticket takes to fall into the funnel; matches the CSS animation */
const FLIGHT_MS = 1200;
const FLIGHT_TICKS = FLIGHT_MS / TICK_MS;

const TICKET_ROWS = [70, 88, 106, 124, 142];
/** Three equal-width stages side by side */
const STAGE_WIDTH = 120;
const STAGE_GAP = 10;
const stageX = (index: number) => 10 + index * (STAGE_WIDTH + STAGE_GAP);
const STAGES = ["etl", "embedding space", "dashboard"].map((title, index) => ({
  title,
  centerX: stageX(index) + STAGE_WIDTH / 2,
}));

const FUNNEL = { mouthX: 62, stemStartX: 100, stemEndX: 128, centerY: 106, mouthRadius: 28, stemRadius: 4 };
const SPACE = { x: stageX(1), y: 40, width: STAGE_WIDTH, height: 140 };
const DASHBOARD = { x: stageX(2), y: 40, width: STAGE_WIDTH, height: 140, padding: 8 };
/** Horizontal center of a ticket card, used to aim tickets at the funnel's mouth */
const TICKET_CENTER_X = 21;

interface Topic {
  label: string;
  x: number;
  y: number;
  /** Relative share of the tickets */
  weight: number;
}

const TOPICS: Topic[] = [
  { label: "payments", x: 176, y: 78, weight: 0.45 },
  { label: "bugs", x: 228, y: 116, weight: 0.33 },
  { label: "account", x: 178, y: 150, weight: 0.22 },
];
/** Keeps a cluster's outline inside the embedding space even with outliers */
const MAX_HULL_RADIUS = 20;

interface Point {
  x: number;
  y: number;
  topic: number;
}

interface Ticket {
  id: number;
  row: number;
  spawnedAtTick: number;
}

const pickTopic = () => {
  let roll = Math.random();
  for (const [index, topic] of TOPICS.entries()) {
    roll -= topic.weight;
    if (roll < 0) return index;
  }
  return TOPICS.length - 1;
};

/** Points scattered around their topic's center, roughly normally distributed */
const generatePoints = (): Point[] =>
  Array.from({ length: POINT_COUNT }, () => {
    const topic = pickTopic();
    const spread = () => (Math.random() + Math.random() + Math.random() - 1.5) * 16;
    return { x: TOPICS[topic].x + spread(), y: TOPICS[topic].y + spread(), topic };
  });

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Without motion, show a finished run
const phase = ref<Phase>(prefersReducedMotion ? "dashboard" : "ingest");
const points = shallowRef(generatePoints());
const landedCount = ref(prefersReducedMotion ? POINT_COUNT : 0);
const tickets = shallowRef<Ticket[]>([]);
let tick = 0;
let phaseStartTick = 0;
let spawnedCount = 0;
let nextTicketId = 0;

const enterPhase = (next: Phase) => {
  phase.value = next;
  phaseStartTick = tick;
  if (next !== "ingest") return;
  points.value = generatePoints();
  landedCount.value = 0;
  spawnedCount = 0;
};

const ingestTick = () => {
  const landed = tickets.value.filter((ticket) => tick - ticket.spawnedAtTick >= FLIGHT_TICKS);
  const stillFalling = tickets.value.filter((ticket) => tick - ticket.spawnedAtTick < FLIGHT_TICKS);
  if (spawnedCount < POINT_COUNT) {
    stillFalling.push({ id: nextTicketId++, row: Math.floor(Math.random() * TICKET_ROWS.length), spawnedAtTick: tick });
    spawnedCount++;
  }
  tickets.value = stillFalling;
  landedCount.value += landed.length;
  if (landedCount.value === POINT_COUNT) enterPhase("cluster");
};

useLiveTicker(
  toRef(props, "active"),
  () => {
    tick++;
    if (phase.value === "ingest") {
      ingestTick();
      return;
    }
    const elapsedMs = (tick - phaseStartTick) * TICK_MS;
    if (elapsedMs >= PHASE_DURATIONS_MS[phase.value]) enterPhase(NEXT_PHASE[phase.value]);
  },
  TICK_MS,
);

const visiblePoints = computed(() => points.value.slice(0, landedCount.value));
const topicCounts = computed(() => TOPICS.map((_, index) => points.value.filter((p) => p.topic === index).length));
const maxCount = computed(() => Math.max(...topicCounts.value));

/** A circle around each cluster's points */
const hulls = computed(() =>
  TOPICS.map((topic, index) => {
    const members = points.value.filter((p) => p.topic === index);
    const furthest = Math.max(...members.map((p) => Math.hypot(p.x - topic.x, p.y - topic.y)), 8);
    return { ...topic, radius: Math.min(furthest, MAX_HULL_RADIUS) + 4 };
  }),
);

const status = computed(() => {
  if (phase.value === "ingest") return `ingesting ${landedCount.value} / ${POINT_COUNT}`;
  if (phase.value === "cluster") return "clustering…";
  return `${TOPICS.length} topics found`;
});

const funnelOutline = computed(() => {
  const { mouthX, stemStartX, stemEndX, centerY, mouthRadius, stemRadius } = FUNNEL;
  return [
    `M${mouthX} ${centerY - mouthRadius} L${stemStartX} ${centerY - stemRadius} H${stemEndX}`,
    `M${mouthX} ${centerY + mouthRadius} L${stemStartX} ${centerY + stemRadius} H${stemEndX}`,
  ].join(" ");
});
const funnelGlass = computed(() => {
  const { mouthX, stemStartX, stemEndX, centerY, mouthRadius, stemRadius } = FUNNEL;
  return `M${mouthX} ${centerY - mouthRadius} L${stemStartX} ${centerY - stemRadius} H${stemEndX} V${centerY + stemRadius} H${stemStartX} L${mouthX} ${centerY + mouthRadius} Z`;
});
</script>

<template>
  <svg class="cover" :class="[`phase-${phase}`, { active: props.active }]" viewBox="0 0 400 220" aria-hidden="true">
    <text v-for="stage in STAGES" :key="stage.title" :x="stage.centerX" y="24" text-anchor="middle"
      class="cover-text label">{{ stage.title }}</text>
    <text x="10" y="206" class="cover-text accent status">{{ status }}</text>

    <!-- Tickets falling into the funnel; each finishes its flight, so the stream drains naturally -->
    <g v-for="ticket in tickets" :key="ticket.id" class="ticket"
      :style="{ '--dx': `${FUNNEL.mouthX - TICKET_CENTER_X}px`, '--dy': `${FUNNEL.centerY - TICKET_ROWS[ticket.row]}px` }">
      <rect x="10" :y="TICKET_ROWS[ticket.row] - 6" width="22" height="12" rx="2" class="cover-line" />
      <line x1="14" :y1="TICKET_ROWS[ticket.row] - 2" x2="28" :y2="TICKET_ROWS[ticket.row] - 2"
        class="cover-line muted" />
      <line x1="14" :y1="TICKET_ROWS[ticket.row] + 2" x2="22" :y2="TICKET_ROWS[ticket.row] + 2"
        class="cover-line muted" />
    </g>

    <!-- ETL funnel: a lab funnel on its side, the mouth facing the incoming tickets -->
    <g class="funnel">
      <path :d="funnelGlass" class="funnel-glass" />
      <path :d="funnelOutline" class="cover-line funnel-line" />
      <ellipse :cx="FUNNEL.mouthX" :cy="FUNNEL.centerY" rx="6" :ry="FUNNEL.mouthRadius" class="cover-line funnel-line" />
      <ellipse :cx="FUNNEL.stemEndX" :cy="FUNNEL.centerY" rx="1.5" :ry="FUNNEL.stemRadius"
        class="cover-line funnel-line" />
    </g>

    <!-- Embedding space: points land while ingesting, then get clustered -->
    <rect :x="SPACE.x" :y="SPACE.y" :width="SPACE.width" :height="SPACE.height" rx="3"
      class="cover-line muted space" />
    <g class="clusters">
      <g v-for="(hull, index) in hulls" :key="hull.label" :class="`topic-${index}`">
        <circle :cx="hull.x" :cy="hull.y" :r="hull.radius" pathLength="100" class="cover-line hull" />
        <text :x="hull.x" :y="hull.y - hull.radius - 4" text-anchor="middle" class="cover-text topic-label">
          {{ hull.label }}</text>
      </g>
    </g>
    <circle v-for="(point, index) in visiblePoints" :key="index" :cx="point.x" :cy="point.y" r="2" class="point"
      :class="`topic-${point.topic}`" />


    <!-- Dashboard: tickets per topic; bars grow with CSS transitions -->
    <rect :x="DASHBOARD.x" :y="DASHBOARD.y" :width="DASHBOARD.width" :height="DASHBOARD.height" rx="3"
      class="cover-line" />
    <g v-for="(topic, index) in TOPICS" :key="topic.label" class="dashboard-row" :class="`topic-${index}`"
      :style="{ '--share': topicCounts[index] / maxCount, '--row-delay': `${index * 0.15}s` }">
      <rect :x="DASHBOARD.x + DASHBOARD.padding" :y="60 + index * 40" width="5" height="5" class="swatch" />
      <text :x="DASHBOARD.x + DASHBOARD.padding + 9" :y="65 + index * 40" class="cover-text label">
        {{ topic.label }}</text>
      <text :x="DASHBOARD.x + DASHBOARD.width - DASHBOARD.padding" :y="65 + index * 40" text-anchor="end"
        class="cover-text count">{{ topicCounts[index] }}</text>
      <rect :x="DASHBOARD.x + DASHBOARD.padding" :y="72 + index * 40" :width="DASHBOARD.width - DASHBOARD.padding * 2"
        height="8" class="bar" />
    </g>
  </svg>
</template>

<style scoped>
/* One color per cluster */
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
    transform: translate(var(--dx), var(--dy)) scale(0.35);
  }
}

.funnel-glass {
  fill: var(--card-color);
  fill-opacity: 0.05;
}

/* The funnel runs while ingesting and eases off once it is dry */
.phase-ingest .funnel-line {
  stroke: var(--cover-accent);
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
  animation: point-in 0.3s ease-out;
}

@keyframes point-in {
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
  animation: draw 1.2s ease-out both;
}

@keyframes draw {
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

/* A new run starts from empty bars without animating back down */
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

/* Fade everything out before the next run */
.phase-reset .point,
.phase-reset .dashboard-row,
.phase-reset .clusters {
  opacity: 0;
  transition: opacity 0.6s ease;
}
</style>
