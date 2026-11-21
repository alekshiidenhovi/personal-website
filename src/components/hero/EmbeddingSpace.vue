<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue';
import { useIsInViewport } from '../../composables/useIsInViewport';
import { convertToCanvasColor } from '../../lib/color';
import { runWhenIdle } from '../../lib/idle';
import { clamp, interpolate } from '../../lib/math';
import { easeInOut, prefersReducedMotion } from '../../lib/motion';
import CropMarks from '../ui/CropMarks.vue';
import { CanvasPainter } from './CanvasPainter';
import {
  createCycle,
  getPhase,
  getTrainedAmount,
  getTrainingStep,
  LOOP_MS,
  PHASES,
  type Phase,
  type PhaseName,
  RESTING_ELAPSED_MS,
  type Vector,
  writePointPosition,
} from './embeddingModel';

/**
 * The hero visual: an embedding space that learns its structure on loop (see embeddingModel). Raw data (Data
 * Foundations pink) becomes a model (ML blue) becomes a product (Web amber) as a query retrieves its nearest
 * neighbours. Plays while on screen, once the page has settled; without motion it rests on a finished retrieval.
 */

/** The colors the visual paints with, as canvas-safe colors. */
interface CanvasColors {
  /** Points not yet trained. */
  readonly raw: string;
  /** Trained points, one color per cluster, repeating. */
  readonly clusters: readonly string[];
  /** Trained points outside every cluster. */
  readonly outlier: string;
  /** The query and its links. */
  readonly query: string;
}

/** What drawing needs once the canvas is mounted. */
interface Scene {
  readonly painter: CanvasPainter;
  readonly colors: CanvasColors;
}

const CLUSTER_COLOR_TOKENS = ['--primary-300', '--primary-400', '--primary-500', '--primary-200', '--primary-600'];
/** How long the query takes to appear; its links start once it has. */
const QUERY_APPEAR_MS = 400;
const QUERY_PULSE_MS = 1600;
/** How long each link to a neighbour takes to draw; they draw one after another. */
const NEIGHBOUR_DRAW_MS = 200;
/** How far through the retrieval the query and its links start to fade out. */
const QUERY_FADE_OUT_START = 0.85;
/** The opacity levels a point's training fade is rounded to, so points can share a fill. */
const FADE_STEPS = 10;
/** The phases in the legend; none is highlighted while the space dissolves back into the scatter. */
const LEGEND_PHASES = PHASES.filter((phase) => phase.name !== 'dissolve');

const figureRef = useTemplateRef<HTMLElement>('figure');
const canvasRef = useTemplateRef<HTMLCanvasElement>('canvas');
const currentPhaseName = ref<PhaseName>(PHASES[0].name);
const trainingStep = ref(0);
const isInViewport = useIsInViewport(figureRef);
const isStarted = ref(false);
const isPlaying = computed(() => isStarted.value && isInViewport.value);

let scene: Scene | undefined;
let cycle = createCycle();
let cycleStartMs = 0;
/** The canvas's size in CSS pixels. */
let canvasSize = { width: 0, height: 0 };
/** The points' canvas positions this frame; reused across frames, so drawing doesn't allocate. */
const pointPositions: Vector[] = cycle.points.map(() => [0, 0]);
let frameId = 0;
let resizeObserver: ResizeObserver | undefined;
let cancelIdleStart: (() => void) | undefined;

/**
 * Reads a color token as a color a canvas can paint.
 *
 * @param styles The computed styles of an element the token applies to.
 * @param token The custom property's name.
 * @returns The token's color.
 */
function readTokenColor(styles: CSSStyleDeclaration, token: string): string {
  return convertToCanvasColor(styles.getPropertyValue(token).trim());
}

/**
 * Reads the colors to paint with from the design tokens.
 *
 * @param element An element the tokens apply to.
 * @returns The colors.
 */
