/**
 * Whether the user asked the system for less motion, read once at load.
 * Animations check it to start in, or jump to, a meaningful still state.
 */
export const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Cubic ease-in-out, for 0..1 progress */
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
