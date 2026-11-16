<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { toCanvasColor } from "../lib/color";
import { whenIdle } from "../lib/idle";
import { easeInOut, prefersReducedMotion } from "../lib/motion";
import CropMarks from "./CropMarks.vue";

/**
 * The hero visual: an embedding space that learns its structure on loop.
 * Raw data starts as scattered noise, training pulls it into clusters, then a
 * query retrieves its nearest neighbours: raw data (Data Foundations pink) becomes a
 * model (ML blue) becomes a product (Web amber). Hover a point to see its
 * neighbours.
 */

type Vec = [x: number, y: number];

interface Point {
  /** The raw scatter: the same every cycle, so each run starts and ends here */
  noise: Vec;
  /** Where training puts the point; new clusters every cycle */
  target: Vec;
  cluster: number;
  /** 0 to 1: when the point starts moving during training */
  delay: number;
  /** Phase of the idle drift around the target */
  wobble: number;
  radius: number;
}

const POINT_COUNT = 420;
const CLUSTER_COUNT = 7;
const OUTLIER_SHARE = 0.06;
const NEIGHBOURS = 8;
const TRAINING_STEPS = 24000;

/** Phase durations in milliseconds, in loop order */
const PHASES = [
  { name: "raw", label: "raw events", duration: 1800 },
  { name: "train", label: "training", duration: 5600 },
  { name: "query", label: "retrieval", duration: 4600 },
  { name: "dissolve", label: "next run", duration: 1600 },
] as const;
type PhaseName = (typeof PHASES)[number]["name"];
const LOOP_MS = PHASES.reduce((total, phase) => total + phase.duration, 0);
/** Share of the training phase over which point start times are spread */
const TRAIN_STAGGER = 0.45;
const NEIGHBOUR_DRAW_MS = 200;
const HOVER_RADIUS_PX = 14;
/** Opacity levels a point's training fade is rounded to, so points can share a fill */
const FADE_STEPS = 10;

const containerRef = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const phaseLabel = ref<string>(PHASES[0].label);
const step = ref(0);

let points: Point[] = [];
let query: { position: Vec; neighbours: number[] } = { position: [0.5, 0.5], neighbours: [] };
let colors = { raw: "", clusters: [] as string[], query: "", grid: "" };
let size = { width: 0, height: 0 };
let dpr = 1;
let cycleStart = 0;
let frameId = 0;
let isVisible = true;
let hovered: number | null = null;
let hoveredNeighbours: number[] = [];
let resizeObserver: ResizeObserver | null = null;
let visibilityObserver: IntersectionObserver | null = null;
let cancelStart: (() => void) | null = null;

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const gaussian = () => Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());
const distance = (a: Vec, b: Vec) => Math.hypot(a[0] - b[0], a[1] - b[1]);
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

const nearestTo = (position: Vec, count: number, exclude?: number) =>
  points
    .map((point, index) => ({ index, distance: distance(point.target, position) }))
    .filter(({ index, distance: d }) => index !== exclude && d > 0)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, count)
    .map(({ index }) => index);

const chooseQuery = () => {
  const clustered = points.filter((point) => point.cluster >= 0);
  // Just outside a cluster, so the links to its neighbours read as reaching in
  const anchor = clustered[Math.floor(Math.random() * clustered.length)].target;
  const angle = Math.random() * Math.PI * 2;
  const position: Vec = [
    Math.min(Math.max(anchor[0] + Math.cos(angle) * 0.1, 0.04), 0.96),
    Math.min(Math.max(anchor[1] + Math.sin(angle) * 0.1, 0.04), 0.96),
  ];
  query = { position, neighbours: nearestTo(position, NEIGHBOURS) };
};

/** Starts a new cycle from the same raw scatter, training towards new clusters */
const startCycle = (now: number) => {
  const targets = createTargets();
  points = targets.map(({ target, cluster }, index) => ({
    noise: points[index]?.noise ?? randomNoise(),
    target,
    cluster,
    delay: Math.random(),
    // Kept across cycles with the scatter, so nothing jumps when a run restarts
    wobble: points[index]?.wobble ?? Math.random() * Math.PI * 2,
    radius: points[index]?.radius ?? 0.6 + Math.random() * 0.8,
  }));
  chooseQuery();
  cycleStart = now;
  hovered = null;
};

