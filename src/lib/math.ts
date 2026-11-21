/** A position in two dimensions. */
export type Vector = [x: number, y: number];

/**
 * Limits a value to a range.
 *
 * @param value The value to limit.
 * @param min The lowest allowed value.
 * @param max The highest allowed value.
 * @returns The value, or the nearer bound when it lies outside the range.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Interpolates linearly between two values.
 *
 * @param from The value at an amount of 0.
 * @param to The value at an amount of 1.
 * @param amount How far to go from `from` towards `to`.
 * @returns The interpolated value.
 */
export function interpolate(from: number, to: number, amount: number): number {
  return from + (to - from) * amount;
}

/**
 * Samples the standard normal distribution, by the Box–Muller transform.
 *
 * @returns A sample with mean 0 and standard deviation 1.
 */
export function sampleGaussian(): number {
  // 1 - random() is in (0, 1], so the logarithm never sees 0
  return Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());
}

/**
 * Picks an index at random, each with a chance proportional to its weight.
 *
 * @param weights The weights, all positive.
 * @returns The picked index.
 */
export function pickWeightedIndex(weights: readonly number[]): number {
  let roll = Math.random() * weights.reduce((total, weight) => total + weight, 0);
  let index = 0;
  while (index < weights.length - 1 && roll >= weights[index]) {
    roll -= weights[index];
    index++;
  }
  return index;
}

/**
 * Eases a value from 0 to 1 along a smooth S-curve, flat at both ends.
 *
 * @param progress Linear progress, from 0 to 1.
 * @returns The eased progress, from 0 to 1.
 */
export function smoothstep(progress: number): number {
  return progress * progress * (3 - 2 * progress);
}

/**
 * Picks an item at random, each equally likely.
 *
 * @param items The items, at least one.
 * @returns The picked item.
 */
export function pickRandomItem<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}
