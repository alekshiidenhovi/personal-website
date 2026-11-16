/**
 * Whether the user asked the system for less motion, read once at load.
 * Animations check it to start in, or jump to, a meaningful still state.
 */
export const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Cubic ease-in-out, for 0..1 progress */
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

/** Cubic ease-out, for 0..1 progress */
export const easeOut = (t: number) => 1 - (1 - t) ** 3;

/**
 * Calls `onFrame` with progress from 0 to 1 on every animation frame for
 * `durationMs`, ending on exactly 1. Returns a function that cancels it.
 */
export function tween(durationMs: number, onFrame: (t: number) => void) {
  let frameId = 0;
  const start = performance.now();
  const frame = (now: number) => {
    const t = Math.min((now - start) / durationMs, 1);
    onFrame(t);
    if (t < 1) frameId = requestAnimationFrame(frame);
  };
  frameId = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(frameId);
}