const readColors = () => {
  const styles = getComputedStyle(document.documentElement);
  const read = (name: string) => toCanvasColor(styles.getPropertyValue(name).trim());
  colors = {
    raw: read("--accent-400"),
    clusters: ["--primary-300", "--primary-400", "--primary-500", "--primary-200", "--primary-600"].map(read),
    query: read("--warning-400"),
    grid: read("--neutral-700"),
  };
};

/** Sizes the canvas buffer to its box and redraws, since resizing the buffer clears it */
const resize = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const { width, height } = canvas.getBoundingClientRect();
  // Observers report the initial size again; skip it rather than clear the canvas for nothing
  if (width === size.width && height === size.height) return;
  dpr = Math.min(window.devicePixelRatio, 2);
  size = { width, height };
  glowSprites.clear();
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);
  draw(performance.now());
};

/** Where the loop is: the current phase and how far through it */
const phaseAt = (elapsed: number): { name: PhaseName; label: string; progress: number; time: number } => {
  let start = 0;
  for (const phase of PHASES) {
    if (elapsed < start + phase.duration) {
      return { name: phase.name, label: phase.label, progress: (elapsed - start) / phase.duration, time: elapsed - start };
    }
    start += phase.duration;
  }
  const last = PHASES[PHASES.length - 1];
  return { name: last.name, label: last.label, progress: 1, time: last.duration };
};

/** 0 while scattered, 1 once trained */
const trainedAmount = (point: Point, phase: ReturnType<typeof phaseAt>) => {
  if (phase.name === "raw") return 0;
  if (phase.name === "train") return easeInOut(clamp01((phase.progress - point.delay * TRAIN_STAGGER) / (1 - TRAIN_STAGGER)));
  if (phase.name === "dissolve") return 1 - easeInOut(phase.progress);
  return 1;
};

const positionOf = (point: Point, phase: ReturnType<typeof phaseAt>, now: number): Vec => {
  const trained = trainedAmount(point, phase);
  const drift = 0.004 * trained;
  const wobbleX = Math.sin(now / 1400 + point.wobble) * drift;
  const wobbleY = Math.cos(now / 1700 + point.wobble) * drift;
  return [lerp(point.noise[0], point.target[0], trained) + wobbleX, lerp(point.noise[1], point.target[1], trained) + wobbleY];
};

const toCanvas = ([x, y]: Vec): Vec => [x * size.width, y * size.height];

const drawLink = (ctx: CanvasRenderingContext2D, from: Vec, to: Vec, color: string, alpha: number) => {
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(...from);
  ctx.lineTo(...to);
  ctx.stroke();
};

const drawDot = (ctx: CanvasRenderingContext2D, at: Vec, radius: number, color: string, alpha: number) => {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(at[0], at[1], radius, 0, Math.PI * 2);
  ctx.fill();
};

/** Glowing dots by color and radius; cleared on resize, since their size follows the canvas */
const glowSprites = new Map<string, { image: HTMLCanvasElement; extent: number }>();

/**
 * A glowing dot, blurred once onto its own canvas and then copied each frame,
 * since a canvas shadow blur is slow in Safari
 */
const glowSprite = (radius: number, color: string, glow: number) => {
  const key = `${color} ${radius}`;
  const cached = glowSprites.get(key);
  if (cached) return cached;
  // Half the sprite's width in CSS pixels, with room for the blur's falloff
  const extent = Math.ceil(radius + glow);
  const image = document.createElement("canvas");
  image.width = image.height = extent * 2 * dpr;
  const ctx = image.getContext("2d");
  if (ctx) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.shadowColor = color;
    ctx.shadowBlur = glow;
    drawDot(ctx, [extent, extent], radius, color, 1);
  }
  const sprite = { image, extent };
  glowSprites.set(key, sprite);
  return sprite;
};

/** A glowing dot, scaled down by `scale` as it appears */
const drawGlowingDot = (ctx: CanvasRenderingContext2D, at: Vec, radius: number, color: string, alpha: number, scale = 1) => {
  const { image, extent } = glowSprite(radius, color, Math.min(size.width, size.height) * 0.04);
  const half = extent * scale;
  ctx.globalAlpha = alpha;
  ctx.drawImage(image, at[0] - half, at[1] - half, half * 2, half * 2);
};

