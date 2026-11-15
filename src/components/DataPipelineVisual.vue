<script setup lang="ts">
import { computed, ref, toRef } from "vue";
import { useLiveTicker } from "../composables/useLiveTicker";

/**
 * A miniature daily pipeline job, drawn to illustrate rather than measure,
 * laid out as its three stages. Events arrive in ingest, pass through the
 * data quality checks in validate, where bad rows are quarantined, and fill
 * the day's partition in write. A full day is sealed, then the job moves on
 * to the next. Hover a check to see which rows it caught.
 */

type Check = "schema" | "not-null" | "unique" | "freshness";

interface StreamRow {
  id: number;
  key: string;
  event: string;
  /** The check the row failed, if any */
  failed: Check | null;
}

const TICK_MS = 1200;
/** One more than the six shown, so the oldest fades out rather than vanishing */
const STREAM_LENGTH = 7;
const FAILURE_RATE = 0.12;
const EVENTS = ["ticket.created", "message.sent", "ticket.updated", "ticket.closed"];
const CHECKS: Check[] = ["schema", "not-null", "unique", "freshness"];
const FAILURE_REASONS: Record<Check, string> = {
  schema: "bad type",
  "not-null": "missing field",
  unique: "duplicate key",
  freshness: "arrived late",
};
/** Passing rows that fill a day; each writes the same step */
const ROWS_PER_DAY = 12;
const PARTITION_COUNT = 4;
/** Ticks the sealed day is shown before the next one starts */
const SEAL_TICKS = 3;
/** The first day written; recent, but far enough back that the loop stays in the past */
const FIRST_DAY_OFFSET = -14;

const randomItem = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];
const randomKey = () => Math.floor(Math.random() * 0xffff).toString(16).padStart(4, "0");
const formatDate = (dayOffset: number) => new Date(Date.now() + dayOffset * 86_400_000).toISOString().slice(0, 10);

let nextRowId = 0;
const createRow = (): StreamRow => ({
  id: nextRowId++,
  key: randomKey(),
  event: randomItem(EVENTS),
  failed: Math.random() < FAILURE_RATE ? randomItem(CHECKS) : null,
});

interface Props {
  /** Whether the visual is playing */
  active: boolean;
}
const props = defineProps<Props>();

const stream = ref(Array.from({ length: STREAM_LENGTH }, createRow));
/** The row in validation, keyed by tick so its flow animations restart */
const current = ref<StreamRow | null>(stream.value[0]);
const tick = ref(0);
/** Newest first; the first is the day being written. Days are offsets from today */
const days = ref(
  Array.from({ length: PARTITION_COUNT }, (_, index) => ({
    offset: FIRST_DAY_OFFSET - index,
    written: index ? ROWS_PER_DAY : 4,
  })),
);
/** Counted over the whole job and seeded with earlier days, so the rate holds steady rather than jumping */
const SEED_CHECKED = 500;
const checked = ref(SEED_CHECKED);
const passed = ref(Math.round(SEED_CHECKED * (1 - FAILURE_RATE)));
const passRate = computed(() => `${((passed.value / checked.value) * 100).toFixed(1)}%`);
const phase = ref<"writing" | "sealing">("writing");
const hoveredCheck = ref<Check | null>(null);
let sealTicks = 0;

useLiveTicker(
  toRef(props, "active"),
  () => {
    tick.value++;
    const today = days.value[0];

    if (phase.value === "sealing") {
      current.value = null;
      if (++sealTicks < SEAL_TICKS) return;
      sealTicks = 0;
      days.value = [{ offset: today.offset + 1, written: 0 }, ...days.value.slice(0, PARTITION_COUNT - 1)];
      phase.value = "writing";
      return;
    }

    const row = createRow();
    stream.value = [row, ...stream.value.slice(0, STREAM_LENGTH - 1)];
    current.value = row;
    checked.value++;
    if (row.failed) return;
    passed.value++;
    if (++today.written === ROWS_PER_DAY) phase.value = "sealing";
  },
  TICK_MS,
);

