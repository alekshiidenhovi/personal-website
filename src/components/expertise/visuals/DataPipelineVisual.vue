<script setup lang="ts">
import { computed, reactive } from 'vue';
import { useLiveTicker } from '../../../composables/useLiveTicker';
import StatusBadge from '../StatusBadge.vue';
import {
  advancePipelineJob,
  BATCH_SIZE,
  BATCHES_PER_DAY,
  CHECKS,
  countFailures,
  createPipelineJob,
  FAILURE_REASONS,
  formatPartitionDate,
  getCheckState,
  SEAL_HOLD_MS,
} from './dataPipelineJob';

/** A miniature micro-batch pipeline job (see dataPipelineJob), its stages as columns, each on its own batch. */
interface Props {
  /** Whether the visual is in view, so it plays. */
  active: boolean;
}
const props = defineProps<Props>();

type JobStatus = 'running' | 'sealing' | 'idle';

/** The clock the stages run on; fine enough that each keeps its own pace. */
const TICK_MS = 100;
const STATUS_TONES = { running: 'active', sealing: 'success', idle: 'idle' } as const;

const job = reactive(createPipelineJob());

const isValidated = computed(() => job.validating.checksDone === CHECKS.length);
const passedInBatch = computed(() => job.validating.rows.filter((row) => !row.failedCheck).length);
const passRate = computed(() => ((job.passedRows / job.checkedRows) * 100).toFixed(1));
const isTodayFull = computed(() => job.partitions[0].writtenBatches === BATCHES_PER_DAY);
const status = computed<JobStatus>(() => {
  if (!props.active) {
    return 'idle';
  }
  return isTodayFull.value ? 'sealing' : 'running';
});

/**
 * Checks whether a partition is still being written, rather than sealed.
 *
 * @param index The partition's index, newest first.
 * @returns Whether it is being written.
 */
function isWriting(index: number): boolean {
  return index === 0 && !isTodayFull.value;
}

useLiveTicker(() => props.active, () => advancePipelineJob(job, TICK_MS), TICK_MS);
</script>

<template>
  <div class="visual" :style="{ '--batch-size': BATCH_SIZE, '--seal-duration': `${SEAL_HOLD_MS}ms` }">
    <div class="header">
      <StatusBadge :label="status" :tone="STATUS_TONES[status]" color="accent" />
      <span>job events_daily</span>
    </div>

    <!-- The job's stages as columns, each on its own batch; an arrow lights up as a batch is handed over -->
    <div class="pipeline">
      <span class="stage stage-ingest">ingest</span>
      <span class="flow" aria-hidden="true"><span :key="job.cutCount" :class="{ lit: job.cutCount }">→</span></span>
      <span class="stage stage-validate">validate</span>
      <span class="flow" aria-hidden="true"><span :key="job.writeCount" :class="{ lit: job.writeCount }">→</span></span>
      <span class="stage stage-write">write</span>

      <p class="batch-head ingest-head">
        <span>batch {{ job.ingesting.id }}</span>
        <span class="batch-fill">{{ job.ingesting.rows.length }}/{{ BATCH_SIZE }}</span>
      </p>
      <section class="column column-ingest">
        <TransitionGroup name="row" tag="ol" class="stream">
          <li v-for="row in job.ingesting.rows" :key="row.id" class="row">
            <span class="key">{{ row.key }}</span>
            <span class="event">{{ row.event }}</span>
          </li>
        </TransitionGroup>
      </section>

      <section class="column column-validate">
        <p class="batch-head validate-head">
          <span>batch {{ job.validating.id }}</span>
          <!-- Keyed by the verdict, so each one fades in -->
          <span :key="String(isValidated)" class="verdict" :class="{ done: isValidated }">
            {{ isValidated ? `${passedInBatch}/${job.validating.rows.length} passed` : 'checking' }}
          </span>
        </p>
        <ul class="checks">
          <li v-for="(check, index) in CHECKS" :key="check" class="check"
            :class="getCheckState(job.validating, index)">
            <span class="check-dot"></span>
            <span class="check-name">{{ check }}</span>
            <span v-if="getCheckState(job.validating, index) === 'caught'" class="check-reason">
              {{ countFailures(job.validating, check) }} {{ FAILURE_REASONS[check] }}
            </span>
          </li>
        </ul>
        <p class="pass-rate">pass rate <span class="pass-rate-value">{{ passRate }}%</span></p>
      </section>

      <section class="column column-write">
        <TransitionGroup name="partition" tag="ol" class="partitions">
          <li v-for="(partition, index) in job.partitions" :key="partition.dayOffset" class="partition"
            :class="isWriting(index) ? 'writing' : 'sealed'">
            <span class="partition-head">
              <span class="partition-date">date={{ formatPartitionDate(partition.dayOffset) }}</span>
              <span class="partition-state">{{ isWriting(index) ? 'writing' : '✓' }}</span>
            </span>
            <span class="partition-track">
              <span class="partition-fill"
                :style="{ width: `${(partition.writtenBatches / BATCHES_PER_DAY) * 100}%` }"></span>
            </span>
            <span class="partition-count">{{ partition.writtenBatches }}/{{ BATCHES_PER_DAY }}</span>
          </li>
        </TransitionGroup>
      </section>
    </div>
  </div>
</template>

<style scoped>
@import "../../../styles/media.css";

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

/* The stage headers over their columns, joined by arrows */
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
 * The parts of each column sit on the pipeline's own rows: the batch heads line up, and the ingest slots and the
 * days span down past the checks.
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
@media (--below-sm) {
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
