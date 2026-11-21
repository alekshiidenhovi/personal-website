import { onUnmounted, type WatchSource, watch } from 'vue';
import { prefersReducedMotion } from '../lib/motion';

/** The longest step between frames, so an animation doesn't leap ahead after the tab was in the background. */
const MAX_FRAME_DELTA_MS = 100;

/** The timing of an animation frame. */
export interface AnimationFrame {
  /** The frame's time, in milliseconds. */
  readonly timeMs: number;
  /** The time since the previous frame, capped; 0 on the first frame. */
  readonly deltaMs: number;
}

/**
 * Calls back on every animation frame while active, for visuals that move continuously. Never runs when the user
 * prefers reduced motion, so a visual must render a meaningful still state up front.
 *
 * @param isActive Whether the visual is playing.
 * @param onFrame Called on every frame with its timing.
 */
export function useAnimationFrame(isActive: WatchSource<boolean>, onFrame: (frame: AnimationFrame) => void) {
  let frameId = 0;
  let lastTimeMs: number | undefined;

  /**
   * Runs a frame and schedules the next.
   *
   * @param timeMs The frame's time, in milliseconds.
   */
  function runFrame(timeMs: number) {
    const deltaMs = Math.min(timeMs - (lastTimeMs ?? timeMs), MAX_FRAME_DELTA_MS);
    lastTimeMs = timeMs;
    onFrame({ timeMs, deltaMs });
    frameId = requestAnimationFrame(runFrame);
  }

  /** Stops the frames, if they were running. */
  function stopFrames() {
    cancelAnimationFrame(frameId);
    frameId = 0;
  }

  watch(
    isActive,
    (isNowActive) => {
      stopFrames();
      if (isNowActive && !prefersReducedMotion) {
        lastTimeMs = undefined;
        frameId = requestAnimationFrame(runFrame);
      }
    },
    { immediate: true },
  );

  onUnmounted(stopFrames);
}
