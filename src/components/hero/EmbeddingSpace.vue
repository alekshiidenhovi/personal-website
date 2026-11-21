<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { toCanvasColor } from "../../lib/color";
import { whenIdle } from "../../lib/idle";
import { clamp, lerp } from "../../lib/math";
import { easeInOut, prefersReducedMotion } from "../../lib/motion";
import CropMarks from "../ui/CropMarks.vue";
import { CanvasPainter } from "./CanvasPainter";
import {
  type Cycle,
  createCycle,
  distance,
  LOOP_MS,
  NEIGHBOURS,
  nearestTo,
  PHASES,
  type Phase,
  phaseAt,
  positionAt,
  RESTING_ELAPSED,
  trainedAmount,
  trainingStepAt,
  type Vec,
} from "./embeddingModel";

/**
 * The hero visual: an embedding space that learns its structure on loop (see
 * embeddingModel). Raw data (Data Foundations pink) becomes a model (ML blue)
 * becomes a product (Web amber) as a query retrieves its nearest neighbours.
 * Hover a point to see its neighbours. Plays while on screen, once the page
 * has settled; without motion it rests on a finished retrieval.
 */

const NEIGHBOUR_DRAW_MS = 200;
const HOVER_RADIUS_PX = 14;
/** Opacity levels a point's training fade is rounded to, so points can share a fill */
const FADE_STEPS = 10;

const containerRef = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const phaseLabel = ref<string>(PHASES[0].label);
const step = ref(0);

let painter: CanvasPainter | null = null;
let cycle: Cycle = createCycle();
let cycleStart = 0;
/** The canvas size in CSS pixels */
let size = { width: 0, height: 0 };
/** The points' canvas positions this frame; reused across frames, so drawing doesn't allocate */
const positions: Vec[] = cycle.points.map(() => [0, 0]);
let colors = { raw: "", clusters: [] as string[], query: "", grid: "" };
let hovered: { index: number; neighbours: number[] } | null = null;

const startCycle = (now: number) => {
  cycle = createCycle(cycle);
  cycleStart = now;
  hovered = null;
};

/** Canvas colors from the design tokens, as rgb (see toCanvasColor) */
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

const clusterColor = (cluster: number) => (cluster >= 0 ? colors.clusters[cluster % colors.clusters.length] : colors.grid);
const toCanvas = ([x, y]: Vec): Vec => [x * size.width, y * size.height];

/** Points: raw data in pink, turning into their cluster's blue as they train */
const drawPoints = (paint: CanvasPainter, phase: Phase, now: number, unit: number) => {
  for (const [index, point] of cycle.points.entries()) {
    const exactTrained = trainedAmount(point, phase);
    const at = positions[index];
    positionAt(point, exactTrained, now, at);
    at[0] *= size.width;
    at[1] *= size.height;
    const trained = Math.round(exactTrained * FADE_STEPS) / FADE_STEPS;
    const radius = unit * 0.0042 * point.radius;
    paint.batchDot(at, radius, colors.raw, 0.55 * (1 - trained));
    paint.batchDot(at, radius, clusterColor(point.cluster), 0.9 * trained);
  }
  paint.fillBatchedDots();
};

/** Retrieval: the query appears, pulses, and links to its nearest neighbours one by one */
const drawQuery = (paint: CanvasPainter, phase: Phase, unit: number) => {
  const queryAt = toCanvas(cycle.query.position);
  const fadeOut = 1 - clamp((phase.progress - 0.85) / 0.15, 0, 1);
  for (const [order, index] of cycle.query.neighbours.entries()) {
    const drawn = clamp((phase.time - 400 - order * NEIGHBOUR_DRAW_MS) / NEIGHBOUR_DRAW_MS, 0, 1);
    if (!drawn) continue;
    const end = positions[index];
    paint.line(queryAt, [lerp(queryAt[0], end[0], drawn), lerp(queryAt[1], end[1], drawn)], colors.query, 0.55 * fadeOut);
    if (drawn === 1) {
      // A ring per retrieved neighbour keeps them distinct even when close together
      paint.dot(end, unit * 0.005, colors.query, fadeOut);
      paint.ring(end, unit * 0.011, colors.query, 0.8 * fadeOut);
    }
  }
  const pulse = (phase.time % 1600) / 1600;
  paint.ring(queryAt, unit * (0.012 + pulse * 0.05), colors.query, (1 - pulse) * 0.6 * fadeOut);
  const appear = easeInOut(clamp(phase.time / 400, 0, 1));
  paint.glowingDot(queryAt, unit * 0.01, colors.query, fadeOut, unit * 0.04, appear);
};

