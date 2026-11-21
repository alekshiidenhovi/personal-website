import { clamp, gaussian, lerp } from '../../lib/math';
import { easeInOut } from '../../lib/motion';

/**
 * The simulation behind the hero's embedding space, in canvas-independent
 * coordinates (0..1 on both axes). Each cycle starts from the same raw
 * scatter, trains it into new clusters, retrieves a query's nearest
 * neighbours, and dissolves back into the scatter.
 */

export type Vec = [x: number, y: number];

export interface Point {
  /** The raw scatter: the same every cycle, so each run starts and ends here */
  noise: Vec;
  /** Where training puts the point; new clusters every cycle */
  target: Vec;
  /** Its cluster, or -1 for an outlier */
  cluster: number;
  /** 0 to 1: when the point starts moving during training, and again in the dissolve */
  delay: number;
  /** Phase of the idle drift, which every point keeps, scattered or trained */
  wobble: number;
  /** Relative size */
  radius: number;
}

export interface Cycle {
  points: Point[];
  /** A position just outside a cluster, and its nearest points */
  query: { position: Vec; neighbours: number[] };
}

const POINT_COUNT = 420;
const CLUSTER_COUNT = 7;
const OUTLIER_SHARE = 0.06;
export const NEIGHBOURS = 8;
/** How far a point drifts around its position, as a share of the canvas */
const DRIFT = 0.004;
const TRAINING_STEPS = 24000;

/** Phase durations in milliseconds, in loop order */
export const PHASES = [
  { name: 'raw', label: 'raw events', duration: 1800 },
  { name: 'train', label: 'training', duration: 5600 },
  { name: 'query', label: 'retrieval', duration: 4600 },
  { name: 'dissolve', label: 'next run', duration: 3600 },
] as const;
type PhaseName = (typeof PHASES)[number]['name'];
export const LOOP_MS = PHASES.reduce((total, phase) => total + phase.duration, 0);
/** The end of the retrieval, where the visual rests without motion */
export const RESTING_ELAPSED = LOOP_MS - PHASES[PHASES.length - 1].duration - 1;
/** Share of the training and dissolve phases over which point start times are spread */
const STAGGER = 0.45;

/** Where the loop is: the current phase, how far through it, and how long it has run */
export interface Phase {
  name: PhaseName;
  label: string;
  progress: number;
  time: number;
}

export const distance = (a: Vec, b: Vec) => Math.hypot(a[0] - b[0], a[1] - b[1]);

const randomNoise = (): Vec => [0.04 + Math.random() * 0.92, 0.04 + Math.random() * 0.92];

/** Cluster centers spread apart by rejection sampling */
const createCenters = (): Vec[] => {
  const centers: Vec[] = [];
  for (let attempt = 0; centers.length < CLUSTER_COUNT && attempt < 500; attempt++) {
    const candidate: Vec = [0.16 + Math.random() * 0.68, 0.16 + Math.random() * 0.68];
    if (centers.every((center) => distance(center, candidate) > 0.22)) centers.push(candidate);
  }
  return centers;
};

/** Anisotropic, rotated gaussian clusters of uneven size, plus a few outliers */
const createTargets = (): { target: Vec; cluster: number }[] => {
  const centers = createCenters();
  const shapes = centers.map(() => ({
    angle: Math.random() * Math.PI,
    spreadX: 0.025 + Math.random() * 0.045,
    spreadY: 0.015 + Math.random() * 0.025,
    weight: 0.5 + Math.random(),
  }));
  const totalWeight = shapes.reduce((total, shape) => total + shape.weight, 0);

  return Array.from({ length: POINT_COUNT }, () => {
    if (Math.random() < OUTLIER_SHARE) return { target: randomNoise(), cluster: -1 };
    let roll = Math.random() * totalWeight;
    let cluster = 0;
    while (cluster < shapes.length - 1 && roll >= shapes[cluster].weight) {
      roll -= shapes[cluster].weight;
      cluster++;
    }
    const { angle, spreadX, spreadY } = shapes[cluster];
    const [dx, dy] = [gaussian() * spreadX, gaussian() * spreadY];
    const [cx, cy] = centers[cluster];
    return {
      target: [cx + dx * Math.cos(angle) - dy * Math.sin(angle), cy + dx * Math.sin(angle) + dy * Math.cos(angle)],
      cluster,
    };
  });
};

