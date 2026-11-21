/**
 * @fileoverview The simulation behind the hero's embedding space, in canvas-independent coordinates (0 to 1 on
 * both axes). Each cycle starts from the same raw scatter, trains it into new clusters, retrieves a query's
 * nearest neighbours, and dissolves back into the scatter.
 */

import { clamp, interpolate, pickRandomItem, pickWeightedIndex, sampleGaussian, type Vector } from '../../lib/math';
import { easeInOut } from '../../lib/motion';

/** One data point, and the path it takes through a cycle. */
export interface Point {
  /** Where the point sits in the raw scatter: the same every cycle, so each run starts and ends there. */
  readonly scatterPosition: Vector;
  /** Where training puts the point; new every cycle. */
  readonly trainedPosition: Vector;
  /** The index of the point's cluster, or undefined for an outlier. */
  readonly cluster: number | undefined;
  /** From 0 to 1: when the point starts moving during training, and again in the dissolve. */
  readonly delay: number;
  /** The phase of the point's idle drift, which it keeps whether scattered or trained, in radians. */
  readonly driftPhase: number;
  /** The point's size, relative to the others. */
  readonly radius: number;
}

/** A position just outside a cluster, and the points nearest to it. */
export interface Query {
  readonly position: Vector;
  /** The indexes of the nearest points, nearest first. */
  readonly neighbourIndexes: readonly number[];
}

/** One run of the loop: the points with their trained positions, and the query retrieving among them. */
export interface Cycle {
  readonly points: readonly Point[];
  readonly query: Query;
}

/** The phases of a cycle, in loop order. */
export const PHASES = [
  { name: 'raw', label: 'raw events', durationMs: 1800 },
  { name: 'train', label: 'training', durationMs: 5600 },
  { name: 'query', label: 'retrieval', durationMs: 4600 },
  { name: 'dissolve', label: 'next run', durationMs: 3600 },
] as const;

/** The name of a phase of the cycle. */
export type PhaseName = (typeof PHASES)[number]['name'];

/** Where the loop is at a moment in time. */
export interface Phase {
  readonly name: PhaseName;
  /** How far through the phase, from 0 to 1. */
  readonly progress: number;
  /** How long the phase has run, in milliseconds. */
  readonly elapsedMs: number;
}

/** The length of one cycle, in milliseconds. */
export const LOOP_MS = PHASES.reduce((total, phase) => total + phase.durationMs, 0);
/** The time in the cycle where the visual rests without motion: the end of the retrieval. */
export const RESTING_ELAPSED_MS = LOOP_MS - PHASES[PHASES.length - 1].durationMs - 1;

const POINT_COUNT = 420;
const CLUSTER_COUNT = 7;
const OUTLIER_SHARE = 0.06;
const NEIGHBOUR_COUNT = 8;
const TRAINING_STEPS = 24000;
/** How far a point drifts around its position, as a share of the canvas. */
const DRIFT_DISTANCE = 0.004;
/** The share of the training and dissolve phases over which the points' start times are spread. */
const STAGGER_SHARE = 0.45;
/** Keeps scattered points and outliers off the canvas's edges. */
const SCATTER_MARGIN = 0.04;
/** Keeps cluster centers far enough from the edges that their clusters fit. */
const CENTER_MARGIN = 0.16;
const MIN_CENTER_DISTANCE = 0.22;
const MAX_CENTER_ATTEMPTS = 500;
/** How far outside its cluster the query sits. */
const QUERY_OFFSET = 0.1;

/** The shape of a gaussian cluster: stretched along one axis, rotated, and weighted by how many points it gets. */
interface ClusterShape {
  readonly center: Vector;
  readonly angle: number;
  readonly spreadAlong: number;
  readonly spreadAcross: number;
  readonly weight: number;
}

/** Where training puts a point, and in which cluster. */
interface TrainedPlacement {
  readonly trainedPosition: Vector;
  readonly cluster: number | undefined;
}

/**
 * Measures the distance between two positions.
 *
 * @param from One position.
 * @param to The other position.
 * @returns The straight-line distance.
 */
function getDistance(from: Vector, to: Vector): number {
  return Math.hypot(from[0] - to[0], from[1] - to[1]);
}

