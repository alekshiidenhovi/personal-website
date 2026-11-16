<script setup lang="ts">
import { computed, ref, toRef } from "vue";
import { useLiveTicker } from "../composables/useLiveTicker";
import StatusBadge from "./StatusBadge.vue";

/**
 * A miniature micro-batch pipeline job, drawn to illustrate rather than
 * measure. Its three stages run at their own pace, each on a different batch:
 * events arrive in ingest at an irregular rate until the batch is full, the
 * batch before it runs through the data quality checks in validate, and each
 * checked batch is appended to the day's partition in write. A full day is
 * sealed, and the next batch starts a new one.
 */

type Check = "schema" | "not-null" | "unique" | "freshness";

interface StreamRow {
  id: number;
  key: string;
  event: string;
  /** The check the row fails, found out only in validate */
  failed: Check | null;
}

interface Batch {
  id: number;
  rows: StreamRow[];
}

interface Validation extends Batch {
  checksDone: number;
  written: boolean;
}

interface Day {
  /** Days from today */
  offset: number;
  /** Batches written */
  written: number;
}

/** The clock the stages run on; fine enough that each keeps its own pace */
const TICK_MS = 100;
/** Gap between arriving events, drawn at random so ingest has an irregular pace */
const ARRIVAL_MS = [400, 800] as const;
/** A batch is cut when full, so every write is the same size */
const BATCH_SIZE = 6;
/** How long a full batch is shown before it's handed to validate */
const FULL_HOLD_MS = 600;
/** Time each check takes, and the pause after the last before the batch is written */
const STEP_MS = 400;
const BATCHES_PER_DAY = 8;
/** How long a full day shows as sealed before the next day starts */
const SEAL_HOLD_MS = 1600;
const PARTITION_COUNT = 4;
const FAILURE_RATE = 0.12;
const EVENTS = ["ticket.created", "message.sent", "ticket.updated", "ticket.closed"];
const CHECKS: Check[] = ["schema", "not-null", "unique", "freshness"];
const FAILURE_REASONS: Record<Check, string> = {
  schema: "bad type",
  "not-null": "missing field",
  unique: "duplicate",
  freshness: "late",
};
/** The first day written; recent, but far enough back that the loop stays in the past */
const FIRST_DAY_OFFSET = -14;

const randomItem = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];
const randomBetween = ([min, max]: readonly [number, number]) => min + Math.random() * (max - min);
const randomKey = () => Math.floor(Math.random() * 0xffff).toString(16).padStart(4, "0");
const formatDate = (dayOffset: number) => new Date(Date.now() + dayOffset * 86_400_000).toISOString().slice(0, 10);

let nextRowId = 0;
const createRow = (): StreamRow => ({
  id: nextRowId++,
  key: randomKey(),
  event: randomItem(EVENTS),
  failed: Math.random() < FAILURE_RATE ? randomItem(CHECKS) : null,
});
const createRows = (count: number) => Array.from({ length: count }, createRow);

interface Props {
  /** Whether the visual is playing */
  active: boolean;
}
const props = defineProps<Props>();

// Starts mid-run, so the still frame shown with reduced motion reads on its own
const ingesting = ref<Batch>({ id: 43, rows: createRows(3) });
const validating = ref<Validation>({ id: 42, rows: createRows(BATCH_SIZE), checksDone: CHECKS.length, written: true });
/** Newest first; the first is the day being written */
const days = ref<Day[]>(
  Array.from({ length: PARTITION_COUNT }, (_, index) => ({
    offset: FIRST_DAY_OFFSET - index,
    written: index ? BATCHES_PER_DAY : 3,
  })),
);
/** Counted over the whole job and seeded with earlier days, so the rate holds steady rather than jumping */
const SEED_CHECKED = 500;
const checked = ref(SEED_CHECKED);
const passed = ref(Math.round(SEED_CHECKED * (1 - FAILURE_RATE)));
/** Handoffs so far, keying each arrow so it lights up once per handoff */
const cuts = ref(0);
const writes = ref(0);