const status = computed(() => (props.active ? (phase.value === "sealing" ? "sealing" : "running") : "idle"));
const partitionState = (index: number) => {
  if (index > 0) return "sealed";
  return phase.value === "sealing" ? "sealed" : "writing";
};
</script>

<template>
  <div class="visual" :class="{ running: props.active }">
    <div class="header">
      <span class="status" :class="status">{{ status }}</span>
      <span>job events_daily</span>
    </div>

    <!-- The job's stages as columns, with each row flowing between them -->
    <div class="pipeline">
      <span class="stage stage-ingest">ingest</span>
      <span class="flow" aria-hidden="true">
        <span v-if="current" :key="`in-${tick}`" class="flow-dot"></span>
      </span>
      <span class="stage stage-validate">validate</span>
      <span class="flow" aria-hidden="true">
        <span v-if="current && !current.failed" :key="`out-${tick}`" class="flow-dot flow-dot-late"></span>
      </span>
      <span class="stage stage-write">write</span>

      <section class="column column-ingest">
        <TransitionGroup name="row" tag="ol" class="stream">
          <li v-for="row in stream" :key="row.id" class="row"
            :class="{ failed: row.failed, dimmed: hoveredCheck && row.failed !== hoveredCheck }">
            <span class="key">{{ row.key }}</span>
            <span class="event">{{ row.event }}</span>
          </li>
        </TransitionGroup>
      </section>

      <section class="column column-validate">
        <p class="checking">
          <template v-if="current">
            <span>row {{ current.key }}</span>
            <span :key="tick" class="verdict" :class="{ failed: current.failed }">
              {{ current.failed ? "✗ quarantined" : "✓ passed" }}
            </span>
          </template>
          <span v-else>sealing partition</span>
        </p>
        <ul class="checks" @pointerleave="hoveredCheck = null">
          <li v-for="check in CHECKS" :key="check" class="check" :class="{ caught: current?.failed === check }"
            @pointerenter="hoveredCheck = check">
            <span class="check-dot"></span>
            <span class="check-name">{{ check }}</span>
            <span v-if="current?.failed === check" :key="tick" class="check-reason">{{ FAILURE_REASONS[check] }}</span>
          </li>
        </ul>
        <p class="pass-rate">pass rate <span class="pass-rate-value">{{ passRate }}</span></p>
      </section>

      <section class="column column-write">
        <TransitionGroup name="partition" tag="ol" class="partitions">
          <li v-for="(day, index) in days" :key="day.offset" class="partition" :class="partitionState(index)">
            <span class="partition-head">
              <span class="partition-date">date={{ formatDate(day.offset) }}</span>
              <span class="partition-state">{{ partitionState(index) === "writing" ? "writing" : "✓" }}</span>
            </span>
            <span class="partition-track"><span class="partition-fill" :style="{ width: `${(day.written / ROWS_PER_DAY) * 100}%` }"></span></span>
            <span class="partition-count">{{ day.written }}/{{ ROWS_PER_DAY }}</span>
          </li>
        </TransitionGroup>
      </section>
    </div>
  </div>
</template>