function readCanvasColors(element: Element): CanvasColors {
  const styles = getComputedStyle(element);
  return {
    raw: readTokenColor(styles, '--accent-400'),
    clusters: CLUSTER_COLOR_TOKENS.map((token) => readTokenColor(styles, token)),
    outlier: readTokenColor(styles, '--neutral-700'),
    query: readTokenColor(styles, '--warning-400'),
  };
}

/**
 * Gets the color of a trained point.
 *
 * @param colors The colors to paint with.
 * @param cluster The point's cluster, or undefined for an outlier.
 * @returns The color.
 */
function getClusterColor(colors: CanvasColors, cluster: number | undefined): string {
  return cluster === undefined ? colors.outlier : colors.clusters[cluster % colors.clusters.length];
}

/**
 * Scales a position in the space to the canvas.
 *
 * @param position The position, from 0 to 1 on both axes.
 * @returns The position in CSS pixels.
 */
function scaleToCanvas([x, y]: Vector): Vector {
  return [x * canvasSize.width, y * canvasSize.height];
}

/**
 * Starts a cycle training towards new clusters.
 *
 * @param timeMs The time the cycle starts, in milliseconds.
 */
function startNewCycle(timeMs: number) {
  cycle = createCycle(cycle);
  cycleStartMs = timeMs;
}

/**
 * Draws the points: raw data in pink, turning into their cluster's blue as they train.
 *
 * @param scene The painter and colors.
 * @param phase Where the loop is.
 * @param timeMs The current time, in milliseconds.
 * @param shortSide The canvas's shorter side, which sizes what's drawn.
 */
function drawPoints({ painter, colors }: Scene, phase: Phase, timeMs: number, shortSide: number) {
  for (const [index, point] of cycle.points.entries()) {
    const trainedAmount = getTrainedAmount(point, phase);
    const position = pointPositions[index];
    writePointPosition(point, trainedAmount, timeMs, position);
    position[0] *= canvasSize.width;
    position[1] *= canvasSize.height;
    const roundedTrainedAmount = Math.round(trainedAmount * FADE_STEPS) / FADE_STEPS;
    const radius = shortSide * 0.0042 * point.radius;
    painter.batchDot(position, radius, colors.raw, 0.55 * (1 - roundedTrainedAmount));
    painter.batchDot(position, radius, getClusterColor(colors, point.cluster), 0.9 * roundedTrainedAmount);
  }
  painter.fillBatchedDots();
}

/**
 * Draws the retrieval: the query appears, pulses, and links to its nearest neighbours one by one.
 *
 * @param scene The painter and colors.
 * @param phase Where the loop is, in the retrieval phase.
 * @param shortSide The canvas's shorter side, which sizes what's drawn.
 */
function drawQuery({ painter, colors }: Scene, phase: Phase, shortSide: number) {
  const queryPosition = scaleToCanvas(cycle.query.position);
  const opacity = 1 - clamp((phase.progress - QUERY_FADE_OUT_START) / (1 - QUERY_FADE_OUT_START), 0, 1);
  for (const [order, pointIndex] of cycle.query.neighbourIndexes.entries()) {
    const linkStartMs = QUERY_APPEAR_MS + order * NEIGHBOUR_DRAW_MS;
    const linkProgress = clamp((phase.elapsedMs - linkStartMs) / NEIGHBOUR_DRAW_MS, 0, 1);
    if (linkProgress === 0) {
      continue;
    }
    const neighbourPosition = pointPositions[pointIndex];
    const linkEnd: Vector = [
      interpolate(queryPosition[0], neighbourPosition[0], linkProgress),
      interpolate(queryPosition[1], neighbourPosition[1], linkProgress),
    ];
    painter.drawLine(queryPosition, linkEnd, colors.query, 0.55 * opacity);
    if (linkProgress === 1) {
      // A ring per retrieved neighbour keeps them distinct even when close together
      painter.drawDot(neighbourPosition, shortSide * 0.005, colors.query, opacity);
      painter.drawRing(neighbourPosition, shortSide * 0.011, colors.query, 0.8 * opacity);
    }
  }
  const pulse = (phase.elapsedMs % QUERY_PULSE_MS) / QUERY_PULSE_MS;
  painter.drawRing(queryPosition, shortSide * (0.012 + pulse * 0.05), colors.query, (1 - pulse) * 0.6 * opacity);
  const appearance = easeInOut(clamp(phase.elapsedMs / QUERY_APPEAR_MS, 0, 1));
  painter.drawGlowingDot(queryPosition, shortSide * 0.01, colors.query, opacity, shortSide * 0.04, appearance);
}

