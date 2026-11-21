/**
 * @fileoverview The daily ticket volumes behind the ticket dashboard, drawn to illustrate rather than measure.
 * Topics aren't predefined classes but clusters found in the ticket text, so new ones can emerge. Volumes trend
 * over time, and now and then a topic spikes: a sudden surge, flagged as an anomaly against its own recent
 * baseline, which is what makes watching the topics worthwhile.
 */

import { clamp, pickRandomItem, type Vector } from '../../../lib/math';
import { formatPoints } from '../../../lib/svg';

/** A support topic, as found by clustering the tickets. */
export interface Topic {
  readonly name: string;
  readonly color: string;
  /** The topic's typical relative volume. */
  readonly level: number;
  /** Whether the topic was found only recently: flat at first, then rising. */
  readonly isEmerging: boolean;
}

/** A spike under way: its topic, and how far through its shape it is. */
export interface Spike {
  readonly topic: string;
  readonly step: number;
}

/**
 * Where a topic is heading: newly found, spiking within the last week, or the last week busier or quieter than the
 * week before.
 */
export type TopicTrend = 'new' | 'spike' | 'rising' | 'falling';

/** A topic's row in the dashboard. */
export interface TopicRow extends Topic {
  /** The volume over the last week, relative to the busiest topic's. */
  readonly share: number;
  readonly trend: TopicTrend;
  /** The trend line's `points` attribute, on a 100 by 100 chart. */
  readonly trendPoints: string;
  /** The anomalies on the trend line, by day and chart position. */
  readonly anomalies: readonly { readonly day: number; readonly x: number; readonly y: number }[];
}

const TOPICS: readonly Topic[] = [
  { name: 'payments', color: 'var(--warning-400)', level: 0.66, isEmerging: false },
  { name: 'bugs', color: 'var(--warning-200)', level: 0.5, isEmerging: false },
  { name: 'account', color: 'var(--warning-600)', level: 0.36, isEmerging: false },
  { name: 'matchmaking', color: 'var(--neutral-400)', level: 0.24, isEmerging: false },
  { name: 'login loop', color: 'var(--neutral-100)', level: 0.3, isEmerging: true },
];
/** The days the trend shows. */
export const DAYS = 56;
/** The days an anomaly is compared against, and counts as recent within. */
export const BASELINE_DAYS = 7;

/** The day from which the emerging topic starts to rise. */
const EMERGES_AT = 38;
/** A spike's shape over consecutive days, as a share of its height. */
const SPIKE_SHAPE = [0.55, 1, 0.7, 0.4, 0.2];
const SPIKE_HEIGHT = 0.34;
const SPIKE_CHANCE_PER_DAY = 0.07;
/** Spikes already in the history, so the still view shows them too: the first day of each, by topic. */
const PAST_SPIKES: Readonly<Record<string, number>> = { bugs: 22, account: 44 };
/** How far above its topic's average over the previous week a day must peak to be an anomaly. */
const ANOMALY_THRESHOLD = 0.2;
const MIN_VOLUME = 0.03;
const MAX_VOLUME = 0.95;

/**
 * Gets the next day's volume of a topic: drifting towards its typical level, with some noise.
 *
 * @param previous The previous day's volume.
 * @param level The volume to drift towards.
 * @returns The volume.
 */
function getNextVolume(previous: number, level: number): number {
  return clamp(previous + (level - previous) * 0.15 + (Math.random() - 0.5) * 0.08, MIN_VOLUME, MAX_VOLUME);
}

/**
 * Gets a topic's volume on a day of a spike.
 *
 * @param level The topic's typical level.
 * @param step The day of the spike, from 0.
 * @returns The volume.
 */
function getSpikeVolume(level: number, step: number): number {
  return clamp(level + SPIKE_HEIGHT * SPIKE_SHAPE[step] + (Math.random() - 0.5) * 0.04, MIN_VOLUME, MAX_VOLUME);
}

/**
 * Creates a topic's history of daily volumes, with its past spike if it had one.
 *
 * @param topic The topic.
 * @returns The volumes, oldest first.
 */
function createHistory({ name, level, isEmerging }: Topic): number[] {
  const volumes: number[] = [];
  const spikeStart = PAST_SPIKES[name] ?? Number.POSITIVE_INFINITY;
  for (let day = 0; day < DAYS; day++) {
    const spikeStep = day - spikeStart;
    if (spikeStep >= 0 && spikeStep < SPIKE_SHAPE.length) {
      volumes.push(getSpikeVolume(level, spikeStep));
      continue;
    }
    const target = isEmerging && day < EMERGES_AT ? MIN_VOLUME : level;
    volumes.push(getNextVolume(volumes[day - 1] ?? target, target));
  }
  return volumes;
}