<style scoped>
.visual {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1rem;
  align-self: stretch;
  width: 100%;
  font-family: var(--font-mono);
  /* Grows with the window, so wide screens aren't left with empty space around it */
  font-size: clamp(0.75rem, 2cqi, 0.875rem);
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

.status.sealing {
  color: var(--success-400);
}

.status.sealing::before {
  background-color: var(--success-400);
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

/* Stage headers over their columns, joined by connectors */
.pipeline {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 2rem minmax(0, 1fr) 2rem minmax(0, 1.15fr);
  row-gap: 0.75em;
}

.stage {
  margin-bottom: 0.25rem;
}

.stage {
  padding: 0.375rem 0;
  border: 1px solid color-mix(in srgb, var(--accent-400), transparent 55%);
  background-color: color-mix(in srgb, var(--accent-400), transparent 92%);
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 0.9em;
  color: var(--accent-300);
}

.flow {
  position: relative;
  align-self: center;
  height: 1px;
  background: repeating-linear-gradient(90deg, var(--neutral-600) 0 3px, transparent 3px 6px);
}

/* Each row travels the connectors: into validation, then on to write if it passed */
.flow-dot {
  position: absolute;
  top: 50%;
  left: 0;
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 50%;
  background-color: var(--accent-400);
  box-shadow: 0 0 0.375rem var(--accent-400);
  translate: -50% -50%;
  opacity: 0;
  animation: travel 0.45s ease-in-out forwards;
}

.flow-dot-late {
  animation-delay: 0.55s;
}

@keyframes travel {
  0% {
    left: 0;
    opacity: 1;
  }

  100% {
    left: 100%;
    opacity: 0;
  }
}

/*
 * The validate column's parts sit on the pipeline's own rows, so the ingest
 * and write lists can span exactly from the row being checked down to the
 * last check, with the quarantine count below.
 */
.column {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* The stream is laid over the column rather than sizing it, so it never stretches the pipeline */
.column-ingest {
  position: relative;
  grid-column: 1;
  grid-row: 2 / 4;
  overflow: hidden;
}

/* The processing zone: still, with each row sliding into it and on down */
.column-ingest::before {
  content: "";
  position: absolute;
  inset: 0 0 auto;
  height: var(--row-height);
  background-color: color-mix(in srgb, var(--accent-400), transparent 90%);
  box-shadow: inset 2px 0 var(--accent-400);
}

.column-ingest .stream {
  position: absolute;
  inset: 0;
  gap: var(--row-gap);
}

.column-validate {
  display: contents;
}

.checking {
  grid-column: 3;
  grid-row: 2;
}

.checks {
  grid-column: 3;
  grid-row: 3;
}

.pass-rate {
  grid-column: 3;
  grid-row: 4;
}

.column-write {
  grid-column: 5;
  grid-row: 2 / 4;
}

/* Spread over the column's height, so the last day lines up with the last check */
.column-write .partitions {
  flex: 1;
  justify-content: space-between;
}

.stream,
.partitions,
.checks {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.375em;
  list-style: none;
}

.visual {
  --row-height: 1.75em;
  --row-gap: 0.25em;
}

/* Whole rows fade with their place in the stream, so none is ever cut off at the bottom */
.row {
  --fade: 1;
  --dim: 1;
  display: grid;
  flex-shrink: 0;
  align-items: center;
  height: var(--row-height);
  opacity: calc(var(--fade) * var(--dim));
  grid-template-columns: 2.25rem minmax(0, 1fr);
  gap: 0.5rem;
  /* Inset, so the current row's highlight stays inside the column */
  padding: 0 0.375rem;
  white-space: nowrap;
  transition: opacity 0.4s ease;
}

.row:nth-child(5) {
  --fade: 0.55;
}

.row:nth-child(6) {
  --fade: 0.25;
}

.row:nth-child(n + 7) {
  --fade: 0;
}

.key {
  color: var(--text-muted);
  transition: color 0.4s ease;
}

.event {
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--neutral-300);
}

/* Quarantined rows are struck out of the stream */
.row.failed .key {
  color: var(--danger-400);
}

.row.failed .event {
  color: var(--text-muted);
  text-decoration: line-through;
}

/* The row in the zone is the one in validation; if it fails, it's struck only once the verdict shows */
.row:first-child:not(.failed) .key {
  color: var(--accent-300);
}

.row.failed:first-child .key {
  animation: caught-key 0.25s ease 0.45s backwards;
}

.row.failed:first-child .event {
  animation: caught-event 0.25s ease 0.45s backwards;
}

@keyframes caught-key {
  from {
    color: var(--accent-300);
  }
}

@keyframes caught-event {
  from {
    color: var(--neutral-300);
    text-decoration-color: transparent;
  }
}

.row.dimmed {
  --dim: 0.25;
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

/* The row being checked and its verdict, revealed as it reaches validation */
.checking {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  white-space: nowrap;
  color: var(--neutral-300);
}

.verdict {
  color: var(--success-400);
  animation: reveal 0.25s ease 0.45s backwards;
}

.verdict.failed {
  color: var(--danger-400);
}

@keyframes reveal {
  from {
    opacity: 0;
  }
}

.check {
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr);
  align-items: center;
  gap: 0.5rem;
  padding: 0.4em 0.6em;
  border: 1px solid var(--neutral-800);
  /* Fixed, so a gate showing a reason doesn't grow and shift the columns */
  font-size: 0.85em;
  line-height: 1.6em;
  cursor: default;
  transition: border-color 0.3s ease, background-color 0.3s ease;
}

.check:hover {
  border-color: var(--neutral-600);
}

.check-name {
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

/* The gate that catches a row flashes with its reason */
.check.caught {
  border-color: color-mix(in srgb, var(--danger-400), transparent 40%);
  background-color: color-mix(in srgb, var(--danger-400), transparent 92%);
  transition-delay: 0.45s;
}

.check.caught .check-dot {
  background-color: var(--danger-400);
  transition-delay: 0.45s;
}

.check-reason {
  overflow: hidden;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--danger-400);
  animation: reveal 0.25s ease 0.45s backwards;
}

.pass-rate {
  display: flex;
  justify-content: space-between;
  padding-top: 0.5em;
  border-top: 1px solid var(--neutral-800);
}

.pass-rate-value {
  font-variant-numeric: tabular-nums;
  color: var(--success-400);
}

.partition {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.375em 0.75em;
  white-space: nowrap;
}

/* Date and state on their own line, so every day's bar has the same length */
.partition-head {
  grid-column: 1 / -1;
  display: flex;
  justify-content: space-between;
  gap: 0.75em;
}

.partition-date {
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--neutral-400);
}

.partition-state {
  color: var(--success-400);
}

.partition.writing .partition-state {
  color: var(--accent-300);
  animation: pulse 1.2s ease-in-out infinite;
}

/* Progress through the day, not a measurement */
.partition-track {
  height: 0.4em;
  background-color: var(--neutral-800);
}

.partition-count {
  width: 5ch;
  text-align: right;
  font-size: 0.85em;
  font-variant-numeric: tabular-nums;
  color: var(--text-muted);
}

/* Lands as the row arrives from validation */
.partition-fill {
  display: block;
  height: 100%;
  background-color: var(--neutral-500);
  transition: width 0.3s ease 0.85s, background-color 0.6s ease;
}

.partition.writing .partition-fill {
  background-color: var(--accent-400);
}

/* A finished day turns green, then settles into the sealed days below */
.partition.sealed:first-child .partition-fill {
  animation: sealed 2.2s ease forwards;
}

.partition.sealed:first-child .partition-state {
  animation: pop 0.4s ease 0.85s backwards;
}

@keyframes sealed {
  0%,
  20% {
    background-color: var(--accent-400);
  }

  40%,
  70% {
    background-color: var(--success-400);
  }

  100% {
    background-color: var(--neutral-500);
  }
}

@keyframes pop {
  from {
    opacity: 0;
    scale: 0.4;
  }
}

/* The next day slides in on top; the oldest falls away */
.partition-enter-active,
.partition-move {
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.partition-leave-active {
  position: absolute;
  width: 100%;
  transition: opacity 0.3s ease;
}

.partition-enter-from {
  opacity: 0;
  transform: translateY(-0.5rem);
}

.partition-leave-to {
  opacity: 0;
}

/* Narrow screens stack the stages, each header above its own column */
@media (max-width: 40rem) {
  .pipeline {
    grid-template-columns: minmax(0, 1fr);
  }

  .flow {
    display: none;
  }

  .pipeline > *,
  .column-validate > * {
    grid-column: 1;
    grid-row: auto;
  }

  .stage-ingest {
    order: 1;
  }

  .column-ingest {
    order: 2;
    /* The six shown rows */
    height: calc(6 * var(--row-height) + 5 * var(--row-gap));
  }

  .stage-validate {
    order: 3;
  }

  .checking {
    order: 4;
  }

  .checks {
    order: 5;
  }

  .pass-rate {
    order: 6;
  }

  .stage-write {
    order: 7;
  }

  .column-write {
    order: 8;
  }

  .column-write .partitions {
    gap: 0.375em;
  }
}
</style>