let clock = 0;
let nextArrivalAt = randomBetween(ARRIVAL_MS);
let nextStepAt = 0;
let cutAt: number | null = null;
let nextDayAt: number | null = null;

/** Starts the next day on top; the oldest falls away */
const startNextDay = () => {
  nextDayAt = null;
  days.value = [{ offset: days.value[0].offset + 1, written: 0 }, ...days.value.slice(0, PARTITION_COUNT - 1)];
};

/** An event joins the batch in ingest; once full, the batch is held for a moment before the cut */
const arrive = () => {
  const batch = ingesting.value;
  batch.rows.push(createRow());
  if (batch.rows.length === BATCH_SIZE) cutAt = clock + FULL_HOLD_MS;
};

/** The full batch is handed to validate, and ingest starts the next */
const cut = () => {
  const batch = ingesting.value;
  cutAt = null;
  validating.value = { ...batch, checksDone: 0, written: false };
  ingesting.value = { id: batch.id + 1, rows: [] };
  cuts.value++;
  nextStepAt = clock + STEP_MS;
};

/** Runs the batch in validate through its checks one at a time, then writes it */
const advanceValidation = () => {
  const batch = validating.value;
  if (batch.written) return;
  nextStepAt = clock + STEP_MS;
  if (batch.checksDone < CHECKS.length) {
    if (++batch.checksDone === CHECKS.length) {
      checked.value += batch.rows.length;
      passed.value += batch.rows.filter((row) => !row.failed).length;
    }
    return;
  }
  batch.written = true;
  writes.value++;
  // A write never lands on a sealed day, even if it comes before the next day has started
  if (nextDayAt !== null) startNextDay();
  if (++days.value[0].written === BATCHES_PER_DAY) nextDayAt = clock + SEAL_HOLD_MS;
};

useLiveTicker(
  toRef(props, "active"),
  () => {
    clock += TICK_MS;
    if (cutAt !== null && clock >= cutAt) {
      cut();
      nextArrivalAt = clock + randomBetween(ARRIVAL_MS);
    } else if (cutAt === null && clock >= nextArrivalAt) {
      arrive();
      nextArrivalAt = clock + randomBetween(ARRIVAL_MS);
    }
    if (clock >= nextStepAt) advanceValidation();
    if (nextDayAt !== null && clock >= nextDayAt) startNextDay();
  },
  TICK_MS,
);

const validated = computed(() => validating.value.checksDone === CHECKS.length);
const passedInBatch = computed(() => validating.value.rows.filter((row) => !row.failed).length);
const failuresOf = (check: Check) => validating.value.rows.filter((row) => row.failed === check).length;
const checkState = (index: number) => {
  const { checksDone } = validating.value;
  if (index < checksDone) return failuresOf(CHECKS[index]) ? "caught" : "passed";
  return index === checksDone ? "running" : "pending";
};

const todayFull = computed(() => days.value[0].written === BATCHES_PER_DAY);
const status = computed(() => (props.active ? (todayFull.value ? "sealing" : "running") : "idle"));
const STATUS_TONE = { running: "active", sealing: "success", idle: "idle" } as const;
const partitionState = (index: number) => (index > 0 || todayFull.value ? "sealed" : "writing");
</script>

