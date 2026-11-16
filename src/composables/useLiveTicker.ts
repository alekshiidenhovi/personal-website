import { onUnmounted, type Ref, watch } from "vue";
import { prefersReducedMotion } from "../lib/motion";

/**
 * Calls `onTick` every `intervalMs` while `isActive` is true.
 * Does nothing when the user prefers reduced motion, so callers should
 * render a meaningful static state up front.
 */
export function useLiveTicker(isActive: Ref<boolean>, onTick: () => void, intervalMs: number) {
  let intervalId: ReturnType<typeof setInterval> | undefined;

  const stop = () => {
    clearInterval(intervalId);
    intervalId = undefined;
  };

  watch(
    isActive,
    (active) => {
      if (active && !prefersReducedMotion) intervalId ??= setInterval(onTick, intervalMs);
      else stop();
    },
    { immediate: true },
  );

  onUnmounted(stop);
}