/** Hover: the hovered point's nearest neighbours, once the space has structure */
const drawHover = (paint: CanvasPainter, phase: Phase, unit: number) => {
  if (!hovered || trainedAmount(cycle.points[hovered.index], phase) <= 0.9) return;
  const at = positions[hovered.index];
  const color = clusterColor(Math.max(cycle.points[hovered.index].cluster, 0));
  for (const index of hovered.neighbours) paint.line(at, positions[index], color, 0.6);
  paint.glowingDot(at, unit * 0.009, color, 1, unit * 0.04);
};

const draw = (now: number) => {
  if (!painter || !size.width) return;
  const phase = phaseAt(prefersReducedMotion ? RESTING_ELAPSED : (now - cycleStart) % LOOP_MS);
  const unit = Math.min(size.width, size.height);
  painter.clear();
  drawPoints(painter, phase, now, unit);
  if (phase.name === "query") drawQuery(painter, phase, unit);
  drawHover(painter, phase, unit);
  phaseLabel.value = phase.label;
  step.value = trainingStepAt(phase);
};

/** Sizes the canvas buffer to its box and redraws, since resizing the buffer clears it */
const resize = () => {
  const canvas = canvasRef.value;
  if (!canvas || !painter) return;
  const { width, height } = canvas.getBoundingClientRect();
  // Observers report the initial size again; skip it rather than clear the canvas for nothing
  if (width === size.width && height === size.height) return;
  size = { width, height };
  painter.resize(width, height);
  draw(performance.now());
};

/* The loop runs only once started (when the page is idle) and while the visual is on screen */
let frameId = 0;
let isStarted = false;
let isVisible = false;

const loop = (now: number) => {
  if (now - cycleStart >= LOOP_MS) startCycle(now);
  draw(now);
  frameId = requestAnimationFrame(loop);
};

const updateLoop = () => {
  const shouldRun = isStarted && isVisible;
  if (shouldRun && !frameId) frameId = requestAnimationFrame(loop);
  if (!shouldRun && frameId) {
    cancelAnimationFrame(frameId);
    frameId = 0;
  }
};

const onPointerMove = (event: PointerEvent) => {
  const rect = canvasRef.value?.getBoundingClientRect();
  if (!rect) return;
  const pointer: Vec = [(event.clientX - rect.left) / size.width, (event.clientY - rect.top) / size.height];
  const [nearest] = nearestTo(cycle.points, pointer, 1);
  const isClose =
    nearest !== undefined && distance(cycle.points[nearest].target, pointer) * Math.min(size.width, size.height) < HOVER_RADIUS_PX;
  hovered = isClose ? { index: nearest, neighbours: nearestTo(cycle.points, cycle.points[nearest].target, NEIGHBOURS, nearest) } : null;
  // Without the loop, redraw here
  if (!frameId) draw(performance.now());
};

const onPointerLeave = () => {
  hovered = null;
  if (!frameId) draw(performance.now());
};

let resizeObserver: ResizeObserver | null = null;
let visibilityObserver: IntersectionObserver | null = null;
let cancelStart: (() => void) | null = null;

onMounted(() => {
  if (!canvasRef.value) return;
  painter = new CanvasPainter(canvasRef.value);
  readColors();
  cycleStart = performance.now();
  // Draws the raw scatter straight away, and again whenever the canvas changes size
  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvasRef.value);
  resize();
  if (prefersReducedMotion) return;

  visibilityObserver = new IntersectionObserver(([entry]) => {
    isVisible = entry.isIntersecting;
    updateLoop();
  });
  if (containerRef.value) visibilityObserver.observe(containerRef.value);
  cancelStart = whenIdle(() => {
    startCycle(performance.now());
    isStarted = true;
    updateLoop();
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
    <div class="labels" aria-hidden="true">
      <span>embedding space</span>
      <span class="step">step {{ step.toLocaleString("en-US") }}</span>
    </div>
    <canvas ref="canvasRef" @pointermove="onPointerMove" @pointerleave="onPointerLeave"></canvas>
    <div class="labels" aria-hidden="true">
      <span class="phases">
        <span v-for="phase in PHASES.slice(0, -1)" :key="phase.name" class="phase"
          :class="[phase.name, { current: phase.label === phaseLabel }]">{{ phase.label }}</span>
      </span>
      <span>2-d projection</span>
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
