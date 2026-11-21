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

/**
 * Eases progress out, on a cubic curve: fast at first, settling gently.
 *
 * @param progress Linear progress, from 0 to 1.
 * @returns The eased progress, from 0 to 1.
 */
export function easeOut(progress: number): number {
  return 1 - (1 - progress) ** 3;
}

/**
 * Animates progress from 0 to 1 over a duration, calling back on every animation frame and ending on exactly 1.
 *
 * @param durationMs How long the animation takes, in milliseconds.
 * @param onFrame Called each frame with the progress, from 0 to 1.
 * @returns A function that cancels the animation.
 */
export function tween(durationMs: number, onFrame: (progress: number) => void): () => void {
  const startMs = performance.now();
  let frameId = 0;

  /**
   * Reports the progress at a frame, and schedules the next frame until the end.
   *
   * @param timeMs The frame's time, in milliseconds.
   */
  function advanceFrame(timeMs: number) {
    const progress = Math.min((timeMs - startMs) / durationMs, 1);
    onFrame(progress);
    if (progress < 1) {
      frameId = requestAnimationFrame(advanceFrame);
    }
  }

  frameId = requestAnimationFrame(advanceFrame);
  return () => cancelAnimationFrame(frameId);
}