<template>
  <div class="visual" :class="{ running: props.active }"
    :style="{ '--batch-size': BATCH_SIZE, '--seal-duration': `${SEAL_HOLD_MS}ms` }">
    <div class="header">
      <StatusBadge :label="status" :tone="STATUS_TONE[status]" color="accent" />
      <span>job events_daily</span>
    </div>

    <!-- The job's stages as columns, each on its own batch; an arrow lights up as a batch is handed over -->
    <div class="pipeline">
      <span class="stage stage-ingest">ingest</span>
      <span class="flow" aria-hidden="true"><span :key="cuts" :class="{ lit: cuts }">→</span></span>
      <span class="stage stage-validate">validate</span>
      <span class="flow" aria-hidden="true"><span :key="writes" :class="{ lit: writes }">→</span></span>
      <span class="stage stage-write">write</span>

      <p class="batch-head ingest-head">
        <span>batch {{ ingesting.id }}</span>
        <span class="batch-fill">{{ ingesting.rows.length }}/{{ BATCH_SIZE }}</span>
      </p>
      <section class="column column-ingest">
        <TransitionGroup name="row" tag="ol" class="stream">
          <li v-for="row in ingesting.rows" :key="row.id" class="row">
            <span class="key">{{ row.key }}</span>
            <span class="event">{{ row.event }}</span>
          </li>
        </TransitionGroup>
      </section>

      <section class="column column-validate">
        <p class="batch-head validate-head">
          <span>batch {{ validating.id }}</span>
          <span :key="String(validated)" class="verdict" :class="{ done: validated }">
            {{ validated ? `${passedInBatch}/${validating.rows.length} passed` : "checking" }}
          </span>
        </p>
        <ul class="checks">
          <li v-for="(check, index) in CHECKS" :key="check" class="check" :class="checkState(index)">
            <span class="check-dot"></span>
            <span class="check-name">{{ check }}</span>
            <span v-if="checkState(index) === 'caught'" class="check-reason">
              {{ failuresOf(check) }} {{ FAILURE_REASONS[check] }}
            </span>
          </li>
        </ul>
        <p class="pass-rate">pass rate <span class="pass-rate-value">{{ ((passed / checked) * 100).toFixed(1) }}%</span></p>
      </section>

      <section class="column column-write">
        <TransitionGroup name="partition" tag="ol" class="partitions">
          <li v-for="(day, index) in days" :key="day.offset" class="partition" :class="partitionState(index)">
            <span class="partition-head">
              <span class="partition-date">date={{ formatDate(day.offset) }}</span>
              <span class="partition-state">{{ partitionState(index) === "writing" ? "writing" : "✓" }}</span>
            </span>
            <span class="partition-track">
              <span class="partition-fill" :style="{ width: `${(day.written / BATCHES_PER_DAY) * 100}%` }"></span>
            </span>
            <span class="partition-count">{{ day.written }}/{{ BATCHES_PER_DAY }}</span>
          </li>
        </TransitionGroup>
      </section>
    </div>
  </div>
</template>

