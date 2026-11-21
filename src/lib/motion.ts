/**
 * Whether the user asked the system for less motion, read once at load. Animations check it to start in, or jump
 * to, a meaningful still state.
 */
export const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Eases progress in and out, on a cubic curve.
 *
 * @param progress Linear progress, from 0 to 1.
 * @returns The eased progress, from 0 to 1.
 */
export function easeInOut(progress: number): number {
  return progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
}
