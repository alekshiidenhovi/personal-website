import { onUnmounted, type WatchSource, watch } from 'vue';
import { prefersReducedMotion } from '../lib/motion';

/**
 * Calls back at a fixed interval while active, for visuals that move in discrete steps. Never ticks when the user
 * prefers reduced motion, so a visual must render a meaningful still state up front.
 *
 * @param isActive Whether the visual is playing.
 * @param onTick Called on every tick.
 * @param intervalMs The time between ticks, in milliseconds.
 */
export function useLiveTicker(isActive: WatchSource<boolean>, onTick: () => void, intervalMs: number) {
  let intervalId: ReturnType<typeof setInterval> | undefined;

  /** Stops ticking, if it was. */
  function stopTicking() {
    clearInterval(intervalId);
    intervalId = undefined;
  }

  watch(
    isActive,
    (isNowActive) => {
      if (isNowActive && !prefersReducedMotion) {
        intervalId ??= setInterval(onTick, intervalMs);
      } else {
        stopTicking();
      }
    },
    { immediate: true },
  );

  onUnmounted(stopTicking);
}
