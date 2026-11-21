import type { Vector } from './math';

/**
 * Formats points for an SVG polyline's or polygon's `points` attribute.
 *
 * @param points The points.
 * @returns The attribute value.
 */
export function formatPoints(points: readonly Vector[]): string {
  return points.map(([x, y]) => `${x},${y}`).join(' ');
}
