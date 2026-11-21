/**
 * @fileoverview A miniature micro-batch pipeline job, drawn to illustrate rather than measure. Its three stages run
 * at their own pace, each on a different batch: events arrive in ingest at an irregular rate until the batch is
 * full, the batch before it runs through the data quality checks in validate, and each checked batch is appended to
 * the day's partition in write. A full day is sealed, and the next batch starts a new one.
 */

import { pickRandomItem } from '../../../lib/math';

/** A data quality check run on every batch. */
export type Check = 'schema' | 'not-null' | 'unique' | 'freshness';

/** Where a check stands for the batch in validate. */
export type CheckState = 'pending' | 'running' | 'passed' | 'caught';

/** An event in the stream. */
export interface StreamRow {
  readonly id: number;
  readonly key: string;
  readonly event: string;
  /** The check the row fails, found out only in validate. */
  readonly failedCheck: Check | undefined;
}

/** The batch being filled in ingest. */
export interface IngestingBatch {
  readonly id: number;
  readonly rows: StreamRow[];
}

/** The batch in validate. */
export interface ValidatingBatch {
  readonly id: number;
  readonly rows: readonly StreamRow[];
  checksDone: number;
  isWritten: boolean;
}

/** A day's partition in write. */
export interface Partition {
  /** Days from today. */
  readonly dayOffset: number;
  writtenBatches: number;
}

/** The job's state, advanced tick by tick. */
export interface PipelineJob {
  ingesting: IngestingBatch;
  validating: ValidatingBatch;
  /** Newest first; the first is the day being written. */
  partitions: Partition[];
  /** Counted over the whole job, so the pass rate holds steady rather than jumping. */
  checkedRows: number;
  passedRows: number;
  /** Batches handed from ingest to validate, keying an arrow so it lights up once per handoff. */
  cutCount: number;
  /** Batches handed from validate to write. */
  writeCount: number;
  clockMs: number;
  nextArrivalMs: number;
  nextCheckMs: number;
  /** When the full batch in ingest is handed on, or undefined while it fills. */
  cutMs: number | undefined;
  /** When the next day starts, or undefined while the current one is still being written. */
  nextDayMs: number | undefined;
}

export const CHECKS: readonly Check[] = ['schema', 'not-null', 'unique', 'freshness'];
export const FAILURE_REASONS: Readonly<Record<Check, string>> = {
  schema: 'bad type',
  'not-null': 'missing field',
  unique: 'duplicate',
  freshness: 'late',
};
/** A batch is cut when full, so every write is the same size. */
export const BATCH_SIZE = 6;
export const BATCHES_PER_DAY = 8;
/** How long a full day shows as sealed before the next day starts. */
export const SEAL_HOLD_MS = 1600;

/** The shortest and longest gap between arriving events, so ingest has an irregular pace. */
const ARRIVAL_GAP_MS = { min: 400, max: 800 };
/** How long a full batch is shown before it's handed to validate. */
const FULL_HOLD_MS = 600;
/** The time each check takes, and the pause after the last before the batch is written. */
const CHECK_MS = 400;
const PARTITION_COUNT = 4;
const FAILURE_RATE = 0.12;
const EVENTS = ['ticket.created', 'message.sent', 'ticket.updated', 'ticket.closed'];
/** The first day written: recent, but far enough back that the loop stays in the past. */
const FIRST_DAY_OFFSET = -14;
/** Rows counted as checked before the job starts, standing in for earlier days. */
const SEED_CHECKED_ROWS = 500;
const DAY_MS = 86_400_000;

let nextRowId = 0;

/**
 * Creates an event arriving in the stream, which may fail a check.
 *
 * @returns The row.
 */
function createRow(): StreamRow {
  return {
    id: nextRowId++,
    key: Math.floor(Math.random() * 0xffff)
      .toString(16)
      .padStart(4, '0'),
    event: pickRandomItem(EVENTS),
    failedCheck: Math.random() < FAILURE_RATE ? pickRandomItem(CHECKS) : undefined,
  };
}

/**
 * Creates several rows.
 *
 * @param count How many rows.
 * @returns The rows.
 */
function createRows(count: number): StreamRow[] {
  return Array.from({ length: count }, () => createRow());
}

/**
 * Picks when the next event arrives.
 *
 * @param nowMs The job's clock.
 * @returns The arrival time.
 */
function scheduleArrival(nowMs: number): number {
  return nowMs + ARRIVAL_GAP_MS.min + Math.random() * (ARRIVAL_GAP_MS.max - ARRIVAL_GAP_MS.min);
}

/**
 * Creates a job mid-run, so the still frame shown with reduced motion reads on its own.
 *
 * @returns The job.
 */
