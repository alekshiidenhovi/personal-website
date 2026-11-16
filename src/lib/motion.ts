/**
 * Whether the user asked the system for less motion, read once at load.
 * Animations check it to start in, or jump to, a meaningful still state.
 */
export const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