/**
 * Picks a uniformly random position, away from the edges.
 *
 * @param margin The distance to keep from every edge.
 * @returns The position.
 */
function pickRandomPosition(margin: number): Vector {
  const range = 1 - 2 * margin;
  return [margin + Math.random() * range, margin + Math.random() * range];
}

/**
 * Places cluster centers spread apart, by rejection sampling.
 *
 * @returns The centers; fewer than the cluster count in the unlikely case that no more fit.
 */
function createClusterCenters(): Vector[] {
  const centers: Vector[] = [];
  for (let attempt = 0; centers.length < CLUSTER_COUNT && attempt < MAX_CENTER_ATTEMPTS; attempt++) {
    const candidate = pickRandomPosition(CENTER_MARGIN);
    if (centers.every((center) => getDistance(center, candidate) > MIN_CENTER_DISTANCE)) {
      centers.push(candidate);
    }
  }
  return centers;
}

/**
 * Creates a cluster of random orientation, spread and weight, so the clusters vary in shape and size.
 *
 * @param center The cluster's center.
 * @returns The cluster's shape.
 */
function createClusterShape(center: Vector): ClusterShape {
  return {
    center,
    angle: Math.random() * Math.PI,
    spreadAlong: 0.025 + Math.random() * 0.045,
    spreadAcross: 0.015 + Math.random() * 0.025,
    weight: 0.5 + Math.random(),
  };
}

/**
 * Samples a position from a cluster's gaussian distribution.
 *
 * @param shape The cluster's shape.
 * @returns The position.
 */
function samplePositionInCluster({ center, angle, spreadAlong, spreadAcross }: ClusterShape): Vector {
  const along = sampleGaussian() * spreadAlong;
  const across = sampleGaussian() * spreadAcross;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [center[0] + along * cos - across * sin, center[1] + along * sin + across * cos];
}

/**
 * Places every point in a new set of clusters, with a few left over as outliers.
 *
 * @returns The trained placement of each point, by index.
 */
function createTrainedPlacements(): TrainedPlacement[] {
  const shapes = createClusterCenters().map((center) => createClusterShape(center));
  const weights = shapes.map((shape) => shape.weight);
  return Array.from({ length: POINT_COUNT }, () => {
    if (Math.random() < OUTLIER_SHARE) {
      return { trainedPosition: pickRandomPosition(SCATTER_MARGIN), cluster: undefined };
    }
    const cluster = pickWeightedIndex(weights);
    return { trainedPosition: samplePositionInCluster(shapes[cluster]), cluster };
  });
}

/**
 * Finds the points whose trained positions are nearest to a position, leaving out any point exactly on it.
 *
 * @param points The points to search.
 * @param position The position to search around.
 * @param count How many points to find.
 * @returns The indexes of the nearest points, nearest first.
 */
function findNearestPointIndexes(points: readonly Point[], position: Vector, count: number): number[] {
  return points
    .map((point, index) => ({ index, distance: getDistance(point.trainedPosition, position) }))
    .filter(({ distance }) => distance > 0)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, count)
    .map(({ index }) => index);
}

/**
 * Places a query just outside a random cluster, so the links to its neighbours read as reaching in.
 *
 * @param points The trained points.
 * @returns The query and its nearest neighbours.
 */
function createQuery(points: readonly Point[]): Query {
  const clusteredPoints = points.filter((point) => point.cluster !== undefined);
  const anchor = pickRandomItem(clusteredPoints).trainedPosition;
  const angle = Math.random() * Math.PI * 2;
  const position: Vector = [
    clamp(anchor[0] + Math.cos(angle) * QUERY_OFFSET, SCATTER_MARGIN, 1 - SCATTER_MARGIN),
    clamp(anchor[1] + Math.sin(angle) * QUERY_OFFSET, SCATTER_MARGIN, 1 - SCATTER_MARGIN),
  ];
  return { position, neighbourIndexes: findNearestPointIndexes(points, position, NEIGHBOUR_COUNT) };
}

/**
 * Creates a cycle that trains towards new clusters. Each point's scatter position, drift and size carry over
 * from the previous cycle, so nothing jumps when a run restarts.
 *
 * @param previous The cycle that just ended, if any.
 * @returns The new cycle.
 */