export function createPipelineJob(): PipelineJob {
  return {
    ingesting: { id: 43, rows: createRows(3) },
    validating: { id: 42, rows: createRows(BATCH_SIZE), checksDone: CHECKS.length, isWritten: true },
    partitions: Array.from({ length: PARTITION_COUNT }, (_, index) => ({
      dayOffset: FIRST_DAY_OFFSET - index,
      writtenBatches: index > 0 ? BATCHES_PER_DAY : 3,
    })),
    checkedRows: SEED_CHECKED_ROWS,
    passedRows: Math.round(SEED_CHECKED_ROWS * (1 - FAILURE_RATE)),
    cutCount: 0,
    writeCount: 0,
    clockMs: 0,
    nextArrivalMs: scheduleArrival(0),
    nextCheckMs: 0,
    cutMs: undefined,
    nextDayMs: undefined,
  };
}

/**
 * Starts the next day's partition on top; the oldest falls away.
 *
 * @param job The job.
 */
function startNextDay(job: PipelineJob) {
  job.nextDayMs = undefined;
  job.partitions = [{ dayOffset: job.partitions[0].dayOffset + 1, writtenBatches: 0 }, ...job.partitions.slice(0, -1)];
}

/**
 * Adds an arriving event to the batch in ingest; once full, the batch is held a moment before it's handed on.
 *
 * @param job The job.
 */
function receiveEvent(job: PipelineJob) {
  job.ingesting.rows.push(createRow());
  if (job.ingesting.rows.length === BATCH_SIZE) {
    job.cutMs = job.clockMs + FULL_HOLD_MS;
  }
}

/**
 * Hands the full batch to validate, and starts the next in ingest.
 *
 * @param job The job.
 */
function cutBatch(job: PipelineJob) {
  const { id, rows } = job.ingesting;
  job.cutMs = undefined;
  job.validating = { id, rows, checksDone: 0, isWritten: false };
  job.ingesting = { id: id + 1, rows: [] };
  job.cutCount++;
  job.nextCheckMs = job.clockMs + CHECK_MS;
}

/**
 * Runs the batch in validate through its next check, or writes it once every check is done.
 *
 * @param job The job.
 */
function advanceValidation(job: PipelineJob) {
  const batch = job.validating;
  if (batch.isWritten) {
    return;
  }
  job.nextCheckMs = job.clockMs + CHECK_MS;
  if (batch.checksDone < CHECKS.length) {
    batch.checksDone++;
    if (batch.checksDone === CHECKS.length) {
      job.checkedRows += batch.rows.length;
      job.passedRows += batch.rows.filter((row) => !row.failedCheck).length;
    }
    return;
  }
  batch.isWritten = true;
  job.writeCount++;
  // A write never lands on a sealed day, even if it comes before the next day has started
  if (job.nextDayMs !== undefined) {
    startNextDay(job);
  }
  job.partitions[0].writtenBatches++;
  if (job.partitions[0].writtenBatches === BATCHES_PER_DAY) {
    job.nextDayMs = job.clockMs + SEAL_HOLD_MS;
  }
}

/**
 * Advances the job's clock, running each stage that is due.
 *
 * @param job The job.
 * @param tickMs How far to advance, in milliseconds.
 */
export function advancePipelineJob(job: PipelineJob, tickMs: number) {
  job.clockMs += tickMs;
  if (job.cutMs !== undefined && job.clockMs >= job.cutMs) {
    cutBatch(job);
    job.nextArrivalMs = scheduleArrival(job.clockMs);
  } else if (job.cutMs === undefined && job.clockMs >= job.nextArrivalMs) {
    receiveEvent(job);
    job.nextArrivalMs = scheduleArrival(job.clockMs);
  }
  if (job.clockMs >= job.nextCheckMs) {
    advanceValidation(job);
  }
  if (job.nextDayMs !== undefined && job.clockMs >= job.nextDayMs) {
    startNextDay(job);
  }
}

/**
 * Counts the rows of a batch that fail a check.
 *
 * @param batch The batch.
 * @param check The check.
 * @returns The number of failing rows.
 */
export function countFailures(batch: ValidatingBatch, check: Check): number {
  return batch.rows.filter((row) => row.failedCheck === check).length;
}

/**
 * Gets where a check stands for the batch in validate.
 *
 * @param batch The batch.
 * @param index The check's index.
 * @returns The check's state.
 */
export function getCheckState(batch: ValidatingBatch, index: number): CheckState {
  if (index < batch.checksDone) {
    return countFailures(batch, CHECKS[index]) > 0 ? 'caught' : 'passed';
  }
  return index === batch.checksDone ? 'running' : 'pending';
}

/**
 * Formats a partition's date.
 *
 * @param dayOffset Days from today.
 * @returns The date as `YYYY-MM-DD`.
 */
export function formatPartitionDate(dayOffset: number): string {
  return new Date(Date.now() + dayOffset * DAY_MS).toISOString().slice(0, 10);
}
