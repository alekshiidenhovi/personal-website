/**
 * @fileoverview An illustrative self-supervised pretraining run, shaped like the thesis runs. The SIGReg loss
 * drops fast as the collapsed embedding cloud spreads into an isotropic Gaussian; the invariance loss, the distance
 * between two views of the same sequence, starts near zero while everything sits together, spikes as the cloud
 * spreads, then slowly settles as the views are pulled back together. A run's progress goes from 0 to 1.
 */

import { clamp, interpolate, sampleGaussian, smoothstep, type Vector } from '../../../lib/math';
import { formatPoints } from '../../../lib/svg';

/** Minibatch noise on one loss: independent values from -1 to 1, and a moving average of them. */
export interface LossNoise {
  /** Draws the curve, which runs straight between the values. */
  readonly raw: readonly number[];
  /** Places the dot moving along the curve, so it glides instead of shaking. */
  readonly smooth: readonly number[];
}

/** The embeddings to draw: the cloud, and the pairs of views. */
export interface Cloud {
  readonly points: readonly Vector[];
  readonly pairs: readonly (readonly [Vector, Vector])[];
}

/** One input seen two ways: a shared position, and the direction the two views move apart in. */
interface ViewPair {
  readonly center: Vector;
  readonly direction: Vector;
}

/** The highest invariance loss on its chart. */
export const INVARIANCE_MAX = 0.3;
/** The highest SIGReg loss on its chart. */
export const SIGREG_MAX = 100;

/** A short run, so the rise fills much of the chart instead of a long plateau. */
const TOTAL_STEPS = 10_000;
const INVARIANCE_START = 0.06;
const INVARIANCE_PEAK = 0.26;
const INVARIANCE_SETTLE = 0.16;
/** The share of the run spent rising to the invariance peak. */
const INVARIANCE_PEAK_AT = 0.15;
/** How slowly the invariance loss settles after its peak. */
const INVARIANCE_SETTLE_WIDTH = 0.375;
const SIGREG_FLOOR = 2.5;
/** Starts a little below the top of its chart. */
const SIGREG_START = 90;
/** The relative size of the minibatch noise on each loss. */
const INVARIANCE_NOISE = 0.04;
const SIGREG_NOISE = 0.035;
/** Noise values per run. */
const NOISE_KNOTS = 260;
/** The values on each side averaged into the smooth noise. */
const SMOOTHING_RADIUS = 6;

const EMBEDDING_COUNT = 140;
const PAIR_COUNT = 6;
/** How far apart a pair's two views sit at the invariance peak, in standard deviations. */
const PAIR_SPREAD = 1.2;
/** The collapsed cloud's spread along its two axes at step 0, relative to the target Gaussian. */
const COLLAPSED_SCALE: Vector = [0.3, 0.03];
const COLLAPSED_ANGLE = Math.PI / 5;

/**
 * Gets the invariance loss's smooth trend: easing up to the peak, then decaying with a long tail.
 *
 * @param progress How far through the run.
 * @returns The loss without noise.
 */
function getInvarianceTrend(progress: number): number {
  if (progress < INVARIANCE_PEAK_AT) {
    return interpolate(INVARIANCE_START, INVARIANCE_PEAK, smoothstep(progress / INVARIANCE_PEAK_AT));
  }
  const settling = (progress - INVARIANCE_PEAK_AT) / INVARIANCE_SETTLE_WIDTH;
  return INVARIANCE_SETTLE + (INVARIANCE_PEAK - INVARIANCE_SETTLE) / (1 + settling ** 2);
}

/**
 * Gets the SIGReg loss's smooth trend: a fast drop onto a slowly sinking floor.
 *
 * @param progress How far through the run.
 * @returns The loss without noise.
 */
function getSigregTrend(progress: number): number {
  const floor = SIGREG_FLOOR * (1 + 0.9 * Math.exp(-progress / 0.75));
  return floor + (SIGREG_START - 1.9 * SIGREG_FLOOR) * Math.exp(-progress / 0.09);
}

/** How far the SIGReg loss falls over a run, on a log scale, which sets how far the cloud has spread. */
const SIGREG_LOG_DROP = Math.log(getSigregTrend(0) / getSigregTrend(1));

/**
 * Creates fresh minibatch noise for one loss.
 *
 * @returns The raw and smoothed noise.
 */
function createLossNoise(): LossNoise {
  const raw = Array.from({ length: NOISE_KNOTS }, () => Math.random() * 2 - 1);
  const smooth = raw.map((_, index) => {
    const window = raw.slice(Math.max(index - SMOOTHING_RADIUS, 0), index + SMOOTHING_RADIUS + 1);
    return window.reduce((total, value) => total + value, 0) / window.length;
  });
  return { raw, smooth };
}

/**
 * Creates fresh minibatch noise for both losses, as each run gets.
 *
 * @returns The noise on each loss.
 */
export function createRunNoise(): { invariance: LossNoise; sigreg: LossNoise } {
  return { invariance: createLossNoise(), sigreg: createLossNoise() };
}

/**
 * Reads noise at a point in the run, straight between its values.
 *
 * @param values The noise values.
 * @param progress How far through the run.
 * @returns The noise, from -1 to 1.
 */