/**
 * Draws the frame for a moment in the cycle, and updates the labels to match.
 *
 * @param timeMs The current time, in milliseconds.
 */
function drawFrame(timeMs: number) {
  if (!scene || canvasSize.width === 0) {
    return;
  }
  const phase = getPhase(prefersReducedMotion ? RESTING_ELAPSED_MS : (timeMs - cycleStartMs) % LOOP_MS);
  const shortSide = Math.min(canvasSize.width, canvasSize.height);
  scene.painter.clear();
  drawPoints(scene, phase, timeMs, shortSide);
  if (phase.name === 'query') {
    drawQuery(scene, phase, shortSide);
  }
  currentPhaseName.value = phase.name;
  trainingStep.value = getTrainingStep(phase);
}

/**
 * Sizes the drawing buffer to the canvas's box and redraws, since resizing the buffer clears it.
 *
 * @param painter The canvas's painter.
 * @param canvas The canvas.
 */
function resizeCanvas(painter: CanvasPainter, canvas: HTMLCanvasElement) {
  const { width, height } = canvas.getBoundingClientRect();
  // Observers report the initial size again; skip it rather than clear the canvas for nothing
  if (width === canvasSize.width && height === canvasSize.height) {
    return;
  }
  canvasSize = { width, height };
  painter.resize(width, height);
  drawFrame(performance.now());
}

/**
 * Draws a frame of the animation, starting a new cycle when one ends, and schedules the next frame.
 *
 * @param timeMs The frame's time, in milliseconds.
 */
function animateFrame(timeMs: number) {
  if (timeMs - cycleStartMs >= LOOP_MS) {
    startNewCycle(timeMs);
  }
  drawFrame(timeMs);
  frameId = requestAnimationFrame(animateFrame);
}

/** Starts the animation from a new cycle; it then plays while the visual is in view. */
function startPlaying() {
  startNewCycle(performance.now());
  isStarted.value = true;
}

watch(isPlaying, (isNowPlaying) => {
  if (isNowPlaying) {
    frameId = requestAnimationFrame(animateFrame);
  } else {
    cancelAnimationFrame(frameId);
    frameId = 0;
  }
});

onMounted(() => {
  const canvas = canvasRef.value;
  if (!canvas) {
    throw new Error('EmbeddingSpace needs its canvas mounted');
  }
  const painter = CanvasPainter.tryCreate(canvas);
  if (!painter) {
    // Without canvas 2D the visual stays an empty frame with its labels, which the layout is built around
    return;
  }
  scene = { painter, colors: readCanvasColors(canvas) };
  cycleStartMs = performance.now();
  resizeObserver = new ResizeObserver(() => resizeCanvas(painter, canvas));
  resizeObserver.observe(canvas);
  resizeCanvas(painter, canvas);
  if (!prefersReducedMotion) {
    cancelIdleStart = runWhenIdle(startPlaying);
  }
});

onUnmounted(() => {
  cancelIdleStart?.();
  cancelAnimationFrame(frameId);
  resizeObserver?.disconnect();
});
</script>

<template>
  <figure ref="figure" class="embedding-space" aria-label="An embedding space learning clusters from raw data">
    <CropMarks />
    <div class="labels" aria-hidden="true">
      <span>embedding space</span>
      <span class="step">step {{ trainingStep.toLocaleString('en-US') }}</span>
    </div>
    <canvas ref="canvas"></canvas>
    <div class="labels" aria-hidden="true">
      <span class="phases">
        <span v-for="phase in LEGEND_PHASES" :key="phase.name" class="phase"
          :class="[phase.name, { current: phase.name === currentPhaseName }]">{{ phase.label }}</span>
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