/**
 * Creates every topic's history.
 *
 * @returns The volumes by topic name.
 */
export function createHistories(): Record<string, number[]> {
  return Object.fromEntries(TOPICS.map((topic) => [topic.name, createHistory(topic)]));
}

/**
 * Moves every topic's history on a day, continuing the spike under way, or maybe starting one.
 *
 * @param histories The volumes by topic name, updated in place.
 * @param spike The spike under way, if any.
 * @returns The spike under way after this day, if any.
 */
export function advanceDay(histories: Record<string, number[]>, spike: Spike | undefined): Spike | undefined {
  for (const topic of TOPICS) {
    const volumes = histories[topic.name];
    const next =
      spike?.topic === topic.name
        ? getSpikeVolume(topic.level, spike.step)
        : getNextVolume(volumes[volumes.length - 1], topic.level);
    histories[topic.name] = [...volumes.slice(1), next];
  }
  if (spike) {
    const step = spike.step + 1;
    return step < SPIKE_SHAPE.length ? { topic: spike.topic, step } : undefined;
  }
  if (Math.random() < SPIKE_CHANCE_PER_DAY) {
    return { topic: pickRandomItem(TOPICS.filter((topic) => !topic.isEmerging)).name, step: 0 };
  }
  return undefined;
}

/**
 * Sums volumes.
 *
 * @param volumes The volumes.
 * @returns Their sum.
 */
function sumVolumes(volumes: readonly number[]): number {
  return volumes.reduce((total, volume) => total + volume, 0);
}

/**
 * Finds the days that peak well above the previous week's average.
 *
 * @param volumes A topic's volumes, oldest first.
 * @returns The anomalous days.
 */
function findAnomalies(volumes: readonly number[]): number[] {
  return volumes.flatMap((volume, day) => {
    if (day < BASELINE_DAYS) {
      return [];
    }
    const baseline = sumVolumes(volumes.slice(day - BASELINE_DAYS, day)) / BASELINE_DAYS;
    const isPeak = volume >= volumes[day - 1] && volume >= (volumes[day + 1] ?? 0);
    return isPeak && volume - baseline > ANOMALY_THRESHOLD ? [day] : [];
  });
}

/**
 * Places a day's volume on the trend chart.
 *
 * @param day The day.
 * @param volume The volume.
 * @returns The position, on a 100 by 100 chart.
 */
function getChartPosition(day: number, volume: number): Vector {
  return [(day / (DAYS - 1)) * 100, 100 - volume * 100];
}

/**
 * Gets where a topic is heading.
 *
 * @param topic The topic.
 * @param volumes The topic's volumes, oldest first.
 * @param anomalies The topic's anomalous days.
 * @returns The trend.
 */
function getTrend(topic: Topic, volumes: readonly number[], anomalies: readonly number[]): TopicTrend {
  if (topic.isEmerging) {
    return 'new';
  }
  if (anomalies.some((day) => day >= DAYS - BASELINE_DAYS)) {
    return 'spike';
  }
  const lastWeek = sumVolumes(volumes.slice(-BASELINE_DAYS));
  const weekBefore = sumVolumes(volumes.slice(-2 * BASELINE_DAYS, -BASELINE_DAYS));
  return lastWeek >= weekBefore ? 'rising' : 'falling';
}

/**
 * Ranks the topics by their volume over the last week, for the dashboard's rows.
 *
 * @param histories The volumes by topic name.
 * @returns The rows, busiest first.
 */
export function rankTopics(histories: Readonly<Record<string, readonly number[]>>): TopicRow[] {
  const ranked = TOPICS.map((topic) => {
    const volumes = histories[topic.name];
    const lastWeek = sumVolumes(volumes.slice(-BASELINE_DAYS));
    const anomalies = findAnomalies(volumes);
    return {
      ...topic,
      lastWeek,
      trend: getTrend(topic, volumes, anomalies),
      trendPoints: formatPoints(volumes.map((volume, day) => getChartPosition(day, volume))),
      anomalies: anomalies.map((day) => {
        const [x, y] = getChartPosition(day, volumes[day]);
        return { day, x, y };
      }),
    };
  }).sort((a, b) => b.lastWeek - a.lastWeek);
  const busiest = Math.max(...ranked.map((row) => row.lastWeek));
  return ranked.map(({ lastWeek, ...row }) => ({ ...row, share: lastWeek / busiest }));
}