export function createCycle(previous?: Cycle): Cycle {
  const points = createTrainedPlacements().map(({ trainedPosition, cluster }, index): Point => {
    const previousPoint = previous?.points[index];
    return {
      scatterPosition: previousPoint?.scatterPosition ?? pickRandomPosition(SCATTER_MARGIN),
      trainedPosition,
      cluster,
      delay: Math.random(),
      driftPhase: previousPoint?.driftPhase ?? Math.random() * Math.PI * 2,
      radius: previousPoint?.radius ?? 0.6 + Math.random() * 0.8,
    };
  });
  return { points, query: createQuery(points) };
}

/**
 * Finds where the loop is at a time in the cycle.
 *
 * @param elapsedMs The time since the cycle started, in milliseconds.
 * @returns The phase, how far through it, and how long it has run.
 */
export function getPhase(elapsedMs: number): Phase {
  let phaseStartMs = 0;
  for (const { name, durationMs } of PHASES) {
    if (elapsedMs < phaseStartMs + durationMs) {
      const phaseElapsedMs = elapsedMs - phaseStartMs;
      return { name, progress: phaseElapsedMs / durationMs, elapsedMs: phaseElapsedMs };
    }
    phaseStartMs += durationMs;
  }
  const lastPhase = PHASES[PHASES.length - 1];
  return { name: lastPhase.name, progress: 1, elapsedMs: lastPhase.durationMs };
}

/**
 * Gets how far a point has trained, from its scatter position towards its trained position.
 *
 * @param point The point.
 * @param phase Where the loop is.
 * @returns 0 while scattered, 1 once trained.
 */
export function getTrainedAmount(point: Point, phase: Phase): number {
  // Each point moves in its own window of the phase, so the points don't set off or land all at once
  const moved = easeInOut(clamp((phase.progress - point.delay * STAGGER_SHARE) / (1 - STAGGER_SHARE), 0, 1));
  switch (phase.name) {
    case 'raw':
      return 0;
    case 'train':
      return moved;
    case 'query':
      return 1;
    case 'dissolve':
      return 1 - moved;
    default:
      throw new Error(`Unknown phase: ${phase.name satisfies never}`);
  }
}

/**
 * Writes a point's position at a moment into a vector, so drawing a frame doesn't allocate.
 *
 * @param point The point.
 * @param trainedAmount How far the point has trained, from 0 to 1.
 * @param timeMs The current time, which drives the drift, in milliseconds.
 * @param position The vector to write the position into.
 */
export function writePointPosition(point: Point, trainedAmount: number, timeMs: number, position: Vector) {
  const [scatterX, scatterY] = point.scatterPosition;
  const [trainedX, trainedY] = point.trainedPosition;
  // A different rate on each axis, so a point drifts around a loop rather than along a line
  const driftX = Math.sin(timeMs / 1400 + point.driftPhase) * DRIFT_DISTANCE;
  const driftY = Math.cos(timeMs / 1700 + point.driftPhase) * DRIFT_DISTANCE;
  position[0] = interpolate(scatterX, trainedX, trainedAmount) + driftX;
  position[1] = interpolate(scatterY, trainedY, trainedAmount) + driftY;
}

/**
 * Gets the training step shown in the label. The dissolve rewinds it on the points' easing, reaching 0 as they
 * reach the scatter.
 *
 * @param phase Where the loop is.
 * @returns The step, rounded to hundreds.
 */
export function getTrainingStep(phase: Phase): number {
  return Math.round(getUnroundedTrainingStep(phase) / 100) * 100;
}

/**
 * Gets the training step at a phase, before rounding.
 *
 * @param phase Where the loop is.
 * @returns The step.
 */
function getUnroundedTrainingStep(phase: Phase): number {
  switch (phase.name) {
    case 'raw':
      return 0;
    case 'train':
      return phase.progress * TRAINING_STEPS;
    case 'query':
      return TRAINING_STEPS;
    case 'dissolve':
      return (1 - easeInOut(phase.progress)) * TRAINING_STEPS;
    default:
      throw new Error(`Unknown phase: ${phase.name satisfies never}`);
  }
}
