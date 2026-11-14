<script setup lang="ts">
import { computed, ref, toRef } from "vue";
import { useLiveTicker } from "../composables/useLiveTicker";

/**
 * A miniature data pipeline job, drawn to illustrate rather than measure:
 * events flow through ingest, validation and write stages, data quality
 * checks quarantine the bad rows, and the day's partition fills while earlier
 * ones sit validated. Hover a check to see which rows it caught.
 */

type Check = "schema" | "not-null" | "unique" | "freshness";

interface StreamRow {
  id: number;
  key: string;
  event: string;
  /** The check the row failed, if any */
  failed: Check | null;
}

interface Partition {
  date: string;
  /** Share of a typical day's volume written so far */
  fill: number;
}

const TICK_MS = 700;
const STREAM_LENGTH = 6;
const FAILURE_RATE = 0.12;
const STAGES = ["ingest", "validate", "write"];
const EVENTS = ["ticket.created", "message.sent", "ticket.updated", "ticket.closed"];
const CHECKS: Check[] = ["schema", "not-null", "unique", "freshness"];
const FAILURE_REASONS: Record<Check, string> = {
  schema: "bad type",
  "not-null": "missing field",
  unique: "duplicate key",
  freshness: "arrived late",
};
const TODAY_FILL_STEP = 0.02;

const randomItem = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];
const randomKey = () => Math.floor(Math.random() * 0xffff).toString(16).padStart(4, "0");

let nextRowId = 0;
const createRow = (): StreamRow => ({
  id: nextRowId++,
  key: randomKey(),
  event: randomItem(EVENTS),
  failed: Math.random() < FAILURE_RATE ? randomItem(CHECKS) : null,
});

const formatDate = (daysAgo: number) => new Date(Date.now() - daysAgo * 86_400_000).toISOString().slice(0, 10);

const createPartitions = (): Partition[] =>
  [0, 1, 2, 3].map((daysAgo) => ({ date: formatDate(daysAgo), fill: daysAgo === 0 ? 0.35 : 0.85 + Math.random() * 0.15 }));

interface Props {
  /** Whether the visual is playing */
  active: boolean;
}
const props = defineProps<Props>();

const stream = ref(Array.from({ length: STREAM_LENGTH }, createRow));
const partitions = ref(createPartitions());
const flashedCheck = ref<Check | null>(null);
const hoveredCheck = ref<Check | null>(null);

useLiveTicker(
  toRef(props, "active"),
  () => {
    const row = createRow();
    stream.value = [row, ...stream.value.slice(0, STREAM_LENGTH - 1)];
    const today = partitions.value[0];
    today.fill = today.fill >= 0.95 ? 0.35 : today.fill + TODAY_FILL_STEP;
    flashedCheck.value = row.failed;
  },
  TICK_MS,
);

const status = computed(() => (props.active ? "running" : "idle"));
</script>

<template>
  <div class="visual" :class="{ running: props.active }">
    <div class="header">
      <span class="status" :class="status">{{ status }}</span>
      <span>job events_daily</span>
    </div>

    <!-- The job's stages, with data flowing between them -->
    <ol class="stages">
      <template v-for="(stage, index) in STAGES" :key="stage">
        <li class="stage">{{ stage }}</li>
        <li v-if="index < STAGES.length - 1" class="flow" aria-hidden="true"></li>
      </template>
    </ol>

    <div class="columns">
      <section class="column">
        <span class="column-label">stream sample</span>
        <TransitionGroup name="row" tag="ol" class="stream">
          <li v-for="row in stream" :key="row.id" class="row"
            :class="{ failed: row.failed, dimmed: hoveredCheck && row.failed !== hoveredCheck }">
            <span class="key">{{ row.key }}</span>
            <span class="event">{{ row.event }}</span>
            <span class="verdict">{{ row.failed ? `✗ ${FAILURE_REASONS[row.failed]}` : "✓" }}</span>
          </li>
        </TransitionGroup>
      </section>

      <section class="column">
        <span class="column-label">partitions</span>
        <ol class="partitions">
          <li v-for="(partition, index) in partitions" :key="partition.date" class="partition"
            :class="{ writing: index === 0 }">
            <span class="partition-date">dt={{ partition.date }}</span>
            <span class="partition-track"><span class="partition-fill" :style="{ width: `${partition.fill * 100}%` }"></span></span>
            <span class="partition-state">{{ index === 0 ? "writing" : "✓" }}</span>
          </li>
        </ol>
      </section>
    </div>

    <ul class="checks" @pointerleave="hoveredCheck = null">
      <li v-for="check in CHECKS" :key="check" class="check" :class="{ flashed: flashedCheck === check }"
        @pointerenter="hoveredCheck = check">
        <span class="check-dot"></span>
        <span class="check-name">{{ check }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.visual {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.875rem;
  align-self: stretch;
  width: 100%;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--text-muted);
}