<style scoped>
.visual {
  --row-height: 1.6em;
  --row-gap: 0.25em;
  --batch-height: calc(var(--batch-size) * var(--row-height) + (var(--batch-size) - 1) * var(--row-gap));
  /* How long a handoff takes: a batch leaving ingest, or a day's bar growing; its arrow is lit for the same */
  --handoff-duration: 0.3s;
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

@keyframes pulse {
  50% {
    opacity: 0.3;
  }
}

@keyframes reveal {
  from {
    opacity: 0;
  }
}

/* Stage headers over their columns, joined by arrows */
.pipeline {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 2rem minmax(0, 1fr) 2rem minmax(0, 1.15fr);
  row-gap: 0.75em;
}

.stage,
.flow {
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

/* Centered on the stage boxes */
.flow {
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  color: var(--neutral-600);
}

.flow .lit {
  animation: flash var(--handoff-duration) ease;
}

@keyframes flash {
  15%,
  85% {
    color: var(--accent-300);
    text-shadow: 0 0 0.5em var(--accent-400);
  }
}

/*
 * The parts of each column sit on the pipeline's own rows: the batch heads
 * line up, and the ingest slots and the days span down past the checks.
 */
.ingest-head,
.validate-head {
  grid-row: 2;
}

.ingest-head {
  grid-column: 1;
}

.column {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* One faint slot per event in a batch; laid over the column rather than sizing it */
.column-ingest {
  position: relative;
  grid-column: 1;
  grid-row: 3 / 5;
  background: repeating-linear-gradient(to bottom,
      color-mix(in srgb, var(--neutral-800), transparent 40%) 0 var(--row-height),
      transparent var(--row-height) calc(var(--row-height) + var(--row-gap))) top / 100% var(--batch-height) no-repeat;
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

.column-ingest .stream {
  position: absolute;
  inset: 0;
  gap: var(--row-gap);
}

.column-validate {
  display: contents;
}

.validate-head {
  grid-column: 3;
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

/* The batch each stage is working on */
.batch-head {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  white-space: nowrap;
  color: var(--neutral-300);
}

.batch-fill {
  font-variant-numeric: tabular-nums;
  color: var(--text-muted);
}

.row {
  display: grid;
  flex-shrink: 0;
  grid-template-columns: 2.25rem minmax(0, 1fr);
  align-items: center;
  gap: 0.5rem;
  height: var(--row-height);
  padding: 0 0.375rem;
  white-space: nowrap;
}

.key {
  color: var(--text-muted);
}

.event {
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--neutral-300);
}

/* Events drop into their slots one by one; a full batch leaves together, towards validate */
.row-enter-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.row-enter-from {
  opacity: 0;
  transform: translateY(-0.25rem);
}

.row-leave-active {
  transition: opacity var(--handoff-duration) ease, transform var(--handoff-duration) ease;
}

.row-leave-to {
  opacity: 0;
  transform: translateX(1rem);
}

.verdict {
  color: var(--text-muted);
  animation: reveal 0.25s ease;
}

.verdict.done {
  color: var(--success-400);
}

/* Checks run one at a time: pending, running, then passed or caught */
.check {
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr);
  align-items: center;
  gap: 0.5rem;
  padding: 0.4em 0.6em;
  border: 1px solid var(--neutral-800);
  /* Fixed, so a check showing a reason doesn't grow and shift the columns */
  font-size: 0.85em;
  line-height: 1.6em;
  transition: border-color 0.3s ease, background-color 0.3s ease, color 0.3s ease;
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

.check.pending {
  color: var(--neutral-600);
}

.check.pending .check-dot {
  background-color: var(--neutral-700);
}

.check.running {
  border-color: color-mix(in srgb, var(--accent-400), transparent 50%);
  color: var(--neutral-300);
}

.check.running .check-dot {
  background-color: var(--accent-400);
  animation: pulse 0.8s ease-in-out infinite;
}

.check.caught {
  border-color: color-mix(in srgb, var(--danger-400), transparent 40%);
  background-color: color-mix(in srgb, var(--danger-400), transparent 92%);
}

.check.caught .check-dot {
  background-color: var(--danger-400);
}

.check-reason {
  overflow: hidden;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--danger-400);
  animation: reveal 0.25s ease;
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
  animation: pulse-text 1.2s ease-in-out infinite;
}

/* A shallower pulse for text, which keeps WCAG AA contrast even at its faintest (5.4:1) */
@keyframes pulse-text {
  50% {
    opacity: 0.7;
  }
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

/* Grows as a batch is written, together with the count and the arrow into write */
.partition-fill {
  display: block;
  height: 100%;
  background-color: var(--neutral-500);
  transition: width var(--handoff-duration) ease, background-color 0.6s ease;
}

.partition.writing .partition-fill {
  background-color: var(--accent-400);
}

/* A finished day turns green, then settles into the sealed days below */
.partition.sealed:first-child .partition-fill {
  /* Lasts the seal hold, so it settles just as the next day starts */
  animation: sealed var(--seal-duration) ease forwards;
}

.partition.sealed:first-child .partition-state {
  animation: pop 0.4s ease backwards;
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
@media (width < 40rem) {
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

  .ingest-head {
    order: 2;
  }

  .column-ingest {
    order: 3;
    height: var(--batch-height);
  }

  .stage-validate {
    order: 4;
  }

  .validate-head {
    order: 5;
  }

  .checks {
    order: 6;
  }

  .pass-rate {
    order: 7;
  }

  .stage-write {
    order: 8;
  }

  .column-write {
    order: 9;
  }

  .column-write .partitions {
    gap: 0.375em;
  }
}
</style>