/** The `count` points whose trained positions are nearest `position`, by index */
export const nearestTo = (points: Point[], position: Vec, count: number, exclude?: number) =>
  points
    .map((point, index) => ({ index, distance: distance(point.target, position) }))
    .filter(({ index, distance: d }) => index !== exclude && d > 0)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, count)
    .map(({ index }) => index);

/** Just outside a cluster, so the links to its neighbours read as reaching in */
const chooseQuery = (points: Point[]): Cycle['query'] => {
  const clustered = points.filter((point) => point.cluster >= 0);
  const anchor = clustered[Math.floor(Math.random() * clustered.length)].target;
  const angle = Math.random() * Math.PI * 2;
  const position: Vec = [
    clamp(anchor[0] + Math.cos(angle) * 0.1, 0.04, 0.96),
    clamp(anchor[1] + Math.sin(angle) * 0.1, 0.04, 0.96),
  ];
  return { position, neighbours: nearestTo(points, position, NEIGHBOURS) };
};

/**
 * A new cycle training towards new clusters. The scatter, drift and size of
 * each point carry over from `previous`, so nothing jumps when a run restarts.
 */
export const createCycle = (previous?: Cycle): Cycle => {
  const points = createTargets().map(({ target, cluster }, index) => {
    const before = previous?.points[index];
    return {
      noise: before?.noise ?? randomNoise(),
      target,
      cluster,
      delay: Math.random(),
      wobble: before?.wobble ?? Math.random() * Math.PI * 2,
      radius: before?.radius ?? 0.6 + Math.random() * 0.8,
    };
  });
  return { points, query: chooseQuery(points) };
};

export const phaseAt = (elapsed: number): Phase => {
  let start = 0;
  for (const phase of PHASES) {
    if (elapsed < start + phase.duration) {
      return {
        name: phase.name,
        label: phase.label,
        progress: (elapsed - start) / phase.duration,
        time: elapsed - start,
      };
    }
    start += phase.duration;
  }
  const last = PHASES[PHASES.length - 1];
  return { name: last.name, label: last.label, progress: 1, time: last.duration };
};

/** 0 while scattered, 1 once trained */
export const trainedAmount = (point: Point, phase: Phase) => {
  if (phase.name === 'raw') return 0;
  // Each point moves in its own window of the phase, so the points don't set off or land all at once
  const moved = easeInOut(clamp((phase.progress - point.delay * STAGGER) / (1 - STAGGER), 0, 1));
  if (phase.name === 'train') return moved;
  if (phase.name === 'dissolve') return 1 - moved;
  return 1;
};

/** Writes the point's position at time `now` into `out`, so drawing a frame doesn't allocate */
export const positionAt = (point: Point, trained: number, now: number, out: Vec) => {
  out[0] = lerp(point.noise[0], point.target[0], trained) + Math.sin(now / 1400 + point.wobble) * DRIFT;
  out[1] = lerp(point.noise[1], point.target[1], trained) + Math.cos(now / 1700 + point.wobble) * DRIFT;
};

/** The training step shown in the label; the dissolve rewinds it on the points' easing, reaching 0 at the scatter */
export const trainingStepAt = (phase: Phase) => {
  const steps = {
    raw: 0,
    train: phase.progress * TRAINING_STEPS,
    query: TRAINING_STEPS,
    dissolve: (1 - easeInOut(phase.progress)) * TRAINING_STEPS,
  }[phase.name];
  return Math.round(steps / 100) * 100;
};