/** Dots grouped by color, then by opacity, so each group is drawn with a single fill */
const dotBatches = new Map<string, Map<number, Path2D>>();

const addDot = (at: Vec, radius: number, color: string, alpha: number) => {
  if (!alpha) return;
  let byAlpha = dotBatches.get(color);
  if (!byAlpha) {
    byAlpha = new Map();
    dotBatches.set(color, byAlpha);
  }
  let path = byAlpha.get(alpha);
  if (!path) {
    path = new Path2D();
    byAlpha.set(alpha, path);
  }
  path.moveTo(at[0] + radius, at[1]);
  path.arc(at[0], at[1], radius, 0, Math.PI * 2);
};

const fillDots = (ctx: CanvasRenderingContext2D) => {
  for (const [color, byAlpha] of dotBatches) {
    ctx.fillStyle = color;
    for (const [alpha, path] of byAlpha) {
      ctx.globalAlpha = alpha;
      ctx.fill(path);
    }
  }
  dotBatches.clear();
};

function draw(now: number) {
  const ctx = canvasRef.value?.getContext("2d");
  if (!ctx || !size.width) return;
  // Without motion the visual rests on a finished retrieval
  const elapsed = prefersReducedMotion ? LOOP_MS - PHASES[PHASES.length - 1].duration - 1 : (now - cycleStart) % LOOP_MS;
  const phase = phaseAt(elapsed);
  const unit = Math.min(size.width, size.height);
  ctx.clearRect(0, 0, size.width, size.height);

  const positions = points.map((point) => toCanvas(positionOf(point, phase, now)));

  // Points: raw data in pink, turning into their cluster's blue as they train
  for (const [index, point] of points.entries()) {
    const trained = Math.round(trainedAmount(point, phase) * FADE_STEPS) / FADE_STEPS;
    const radius = unit * 0.0042 * point.radius;
    const clusterColor = point.cluster >= 0 ? colors.clusters[point.cluster % colors.clusters.length] : colors.grid;
    addDot(positions[index], radius, colors.raw, 0.55 * (1 - trained));
    addDot(positions[index], radius, clusterColor, 0.9 * trained);
  }
  fillDots(ctx);

  // Retrieval: the query links to its nearest neighbours one by one
  if (phase.name === "query") {
    const queryAt = toCanvas(query.position);
    const fadeOut = 1 - clamp01((phase.progress - 0.85) / 0.15);
    for (const [order, index] of query.neighbours.entries()) {
      const drawn = clamp01((phase.time - 400 - order * NEIGHBOUR_DRAW_MS) / NEIGHBOUR_DRAW_MS);
      if (!drawn) continue;
      const end = positions[index];
      const tip: Vec = [lerp(queryAt[0], end[0], drawn), lerp(queryAt[1], end[1], drawn)];
      drawLink(ctx, queryAt, tip, colors.query, 0.55 * fadeOut);
      if (drawn === 1) {
        // A ring per retrieved neighbour keeps them distinct even when close together
        drawDot(ctx, end, unit * 0.005, colors.query, fadeOut);
        ctx.globalAlpha = 0.8 * fadeOut;
        ctx.strokeStyle = colors.query;
        ctx.beginPath();
        ctx.arc(end[0], end[1], unit * 0.011, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    const appear = easeInOut(clamp01(phase.time / 400));
    const pulse = (phase.time % 1600) / 1600;
    ctx.globalAlpha = (1 - pulse) * 0.6 * fadeOut;
    ctx.strokeStyle = colors.query;
    ctx.beginPath();
    ctx.arc(queryAt[0], queryAt[1], unit * (0.012 + pulse * 0.05), 0, Math.PI * 2);
    ctx.stroke();
    drawGlowingDot(ctx, queryAt, unit * 0.01, colors.query, fadeOut, appear);
  }

  // Hover: the hovered point's nearest neighbours, once the space has structure
  if (hovered !== null && trainedAmount(points[hovered], phase) > 0.9) {
    const color = colors.clusters[Math.max(points[hovered].cluster, 0) % colors.clusters.length];
    for (const index of hoveredNeighbours) drawLink(ctx, positions[hovered], positions[index], color, 0.6);
    drawGlowingDot(ctx, positions[hovered], unit * 0.009, color, 1);
  }
  ctx.globalAlpha = 1;

  phaseLabel.value = phase.label;
  // The dissolve rewinds the count on the points' easing, reaching 0 as they reach the scatter
  const trainedSteps = {
    raw: 0,
    train: phase.progress * TRAINING_STEPS,
    query: TRAINING_STEPS,
    dissolve: (1 - easeInOut(phase.progress)) * TRAINING_STEPS,
  }[phase.name];
  step.value = Math.round(trainedSteps / 100) * 100;
}

const loop = (now: number) => {
  if (now - cycleStart >= LOOP_MS) startCycle(now);
  if (isVisible) draw(now);
  frameId = requestAnimationFrame(loop);
};

const onPointerMove = (event: PointerEvent) => {
  const rect = canvasRef.value?.getBoundingClientRect();
  if (!rect) return;
  const pointer: Vec = [(event.clientX - rect.left) / size.width, (event.clientY - rect.top) / size.height];
  const nearest = nearestTo(pointer, 1)[0];
  const isClose =
    nearest !== undefined && distance(points[nearest].target, pointer) * Math.min(size.width, size.height) < HOVER_RADIUS_PX;
  hovered = isClose ? nearest : null;
  hoveredNeighbours = isClose ? nearestTo(points[nearest].target, NEIGHBOURS, nearest) : [];
  if (prefersReducedMotion) draw(performance.now());
};

const onPointerLeave = () => {
  hovered = null;
  if (prefersReducedMotion) draw(performance.now());
};

onMounted(() => {
  readColors();
  startCycle(performance.now());
  resize();
  resizeObserver = new ResizeObserver(resize);
  if (canvasRef.value) resizeObserver.observe(canvasRef.value);
  if (prefersReducedMotion) return;

  visibilityObserver = new IntersectionObserver(([entry]) => {
    isVisible = entry.isIntersecting;
  });
  if (containerRef.value) visibilityObserver.observe(containerRef.value);
  // The raw scatter, drawn by the resize above, shows straight away; the loop waits until the page has settled
  cancelStart = whenIdle(() => {
    startCycle(performance.now());
    frameId = requestAnimationFrame(loop);
  });
});

onUnmounted(() => {
  cancelStart?.();
  cancelAnimationFrame(frameId);
  resizeObserver?.disconnect();
  visibilityObserver?.disconnect();
});
</script>

<template>
  <figure ref="containerRef" class="embedding-space" aria-label="An embedding space learning clusters from raw data">
    <CropMarks />
    <div class="labels labels-top" aria-hidden="true">
      <span>embedding space</span>
      <span class="step">step {{ step.toLocaleString("en-US") }}</span>
    </div>
    <canvas ref="canvasRef" @pointermove="onPointerMove" @pointerleave="onPointerLeave"></canvas>
    <div class="labels labels-bottom" aria-hidden="true">
      <span class="phases">
        <span v-for="phase in PHASES.slice(0, -1)" :key="phase.name" class="phase"
          :class="[phase.name, { current: phase.label === phaseLabel }]">{{ phase.label }}</span>
      </span>
      <span class="projection">2-d projection</span>
    </div>
  </figure>
</template>

<style scoped>
.embedding-space {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  aspect-ratio: 1 / 0.92;
  padding: 1.25rem;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--text-muted);
  /* Fainter marks than the experience figures' */
  --crop-size: 1rem;
  --crop-weight: 1px;
  --crop-color: var(--neutral-700);
}

canvas {
  flex-grow: 1;
  min-height: 0;
  width: 100%;
  cursor: crosshair;
}

/* A fixed height, so the canvas gets the same space whichever font the labels render in */
.labels {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  height: 0.9rem;
}

.step {
  font-variant-numeric: tabular-nums;
  color: var(--text-muted);
}

.phases {
  display: flex;
  gap: 1rem;
}

.phase {
  transition: color 0.4s ease;
}

.phase.current {
  color: var(--neutral-200);
}

.phase.raw.current {
  color: var(--accent-400);
}

.phase.train.current {
  color: var(--primary-400);
}

.phase.query.current {
  color: var(--warning-400);
}
</style>
