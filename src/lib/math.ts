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