function readNoise(values: readonly number[], progress: number): number {
  const position = progress * (values.length - 1);
  const index = Math.min(Math.floor(position), values.length - 2);
  return interpolate(values[index], values[index + 1], position - index);
}

/**
 * Gets the invariance loss at a point in the run, with minibatch noise.
 *
 * @param noise The noise values to apply, raw or smooth.
 * @param progress How far through the run.
 * @returns The loss.
 */
export function getInvarianceLoss(noise: readonly number[], progress: number): number {
  return getInvarianceTrend(progress) * (1 + INVARIANCE_NOISE * readNoise(noise, progress));
}

/**
 * Gets the SIGReg loss at a point in the run, with minibatch noise.
 *
 * @param noise The noise values to apply, raw or smooth.
 * @param progress How far through the run.
 * @returns The loss.
 */
export function getSigregLoss(noise: readonly number[], progress: number): number {
  return getSigregTrend(progress) * (1 + SIGREG_NOISE * readNoise(noise, progress));
}

/**
 * Places an invariance loss on its chart.
 *
 * @param loss The loss.
 * @returns The vertical position, from 0 at the top to 100 at the bottom.
 */
export function getInvarianceY(loss: number): number {
  return 100 - (Math.min(loss, INVARIANCE_MAX) / INVARIANCE_MAX) * 100;
}

/**
 * Places a SIGReg loss on its chart.
 *
 * @param loss The loss.
 * @returns The vertical position, from 0 at the top to 100 at the bottom.
 */
export function getSigregY(loss: number): number {
  return 100 - (Math.min(loss, SIGREG_MAX) / SIGREG_MAX) * 100;
}

/**
 * Draws a whole run's loss curve through its noise knots, to be revealed as the run plays.
 *
 * @param getY Places a point in the run on the chart.
 * @returns The polyline's `points` attribute, on a 100 by 100 chart.
 */
export function drawLossCurve(getY: (progress: number) => number): string {
  return formatPoints(
    Array.from({ length: NOISE_KNOTS }, (_, index) => {
      const progress = index / (NOISE_KNOTS - 1);
      return [progress * 100, getY(progress)];
    }),
  );
}

/**
 * Formats the training step at a point in the run.
 *
 * @param progress How far through the run.
 * @returns The step, rounded to hundreds.
 */
export function formatStep(progress: number): string {
  return (Math.round((progress * TOTAL_STEPS) / 100) * 100).toLocaleString('en-US');
}

/**
 * Samples where each embedding sits once training has spread the cloud into the target Gaussian.
 *
 * @returns The embeddings.
 */
export function sampleEmbeddings(): Vector[] {
  return Array.from({ length: EMBEDDING_COUNT }, () => [sampleGaussian(), sampleGaussian()]);
}

/**
 * Samples the pairs of views to follow.
 *
 * @returns The pairs.
 */
export function sampleViewPairs(): ViewPair[] {
  return Array.from({ length: PAIR_COUNT }, () => {
    const angle = Math.random() * 2 * Math.PI;
    return {
      center: [sampleGaussian() * 0.8, sampleGaussian() * 0.8],
      direction: [Math.cos(angle), Math.sin(angle)],
    };
  });
}

/**
 * Shapes the embedding cloud at a point in the run, following the loss trends without their noise. A falling
 * SIGReg loss stretches the collapsed, flattened cloud out to the round target Gaussian, and the invariance loss
 * sets how far apart each pair's two views sit.
 *
 * @param embeddings The embeddings' trained positions.
 * @param pairs The pairs of views.
 * @param progress How far through the run.
 * @returns The cloud to draw.
 */
export function shapeCloud(embeddings: readonly Vector[], pairs: readonly ViewPair[], progress: number): Cloud {
  const spread = smoothstep(clamp(Math.log(getSigregTrend(0) / getSigregTrend(progress)) / SIGREG_LOG_DROP, 0, 1));
  const scaleAlong = interpolate(COLLAPSED_SCALE[0], 1, spread);
  const scaleAcross = interpolate(COLLAPSED_SCALE[1], 1, spread);
  const cos = Math.cos(COLLAPSED_ANGLE);
  const sin = Math.sin(COLLAPSED_ANGLE);

  /**
   * Squeezes a trained position into the cloud's current shape.
   *
   * @param position The trained position.
   * @returns The position now.
   */
  function squeeze([x, y]: Vector): Vector {
    const along = (x * cos + y * sin) * scaleAlong;
    const across = (-x * sin + y * cos) * scaleAcross;
    return [along * cos - across * sin, along * sin + across * cos];
  }

  // Squared, so the spike and the settling read clearly; not scaled with the cloud, so the gap shows the loss itself
  const separation = (PAIR_SPREAD / 2) * (getInvarianceTrend(progress) / INVARIANCE_PEAK) ** 2;
  return {
    points: embeddings.map(squeeze),
    pairs: pairs.map(({ center, direction: [directionX, directionY] }) => {
      const [centerX, centerY] = squeeze(center);
      return [
        [centerX + directionX * separation, centerY + directionY * separation],
        [centerX - directionX * separation, centerY - directionY * separation],
      ];
    }),
  };
}