.header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--accent-300);
}

.status::before {
  content: "";
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background-color: var(--accent-400);
  animation: pulse 1.2s ease-in-out infinite;
}

.status.idle {
  color: var(--neutral-400);
}

.status.idle::before {
  background-color: var(--neutral-500);
  animation: none;
}

@keyframes pulse {
  50% {
    opacity: 0.3;
  }
}

.stages {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  list-style: none;
}

.stage {
  padding: 0.375rem 0.75rem;
  border: 1px solid color-mix(in srgb, var(--accent-400), transparent 55%);
  background-color: color-mix(in srgb, var(--accent-400), transparent 92%);
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 0.6875rem;
  color: var(--accent-300);
}

/* A dashed connector that flows while the job runs */
.flow {
  flex: 1;
  height: 1px;
  background: repeating-linear-gradient(90deg, var(--neutral-600) 0 4px, transparent 4px 8px);
  background-size: 8px 1px;
}

.running .flow {
  background-image: repeating-linear-gradient(90deg, var(--accent-400) 0 4px, transparent 4px 8px);
  animation: flow 0.6s linear infinite;
}

@keyframes flow {
  to {
    background-position: 8px 0;
  }
}

.columns {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  gap: 1rem;
}

.column {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;
}

.column-label {
  font-size: 0.625rem;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--text-muted);
}

.stream,
.partitions {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.3125rem;
  list-style: none;
}

.row {
  display: grid;
  grid-template-columns: 2.5rem minmax(0, 1fr) auto;
  gap: 0.5rem;
  white-space: nowrap;
  transition: opacity 0.3s ease;
}

.key {
  color: var(--text-muted);
}

.event {
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--neutral-300);
}

.verdict {
  color: var(--success-400);
}

/* Rows that fail a check are struck out and quarantined */
.row.failed .event {
  color: var(--text-muted);
  text-decoration: line-through;
}

.row.failed .verdict {
  color: var(--danger-400);
}

.row.dimmed {
  opacity: 0.25;
}

.row-enter-active,
.row-move {
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.row-leave-active {
  display: none;
}

.row-enter-from {
  opacity: 0;
  transform: translateY(-0.5rem);
}

.partition {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) 3.5rem;
  align-items: center;
  gap: 0.625rem;
  white-space: nowrap;
}

.partition-date {
  color: var(--neutral-400);
}

/* Relative volume, not a measurement */
.partition-track {
  height: 0.375rem;
  background-color: var(--neutral-800);
}

.partition-fill {
  display: block;
  height: 100%;
  background-color: var(--neutral-500);
  transition: width 0.6s ease;
}

.partition.writing .partition-fill {
  background-color: var(--accent-400);
}

.partition-state {
  text-align: right;
  color: var(--success-400);
}

/* Today's partition is still being written */
.partition.writing .partition-state {
  color: var(--accent-300);
  animation: pulse 1.2s ease-in-out infinite;
}

.checks {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.5rem;
  list-style: none;
}

.check {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.5rem;
  border: 1px solid var(--neutral-800);
  cursor: default;
  transition: border-color 0.3s ease, background-color 0.3s ease;
}

.check:hover {
  border-color: var(--neutral-600);
}

/* A check lights up when it catches a row */
.check.flashed {
  border-color: color-mix(in srgb, var(--danger-400), transparent 40%);
  background-color: color-mix(in srgb, var(--danger-400), transparent 92%);
}

.check-name {
  font-size: 0.625rem;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.check-dot {
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 50%;
  background-color: var(--success-400);
  transition: background-color 0.3s ease;
}

.check.flashed .check-dot {
  background-color: var(--danger-400);
}

/* Narrow screens stack the stream above the partitions */
@media (max-width: 40rem) {
  .columns {
    grid-template-columns: 1fr;
  }

  .checks {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
